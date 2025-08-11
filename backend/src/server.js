const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger');
require('dotenv').config();

// Uncaught Exception Handler
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception! Shutting down...', { 
    error: err.message,
    stack: err.stack 
  });
  process.exit(1);
});

// Unhandled Promise Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection! Shutting down...', { 
    reason: reason?.message || reason,
    promise: promise.toString()
  });
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rental-system';

// Enhanced MongoDB connection configuration
const mongooseOptions = {
  // Connection pool settings
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5,  // Maintain a minimum of 5 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  
  // Buffering settings
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
  
  // Auto index settings
  autoIndex: NODE_ENV === 'development', // Only auto-build indexes in development
  autoCreate: true, // Auto-create collections
  
  // Replica set settings (if using replica sets)
  readPreference: 'primary',
  
  // Heartbeat settings
  heartbeatFrequencyMS: 10000, // How often to check server status
  
  // Error handling
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Performance monitoring for database operations
mongoose.set('debug', (collectionName, method, query, doc, options) => {
  if (NODE_ENV === 'development') {
    logger.debug('MongoDB Operation', {
      collection: collectionName,
      method,
      query: JSON.stringify(query),
      options: JSON.stringify(options)
    });
  }
});

// Connection event handlers
mongoose.connection.on('connecting', () => {
  logger.info('Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  logger.info('Connected to MongoDB successfully', {
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  });
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

mongoose.connection.on('close', () => {
  logger.info('MongoDB connection closed');
});

// Graceful shutdown function
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      resolve();
    }, 10000); // 10 second timeout
    
    mongoose.connection.close(false, () => {
      clearTimeout(timeout);
      logger.info('MongoDB connection closed through app termination');
      resolve();
    });
  });
};

// Database connection with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`Database connection attempt ${attempt}/${retries}`);
      await mongoose.connect(MONGODB_URI, mongooseOptions);
      return; // Success, exit the retry loop
    } catch (error) {
      logger.error(`Database connection attempt ${attempt} failed:`, {
        error: error.message,
        attempt,
        retries
      });
      
      if (attempt === retries) {
        logger.error('All database connection attempts failed. Exiting...');
        process.exit(1);
      }
      
      logger.info(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff: increase delay for next attempt
      delay = Math.min(delay * 1.5, 30000); // Cap at 30 seconds
    }
  }
};

// Server startup function
const startServer = async () => {
  try {
    // Connect to database first
    await connectWithRetry();
    
    // Start the server
    const server = app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: NODE_ENV,
        processId: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      });
      
      // Log available routes in development
      if (NODE_ENV === 'development') {
        logger.info('Available routes:', {
          health: `http://localhost:${PORT}/health`,
          api: `http://localhost:${PORT}/api`,
          auth: `http://localhost:${PORT}/api/auth`,
          products: `http://localhost:${PORT}/api/products`,
          rentals: `http://localhost:${PORT}/api/rentals`
        });
      }
    });
    
    // Configure server timeout settings
    server.timeout = 120000; // 2 minutes
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds (should be higher than keepAliveTimeout)
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', { error: error.message });
      }
      process.exit(1);
    });
    
    // Graceful shutdown handlers
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received');
      server.close(async () => {
        await gracefulShutdown('SIGTERM');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', async () => {
      logger.info('SIGINT received');
      server.close(async () => {
        await gracefulShutdown('SIGINT');
        process.exit(0);
      });
    });
    
    // Handle server close
    server.on('close', () => {
      logger.info('Server closed');
    });
    
    return server;
    
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message });
    process.exit(1);
  }
};

// Performance monitoring
if (NODE_ENV === 'production') {
  // Monitor memory usage
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    logger.info('Performance metrics', {
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: Math.round(process.uptime()),
      connections: mongoose.connection.readyState
    });
  }, 300000); // Every 5 minutes
}

// Start the server
startServer().catch((error) => {
  logger.error('Startup failed:', { error: error.message });
  process.exit(1);
});
