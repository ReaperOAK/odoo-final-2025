const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const OrderController = require('../controllers/order.controller');

const router = express.Router();

/**
 * Validation rules for order creation
 */
const createOrderValidation = [
  body('lineItems')
    .isArray({ min: 1 })
    .withMessage('At least one line item is required'),
  body('lineItems.*.listingId')
    .isMongoId()
    .withMessage('Valid listing ID is required'),
  body('lineItems.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('lineItems.*.startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('lineItems.*.endDate')
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('paymentMode')
    .optional()
    .isIn(['razorpay', 'cash'])
    .withMessage('Payment mode must be razorpay or cash'),
  body('customer.name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be 2-100 characters'),
  body('customer.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  body('customer.phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Valid Indian phone number is required')
];

/**
 * Validation rules for payment processing
 */
const processPaymentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid order ID is required'),
  body('razorpay_order_id')
    .optional()
    .isString()
    .withMessage('Razorpay order ID must be a string'),
  body('razorpay_payment_id')
    .optional()
    .isString()
    .withMessage('Razorpay payment ID must be a string'),
  body('razorpay_signature')
    .optional()
    .isString()
    .withMessage('Razorpay signature must be a string'),
  body('mock_payment_id')
    .optional()
    .isString()
    .withMessage('Mock payment ID must be a string')
];

/**
 * Validation rules for order status update
 */
const updateStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid order ID is required'),
  body('status')
    .isIn(['confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

/**
 * Validation rules for order cancellation
 */
const cancelOrderValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid order ID is required'),
  body('reason')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be 5-200 characters')
];

/**
 * Validation rules for review
 */
const addReviewValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid order ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review must be 10-1000 characters')
];

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private (Customer)
 */
router.post('/', 
  authMiddleware.verifyToken,
  createOrderValidation,
  OrderController.createOrder
);

/**
 * @route   POST /api/orders/:id/payment
 * @desc    Process payment for an order
 * @access  Private (Customer)
 */
router.post('/:id/payment',
  authMiddleware.verifyToken,
  processPaymentValidation,
  OrderController.processPayment
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private (Customer/Host/Admin)
 */
router.get('/:id',
  authMiddleware.verifyToken,
  param('id').isMongoId().withMessage('Valid order ID is required'),
  OrderController.getOrderById
);

/**
 * @route   GET /api/orders
 * @desc    Get orders for current user
 * @access  Private (Customer/Host)
 */
router.get('/',
  authMiddleware.verifyToken,
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
      .isIn(['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'])
      .withMessage('Invalid status filter'),
    query('type')
      .optional()
      .isIn(['all', 'customer', 'host'])
      .withMessage('Type must be all, customer, or host')
  ],
  OrderController.getUserOrders
);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Host/Admin)
 */
router.put('/:id/status',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host', 'admin']),
  updateStatusValidation,
  OrderController.updateOrderStatus
);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private (Customer/Host/Admin)
 */
router.post('/:id/cancel',
  authMiddleware.verifyToken,
  cancelOrderValidation,
  OrderController.cancelOrder
);

/**
 * @route   POST /api/orders/:id/review
 * @desc    Add review to order
 * @access  Private (Customer/Host)
 */
router.post('/:id/review',
  authMiddleware.verifyToken,
  addReviewValidation,
  OrderController.addReview
);

/**
 * @route   GET /api/orders/stats/summary
 * @desc    Get order statistics
 * @access  Private (Host/Admin)
 */
router.get('/stats/summary',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host', 'admin']),
  [
    query('period')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Period must be between 1 and 365 days')
  ],
  OrderController.getOrderStats
);

module.exports = router;
