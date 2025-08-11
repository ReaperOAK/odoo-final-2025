const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const PaymentController = require('../controllers/payment.controller');

const router = express.Router();

/**
 * Validation rules for refund creation
 */
const createRefundValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid payment ID is required'),
  body('amount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  body('reason')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be 5-200 characters')
];

/**
 * Validation rules for payment verification
 */
const verifyPaymentValidation = [
  body('razorpay_order_id')
    .isString()
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .isString()
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .isString()
    .notEmpty()
    .withMessage('Razorpay signature is required')
];

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhooks
 * @access  Public (Webhook)
 */
router.post('/webhook', PaymentController.handleWebhook);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment signature
 * @access  Private
 */
router.post('/verify',
  authMiddleware.verifyToken,
  verifyPaymentValidation,
  PaymentController.verifyPayment
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private (Customer/Host/Admin)
 */
router.get('/:id',
  authMiddleware.verifyToken,
  param('id').isMongoId().withMessage('Valid payment ID is required'),
  PaymentController.getPaymentById
);

/**
 * @route   GET /api/payments
 * @desc    Get payments for current user
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
      .isIn(['all', 'pending', 'processing', 'completed', 'failed', 'refunded'])
      .withMessage('Invalid status filter'),
    query('type')
      .optional()
      .isIn(['all', 'customer', 'host'])
      .withMessage('Type must be all, customer, or host')
  ],
  PaymentController.getUserPayments
);

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Create refund for a payment
 * @access  Private (Host/Admin)
 */
router.post('/:id/refund',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host', 'admin']),
  createRefundValidation,
  PaymentController.createRefund
);

/**
 * @route   GET /api/payments/stats/summary
 * @desc    Get payment statistics
 * @access  Private (Host/Admin)
 */
router.get('/stats/summary',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host', 'admin']),
  [
    query('period')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Period must be between 1 and 365 days'),
    query('type')
      .optional()
      .isIn(['all', 'customer', 'host'])
      .withMessage('Type must be all, customer, or host')
  ],
  PaymentController.getPaymentStats
);

module.exports = router;
