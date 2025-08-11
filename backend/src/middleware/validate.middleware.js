const { validationResult, body, param, query } = require('express-validator');

// Central validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Auth validation rules
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  
  body('role')
    .optional()
    .isIn(['customer', 'admin'])
    .withMessage('Role must be either customer or admin'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Product validation rules
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  body('pricing')
    .isArray({ min: 1 })
    .withMessage('At least one pricing option is required'),
  
  body('pricing.*.unit')
    .isIn(['hour', 'day', 'week'])
    .withMessage('Pricing unit must be hour, day, or week'),
  
  body('pricing.*.rate')
    .isFloat({ min: 0 })
    .withMessage('Pricing rate must be a positive number'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  
  handleValidationErrors
];

// Rental validation rules
const validateAvailability = [
  body('productId')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),
  
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  
  body('endTime')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('qty')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  
  handleValidationErrors
];

const validateBooking = [
  ...validateAvailability,
  handleValidationErrors
];

const validateStatusUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Rental ID must be a valid MongoDB ObjectId'),
  
  body('status')
    .isIn(['confirmed', 'picked_up', 'returned', 'cancelled'])
    .withMessage('Status must be one of: confirmed, picked_up, returned, cancelled'),
  
  handleValidationErrors
];

// Query validation rules
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['confirmed', 'picked_up', 'returned', 'cancelled'])
    .withMessage('Status must be a valid rental status'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
  validateAvailability,
  validateBooking,
  validateStatusUpdate,
  validatePagination,
  handleValidationErrors
};
