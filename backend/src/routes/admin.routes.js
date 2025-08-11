const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const AdminController = require('../controllers/admin.controller');

const router = express.Router();

/**
 * @route   GET /api/admin/overview
 * @desc    Get platform overview dashboard
 * @access  Private (Admin)
 */
router.get('/overview',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['admin']),
  [
    query('period')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Period must be between 1 and 365 days')
  ],
  AdminController.getPlatformOverview
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and search
 * @access  Private (Admin)
 */
router.get('/users',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['admin']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('role')
      .optional()
      .isIn(['all', 'admin', 'host', 'customer'])
      .withMessage('Invalid role filter'),
    query('status')
      .optional()
      .isIn(['all', 'verified', 'unverified', 'suspended'])
      .withMessage('Invalid status filter'),
    query('search')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search term must be 2-100 characters'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'name', 'email', 'lastLogin'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],
  AdminController.getUsers
);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status/verification
 * @access  Private (Admin)
 */
router.put('/users/:id/status',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['admin']),
  [
    param('id')
      .isMongoId()
      .withMessage('Valid user ID is required'),
    body('action')
      .isIn(['verify', 'suspend', 'activate', 'promote_to_host'])
      .withMessage('Invalid action'),
    body('reason')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Reason must be 5-200 characters')
  ],
  AdminController.updateUserStatus
);

/**
 * @route   GET /api/admin/listings
 * @desc    Get all listings with admin controls
 * @access  Private (Admin)
 */
router.get('/listings',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['admin']),
  [
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
      .isIn(['all', 'active', 'inactive', 'pending', 'rejected', 'suspended'])
      .withMessage('Invalid status filter'),
    query('category')
      .optional()
      .isIn(['all', 'electronics', 'furniture', 'appliances', 'tools', 'sports', 'books', 'clothing', 'vehicles', 'other'])
      .withMessage('Invalid category filter'),
    query('search')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search term must be 2-100 characters'),
    query('hostId')
      .optional()
      .isMongoId()
      .withMessage('Valid host ID is required'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'title', 'category', 'pricing.basePrice'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],
  AdminController.getListings
);

/**
 * @route   PUT /api/admin/listings/:id/status
 * @desc    Update listing status (approve, reject, suspend)
 * @access  Private (Admin)
 */
router.put('/listings/:id/status',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['admin']),
  [
    param('id')
      .isMongoId()
      .withMessage('Valid listing ID is required'),
    body('action')
      .isIn(['approve', 'reject', 'suspend', 'activate'])
      .withMessage('Invalid action'),
    body('reason')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Reason must be 5-200 characters')
  ],
  AdminController.updateListingStatus
);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get platform analytics
 * @access  Private (Admin)
 */
router.get('/analytics',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['admin']),
  [
    query('period')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Period must be between 1 and 365 days'),
    query('groupBy')
      .optional()
      .isIn(['hour', 'day', 'week', 'month'])
      .withMessage('Group by must be hour, day, week, or month')
  ],
  AdminController.getAnalytics
);

module.exports = router;
