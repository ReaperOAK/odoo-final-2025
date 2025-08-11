const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const { AppError, ERROR_TYPES } = require('./error.middleware');

// User cache for better performance (5 minutes cache)
const userCache = new Map();
const USER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting for authentication attempts
const authAttempts = new Map();
const MAX_AUTH_ATTEMPTS = 10;
const AUTH_WINDOW = 15 * 60 * 1000; // 15 minutes

/**
 * Get user from cache or database
 * @param {String} userId - User ID
 * @param {String} requestId - Request ID for logging
 * @returns {Object} User object
 */
const getCachedUser = async (userId, requestId) => {
  const cacheKey = `user-${userId}`;
  const cached = userCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < USER_CACHE_DURATION) {
    logger.debug('User cache hit', { userId, requestId });
    return cached.user;
  }
  
  logger.startTimer('user-fetch', requestId);
  // Use lean() for better performance as we don't need Mongoose document methods
  const user = await User.findById(userId).lean();
  logger.endTimer('user-fetch', requestId, { userId });
  
  if (user) {
    userCache.set(cacheKey, {
      user,
      timestamp: Date.now()
    });
    
    // Clean up expired cache entries
    setTimeout(() => {
      if (userCache.has(cacheKey)) {
        const entry = userCache.get(cacheKey);
        if (Date.now() - entry.timestamp >= USER_CACHE_DURATION) {
          userCache.delete(cacheKey);
        }
      }
    }, USER_CACHE_DURATION);
  }
  
  return user;
};

/**
 * Check rate limiting for authentication
 * @param {String} identifier - IP address or user identifier
 * @returns {Boolean} Whether the request is allowed
 */
const checkAuthRateLimit = (identifier) => {
  // Skip rate limiting in test/development environment or when test flag is set
  const isTestOrDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
  const isTestMode = process.env.BYPASS_RATE_LIMIT === 'true';
  
  if (isTestOrDev || isTestMode) {
    return true;
  }
  
  const now = Date.now();
  const attempts = authAttempts.get(identifier) || { count: 0, resetTime: now + AUTH_WINDOW };
  
  // Reset counter if window expired
  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + AUTH_WINDOW;
  }
  
  attempts.count++;
  authAttempts.set(identifier, attempts);
  
  return attempts.count <= MAX_AUTH_ATTEMPTS;
};

/**
 * Enhanced authentication middleware with caching and rate limiting
 */
const authMiddleware = async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  req.requestId = requestId;
  
  try {
    logger.startTimer('auth-middleware', requestId);
    
    // Extract token from multiple possible locations
    let token = null;
    
    // Check Authorization header (Bearer token)
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Check x-auth-token header (alternative)
    if (!token) {
      token = req.header('x-auth-token');
    }
    
    // Check cookie (for browser requests)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      logger.warn('Authentication failed - No token provided', {
        requestId,
        ip: req.ip,
        url: req.originalUrl,
        userAgent: req.get('User-Agent')
      });
      
      logger.endTimer('auth-middleware', requestId, { result: 'no-token' });
      throw new AppError('Access denied. No token provided', 401, ERROR_TYPES.AUTH);
    }
    
    // Rate limiting check
    const clientIdentifier = req.ip || 'unknown';
    if (!checkAuthRateLimit(clientIdentifier)) {
      logger.warn('Authentication rate limit exceeded', {
        requestId,
        ip: req.ip,
        url: req.originalUrl
      });
      
      logger.endTimer('auth-middleware', requestId, { result: 'rate-limited' });
      throw new AppError('Too many authentication attempts. Please try again later', 429, ERROR_TYPES.RATE_LIMIT);
    }
    
    // Verify JWT token
    logger.startTimer('jwt-verify', requestId);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.endTimer('jwt-verify', requestId);
    
    if (!decoded.userId) {
      logger.warn('Authentication failed - Invalid token payload', {
        requestId,
        ip: req.ip
      });
      
      logger.endTimer('auth-middleware', requestId, { result: 'invalid-payload' });
      throw new AppError('Invalid token payload', 401, ERROR_TYPES.AUTH);
    }
    
    // Get user with caching
    const user = await getCachedUser(decoded.userId, requestId);
    
    if (!user) {
      logger.warn('Authentication failed - User not found', {
        requestId,
        userId: decoded.userId,
        ip: req.ip
      });
      
      logger.endTimer('auth-middleware', requestId, { result: 'user-not-found' });
      throw new AppError('Invalid token. User not found', 401, ERROR_TYPES.AUTH);
    }
    
    // Check if user account is still active/valid
    if (user.status && user.status === 'disabled') {
      logger.warn('Authentication failed - User account disabled', {
        requestId,
        userId: user._id,
        ip: req.ip
      });
      
      logger.endTimer('auth-middleware', requestId, { result: 'account-disabled' });
      throw new AppError('Account has been disabled', 401, ERROR_TYPES.AUTH);
    }
    
    // Attach user to request object
    req.user = user;
    
    logger.debug('Authentication successful', {
      requestId,
      userId: user._id,
      role: user.role,
      email: user.email
    });
    
    logger.endTimer('auth-middleware', requestId, { result: 'success', userId: user._id });
    next();
    
  } catch (error) {
    logger.endTimer('auth-middleware', requestId, { result: 'error' });
    
    // Handle JWT specific errors
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token format', 401, ERROR_TYPES.AUTH));
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.info('Token expired', {
        requestId,
        ip: req.ip,
        expiredAt: error.expiredAt
      });
      return next(new AppError('Token has expired. Please log in again', 401, ERROR_TYPES.AUTH));
    }
    
    if (error.name === 'NotBeforeError') {
      return next(new AppError('Token not active yet', 401, ERROR_TYPES.AUTH));
    }
    
    // Pass other errors to error handler
    next(error);
  }
};

/**
 * Role-based access control middleware
 */
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    
    if (!req.user) {
      logger.error('Role check failed - No user in request', { requestId });
      return next(new AppError('Authentication required', 401, ERROR_TYPES.AUTH));
    }
    
    // Check if user has any of the allowed roles
    const userRoles = req.user.roles || [req.user.role]; // Support both roles array and single role
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      logger.warn('Role access denied', {
        requestId,
        userId: req.user._id,
        userRoles: userRoles,
        requiredRoles: allowedRoles,
        url: req.originalUrl
      });
      
      return next(new AppError(`Access denied. Required roles: ${allowedRoles.join(', ')}`, 403, ERROR_TYPES.PERMISSION));
    }
    
    logger.debug('Role access granted', {
      requestId,
      userId: req.user._id,
      userRoles: userRoles,
      requiredRoles: allowedRoles,
      url: req.originalUrl
    });
    
    next();
  };
};

/**
 * Admin role verification middleware
 */
const isAdmin = (req, res, next) => {
  const requestId = req.requestId || 'unknown';
  
  if (!req.user) {
    logger.error('Admin check failed - No user in request', { requestId });
    return next(new AppError('Authentication required', 401, ERROR_TYPES.AUTH));
  }
  
  if (req.user.role !== 'admin') {
    logger.warn('Admin access denied', {
      requestId,
      userId: req.user._id,
      userRole: req.user.role,
      url: req.originalUrl
    });
    
    return next(new AppError('Access denied. Admin privileges required', 403, ERROR_TYPES.PERMISSION));
  }
  
  logger.debug('Admin access granted', {
    requestId,
    userId: req.user._id,
    url: req.originalUrl
  });
  
  next();
};

/**
 * Optional authentication middleware (for public endpoints that can use user context if available)
 */
const optionalAuth = async (req, res, next) => {
  try {
    await authMiddleware(req, res, () => {});
    next();
  } catch (error) {
    // Don't fail for optional auth, just proceed without user
    req.user = null;
    next();
  }
};

/**
 * Resource ownership verification middleware
 */
const isOwnerOrAdmin = (resourceUserField = 'customer') => {
  return (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    
    if (!req.user) {
      return next(new AppError('Authentication required', 401, ERROR_TYPES.AUTH));
    }
    
    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user owns the resource
    const resource = req.resource; // Should be set by a previous middleware
    if (!resource) {
      logger.error('Resource ownership check failed - No resource in request', { requestId });
      return next(new AppError('Resource not found', 404, ERROR_TYPES.NOT_FOUND));
    }
    
    const resourceUserId = resource[resourceUserField];
    if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
      logger.warn('Resource access denied', {
        requestId,
        userId: req.user._id,
        resourceId: resource._id,
        resourceOwner: resourceUserId
      });
      
      return next(new AppError('Access denied. You can only access your own resources', 403, ERROR_TYPES.PERMISSION));
    }
    
    next();
  };
};

/**
 * Clear user cache (for testing or when user data changes)
 */
const clearUserCache = (userId = null) => {
  if (userId) {
    const cacheKey = `user-${userId}`;
    userCache.delete(cacheKey);
    logger.debug('User cache cleared', { userId });
  } else {
    userCache.clear();
    logger.info('All user cache cleared');
  }
};

/**
 * Clear auth rate limit data (for testing)
 */
const clearAuthRateLimit = (identifier = null) => {
  if (identifier) {
    authAttempts.delete(identifier);
  } else {
    authAttempts.clear();
  }
};

module.exports = { 
  verifyToken: authMiddleware,  // Add alias for consistency with routes
  authMiddleware, 
  isAdmin, 
  requireRoles,
  optionalAuth,
  isOwnerOrAdmin,
  clearUserCache,
  clearAuthRateLimit
};
