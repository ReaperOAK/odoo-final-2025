const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const rentalRoutes = require('./routes/rental.routes');

// Import middleware
const { errorMiddleware, notFoundMiddleware } = require('./middleware/error.middleware');
const logger = require('./utils/logger');

const app = express();

// Trust proxy for accurate rate limiting and IP detection
app.set('trust proxy', 1);

// Compression middleware for better performance
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses over 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Security middleware configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: {
    error: true,
    message,
    retryAfter: Math.ceil(windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
  keyGenerator: (req) => {
    // Use IP + User Agent for more accurate rate limiting
    return `${req.ip}-${req.get('User-Agent')}`;
  }
});

// Different rate limits for different endpoints
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // limit each IP to 1000 requests per windowMs
  'Too many requests from this IP, please try again later'
);

const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // limit each IP to 10 auth requests per windowMs
  'Too many authentication attempts, please try again later'
);

const strictLimiter = createRateLimit(
  60 * 1000, // 1 minute
  20, // limit each IP to 20 requests per minute for sensitive operations
  'Rate limit exceeded for sensitive operations'
);

// Apply rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/rentals/create', strictLimiter);
app.use('/api', generalLimiter);

// CORS configuration with environment-specific origins
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // React dev server
      'https://localhost:3000',
      'https://localhost:5173'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-auth-token'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Security middleware to prevent NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('Potential NoSQL injection attempt detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      key,
      url: req.originalUrl
    });
  }
}));

// Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: ['status', 'sort', 'page', 'limit'] // Allow arrays for these parameters
}));

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.requestId = logger.generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Enhanced logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      // Parse morgan log format and extract useful information
      const logParts = message.trim().split(' ');
      if (logParts.length >= 10) {
        const [ip, , , , timestamp, method, url, protocol, status, size, , userAgent] = logParts;
        
        logger.info('HTTP Request', {
          ip: ip.replace(/"/g, ''),
          method: method.replace(/"/g, ''),
          url: url.replace(/"/g, ''),
          status: parseInt(status),
          responseSize: size !== '-' ? parseInt(size) : 0,
          userAgent: userAgent?.replace(/"/g, ''),
          timestamp
        });
      }
    }
  }
}));

// Performance monitoring middleware
app.use((req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
    
    logger.httpRequest(req, res, req.requestId, duration);
  });
  
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    requestId: req.requestId
  };
  
  res.status(200).json(healthcheck);
});

app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbState];
    
    const isHealthy = dbState === 1;
    
    const healthcheck = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: dbStatus,
        connected: dbState === 1
      },
      memory: process.memoryUsage(),
      requestId: req.requestId
    };
    
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(healthcheck);
    
  } catch (error) {
    logger.error('Health check failed', { 
      error: error.message, 
      requestId: req.requestId 
    });
    
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'Rental Management System API',
    version: '1.0.0',
    description: 'RESTful API for managing rental products and bookings',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      rentals: '/api/rentals'
    },
    documentation: {
      health: '/health',
      apiHealth: '/api/health'
    },
    requestId: req.requestId
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/rentals', rentalRoutes);

// Catch-all 404 handler for unmatched routes
app.use(notFoundMiddleware);

// Global error handling middleware (must be last)
app.use(errorMiddleware);

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Starting graceful shutdown...');
  
  // Close database connections
  mongoose.connection.close(false, () => {
    logger.info('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Starting graceful shutdown...');
  
  // Close database connections
  mongoose.connection.close(false, () => {
    logger.info('MongoDB connection closed.');
    process.exit(0);
  });
});

module.exports = app;
