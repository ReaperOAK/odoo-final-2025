const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const { asyncHandler, AppError, ERROR_TYPES } = require('../middleware/error.middleware');

// Login attempt tracking
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Generate JWT token with additional security
 */
const generateToken = (userId) => {
  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    jti: require('crypto').randomBytes(16).toString('hex') // Unique token ID
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'rental-system',
    audience: 'rental-users'
  });
};

/**
 * Check and update login attempts
 */
const checkLoginAttempts = (email, ip) => {
  const key = `${email}-${ip}`;
  const now = Date.now();
  const attempts = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  
  // Check if account is locked
  if (attempts.lockedUntil > now) {
    const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
    throw new AppError(
      `Account temporarily locked. Try again in ${remainingTime} minutes`,
      429,
      ERROR_TYPES.RATE_LIMIT,
      { remainingTime }
    );
  }
  
  // Reset attempts if lockout period has passed
  if (attempts.lockedUntil > 0 && now > attempts.lockedUntil) {
    attempts.count = 0;
    attempts.lockedUntil = 0;
  }
  
  return attempts;
};

/**
 * Update login attempts on failure
 */
const updateLoginAttempts = (email, ip) => {
  const key = `${email}-${ip}`;
  const attempts = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  
  attempts.count++;
  
  // Lock account after max attempts
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
  
  loginAttempts.set(key, attempts);
};

/**
 * Clear login attempts on successful login
 */
const clearLoginAttempts = (email, ip) => {
  const key = `${email}-${ip}`;
  loginAttempts.delete(key);
};

/**
 * Register new user
 */
const register = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { name, email, password, role } = req.body;

  logger.info('User registration started', { 
    email, 
    role: role || 'customer',
    requestId 
  });

  logger.startTimer('user-registration', requestId);

  // Check if user already exists
  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    logger.warn('Registration failed - Email already exists', { 
      email, 
      requestId 
    });
    
    logger.endTimer('user-registration', requestId, { result: 'email-exists' });
    throw new AppError(
      'User with this email already exists',
      400,
      ERROR_TYPES.CONFLICT,
      { field: 'email', value: email }
    );
  }

  // Create new user (password will be hashed by pre-save hook)
  const user = new User({ 
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: role || 'customer'
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Remove password from response
  const userResponse = user.toJSON();

  logger.info('User registered successfully', { 
    userId: user._id, 
    email,
    role: user.role,
    requestId 
  });

  logger.endTimer('user-registration', requestId, { result: 'success' });

  res.status(201).json({
    error: false,
    message: 'User registered successfully',
    token,
    user: userResponse,
    requestId
  });
});

/**
 * Login user with enhanced security
 */
const login = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { email, password } = req.body;
  const clientIp = req.ip || 'unknown';

  logger.info('User login attempt', { 
    email, 
    ip: clientIp,
    userAgent: req.get('User-Agent'),
    requestId 
  });

  logger.startTimer('user-login', requestId);

  // Check login attempts and rate limiting
  const attempts = checkLoginAttempts(email, clientIp);

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    updateLoginAttempts(email, clientIp);
    
    logger.warn('Login failed - User not found', { 
      email, 
      ip: clientIp,
      attempts: attempts.count + 1,
      requestId 
    });
    
    logger.endTimer('user-login', requestId, { result: 'user-not-found' });
    
    // Generic error message to prevent email enumeration
    throw new AppError(
      'Invalid email or password',
      401,
      ERROR_TYPES.AUTH
    );
  }

  // Check if account is disabled
  if (user.status === 'disabled') {
    logger.warn('Login failed - Account disabled', { 
      userId: user._id,
      email, 
      ip: clientIp,
      requestId 
    });
    
    logger.endTimer('user-login', requestId, { result: 'account-disabled' });
    throw new AppError(
      'Account has been disabled. Please contact support',
      401,
      ERROR_TYPES.AUTH
    );
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    updateLoginAttempts(email, clientIp);
    
    logger.warn('Login failed - Invalid password', { 
      userId: user._id,
      email, 
      ip: clientIp,
      attempts: attempts.count + 1,
      requestId 
    });
    
    logger.endTimer('user-login', requestId, { result: 'invalid-password' });
    throw new AppError(
      'Invalid email or password',
      401,
      ERROR_TYPES.AUTH
    );
  }

  // Clear login attempts on successful login
  clearLoginAttempts(email, clientIp);

  // Update last login
  user.lastLogin = new Date();
  user.lastLoginIp = clientIp;
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Remove password from response
  const userResponse = user.toJSON();

  logger.info('User logged in successfully', { 
    userId: user._id, 
    email,
    role: user.role,
    ip: clientIp,
    requestId 
  });

  logger.endTimer('user-login', requestId, { result: 'success' });

  res.status(200).json({
    error: false,
    message: 'Login successful',
    token,
    user: userResponse,
    requestId
  });
});

/**
 * Get current user profile
 */
const getProfile = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  
  logger.info('Profile requested', { 
    userId: req.user._id,
    requestId 
  });

  // User is already attached by auth middleware
  const userResponse = {
    ...req.user,
    password: undefined // Ensure password is not included
  };

  res.status(200).json({
    error: false,
    data: userResponse,
    requestId
  });
});

/**
 * Update user profile
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { name } = req.body;
  const userId = req.user._id;

  logger.info('Profile update requested', { 
    userId,
    requestId 
  });

  logger.startTimer('profile-update', requestId);

  const user = await User.findById(userId);
  if (!user) {
    logger.endTimer('profile-update', requestId, { result: 'user-not-found' });
    throw new AppError('User not found', 404, ERROR_TYPES.NOT_FOUND);
  }

  // Update allowed fields
  if (name !== undefined) {
    user.name = name.trim();
  }

  await user.save();

  const userResponse = user.toJSON();

  logger.info('Profile updated successfully', { 
    userId,
    requestId 
  });

  logger.endTimer('profile-update', requestId, { result: 'success' });

  res.status(200).json({
    error: false,
    message: 'Profile updated successfully',
    data: userResponse,
    requestId
  });
});

/**
 * Change password
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  logger.info('Password change requested', { 
    userId,
    requestId 
  });

  logger.startTimer('password-change', requestId);

  const user = await User.findById(userId);
  if (!user) {
    logger.endTimer('password-change', requestId, { result: 'user-not-found' });
    throw new AppError('User not found', 404, ERROR_TYPES.NOT_FOUND);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    logger.warn('Password change failed - Invalid current password', { 
      userId,
      requestId 
    });
    
    logger.endTimer('password-change', requestId, { result: 'invalid-current-password' });
    throw new AppError(
      'Current password is incorrect',
      400,
      ERROR_TYPES.AUTH
    );
  }

  // Update password (will be hashed by pre-save hook)
  user.password = newPassword;
  await user.save();

  logger.info('Password changed successfully', { 
    userId,
    requestId 
  });

  logger.endTimer('password-change', requestId, { result: 'success' });

  res.status(200).json({
    error: false,
    message: 'Password changed successfully',
    requestId
  });
});

/**
 * Logout user (invalidate token - for future implementation with token blacklist)
 */
const logout = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  
  logger.info('User logout', { 
    userId: req.user._id,
    requestId 
  });

  // TODO: Implement token blacklist for more secure logout
  // For now, client-side token removal is sufficient

  res.status(200).json({
    error: false,
    message: 'Logged out successfully',
    requestId
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};
