const crypto = require('crypto');

// Generate unique request ID
const generateRequestId = () => crypto.randomBytes(8).toString('hex');

// Performance monitoring utilities
const performanceTracker = new Map();

const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'INFO',
      timestamp,
      message,
      ...meta
    };
    console.log(`[INFO] ${timestamp}: ${message}`, logEntry);
  },
  
  error: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'ERROR',
      timestamp,
      message,
      ...meta
    };
    console.error(`[ERROR] ${timestamp}: ${message}`, logEntry);
  },
  
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'WARN',
      timestamp,
      message,
      ...meta
    };
    console.warn(`[WARN] ${timestamp}: ${message}`, logEntry);
  },
  
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const logEntry = {
        level: 'DEBUG',
        timestamp,
        message,
        ...meta
      };
      console.log(`[DEBUG] ${timestamp}: ${message}`, logEntry);
    }
  },
  
  // Performance tracking
  startTimer: (operation, requestId) => {
    const key = `${requestId}-${operation}`;
    performanceTracker.set(key, {
      operation,
      requestId,
      startTime: process.hrtime.bigint()
    });
  },
  
  endTimer: (operation, requestId, meta = {}) => {
    const key = `${requestId}-${operation}`;
    const tracker = performanceTracker.get(key);
    
    if (tracker) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - tracker.startTime) / 1e6; // Convert to milliseconds
      
      logger.info(`Performance: ${operation} completed`, {
        operation,
        requestId,
        duration: `${duration.toFixed(2)}ms`,
        ...meta
      });
      
      performanceTracker.delete(key);
      
      // Log slow operations
      if (duration > 1000) {
        logger.warn(`Slow operation detected: ${operation}`, {
          operation,
          requestId,
          duration: `${duration.toFixed(2)}ms`,
          ...meta
        });
      }
    }
  },
  
  // HTTP request logging
  httpRequest: (req, res, requestId, duration) => {
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user ? req.user._id : 'anonymous'
    };
    
    if (res.statusCode >= 400) {
      logger.error(`HTTP ${res.statusCode}: ${req.method} ${req.originalUrl}`, logData);
    } else if (duration > 1000) {
      logger.warn(`Slow HTTP request: ${req.method} ${req.originalUrl}`, logData);
    } else {
      logger.info(`HTTP ${res.statusCode}: ${req.method} ${req.originalUrl}`, logData);
    }
  },
  
  // Database operation logging
  dbOperation: (operation, collection, duration, query = {}, requestId) => {
    const logData = {
      operation,
      collection,
      duration: `${duration}ms`,
      requestId,
      query: process.env.NODE_ENV === 'development' ? query : undefined
    };
    
    if (duration > 500) {
      logger.warn(`Slow DB operation: ${operation} on ${collection}`, logData);
    } else {
      logger.debug(`DB operation: ${operation} on ${collection}`, logData);
    }
  },
  
  generateRequestId
};

module.exports = logger;
