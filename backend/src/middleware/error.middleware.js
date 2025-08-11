const logger = require('../utils/logger');

// Error types for better categorization
const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTHENTICATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  DATABASE: 'DATABASE_ERROR',
  EXTERNAL: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL: 'INTERNAL_SERVER_ERROR'
};

// Custom error class for better error handling
class AppError extends Error {
  constructor(message, statusCode, type = ERROR_TYPES.INTERNAL, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Main error handling middleware
const errorMiddleware = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  
  // Log error with context
  logger.error('Error occurred', {
    requestId,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user._id : 'anonymous',
    body: process.env.NODE_ENV === 'development' ? req.body : undefined
  });

  let error = { ...err };
  error.message = err.message;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    
    error = new AppError(
      'Validation failed',
      400,
      ERROR_TYPES.VALIDATION,
      errors
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    error = new AppError(
      `Duplicate field value: ${field}`,
      400,
      ERROR_TYPES.CONFLICT,
      { field, value }
    );
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new AppError(
      `Invalid ${err.path}: ${err.value}`,
      400,
      ERROR_TYPES.VALIDATION,
      { field: err.path, value: err.value }
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError(
      'Invalid token. Please log in again',
      401,
      ERROR_TYPES.AUTH
    );
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError(
      'Your token has expired. Please log in again',
      401,
      ERROR_TYPES.AUTH
    );
  }

  // MongoDB connection errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    error = new AppError(
      'Database service temporarily unavailable',
      503,
      ERROR_TYPES.DATABASE
    );
  }

  // MongoDB network timeout
  if (err.name === 'MongoNetworkTimeoutError') {
    error = new AppError(
      'Database connection timeout',
      503,
      ERROR_TYPES.DATABASE
    );
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = new AppError(
      'Too many requests. Please try again later',
      429,
      ERROR_TYPES.RATE_LIMIT
    );
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError(
      'File too large',
      400,
      ERROR_TYPES.VALIDATION,
      { maxSize: err.limit }
    );
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    error = new AppError(
      'Cross-origin request blocked',
      403,
      ERROR_TYPES.PERMISSION
    );
  }

  // Prepare error response
  const errorResponse = {
    error: true,
    message: error.message || 'Something went wrong',
    type: error.type || ERROR_TYPES.INTERNAL,
    requestId,
    timestamp: error.timestamp || new Date().toISOString()
  };

  // Add details for client-side handling (only in development or for specific error types)
  if (process.env.NODE_ENV === 'development' || 
      [ERROR_TYPES.VALIDATION, ERROR_TYPES.CONFLICT].includes(error.type)) {
    errorResponse.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  // Set status code
  const statusCode = error.statusCode || error.status || 500;

  // Send response
  res.status(statusCode).json(errorResponse);
};

// 404 handler for unmatched routes
const notFoundMiddleware = (req, res, next) => {
  const requestId = req.requestId || 'unknown';
  
  logger.warn('Route not found', {
    requestId,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    ERROR_TYPES.NOT_FOUND
  );

  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason.message || reason,
    stack: reason.stack,
    promise
  });
  
  // Close server gracefully
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  // Close server gracefully
  process.exit(1);
});

module.exports = {
  errorMiddleware,
  notFoundMiddleware,
  asyncHandler,
  AppError,
  ERROR_TYPES
};

module.exports = errorMiddleware;
