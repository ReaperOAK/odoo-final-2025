const express = require('express');
const { query } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const HostDashboardController = require('../controllers/hostDashboard.controller');

const router = express.Router();

/**
 * @route   GET /api/host/dashboard
 * @desc    Get comprehensive dashboard overview for host
 * @access  Private (Host)
 */
router.get('/dashboard',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host']),
  [
    query('period')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Period must be between 1 and 365 days')
  ],
  HostDashboardController.getDashboardOverview
);

/**
 * @route   GET /api/host/analytics/earnings
 * @desc    Get earnings analytics with breakdown
 * @access  Private (Host)
 */
router.get('/analytics/earnings',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host']),
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
  HostDashboardController.getEarningsAnalytics
);

/**
 * @route   GET /api/host/analytics/listings
 * @desc    Get listing performance analytics
 * @access  Private (Host)
 */
router.get('/analytics/listings',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host']),
  [
    query('period')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Period must be between 1 and 365 days'),
    query('sortBy')
      .optional()
      .isIn(['revenue', 'orders', 'rating', 'views'])
      .withMessage('Sort by must be revenue, orders, rating, or views'),
    query('limit')
      .optional()
      .isInt({ min: 5, max: 100 })
      .withMessage('Limit must be between 5 and 100')
  ],
  HostDashboardController.getListingAnalytics
);

/**
 * @route   GET /api/host/analytics/customers
 * @desc    Get customer analytics
 * @access  Private (Host)
 */
router.get('/analytics/customers',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host']),
  [
    query('period')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Period must be between 1 and 365 days')
  ],
  HostDashboardController.getCustomerAnalytics
);

/**
 * @route   GET /api/host/events/upcoming
 * @desc    Get upcoming events and reminders
 * @access  Private (Host)
 */
router.get('/events/upcoming',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host']),
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Days must be between 1 and 30')
  ],
  HostDashboardController.getUpcomingEvents
);

module.exports = router;
