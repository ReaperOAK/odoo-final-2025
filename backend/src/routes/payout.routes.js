const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const PayoutController = require('../controllers/payout.controller');

const router = express.Router();

/**
 * Validation rules for payout creation
 */
const createPayoutValidation = [
  body('amount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  body('orderIds')
    .optional()
    .isArray()
    .withMessage('Order IDs must be an array'),
  body('orderIds.*')
    .optional()
    .isMongoId()
    .withMessage('Valid order ID is required'),
  body('bankDetails.accountNumber')
    .optional()
    .isLength({ min: 8, max: 20 })
    .withMessage('Account number must be 8-20 characters'),
  body('bankDetails.ifscCode')
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Valid IFSC code is required'),
  body('bankDetails.accountHolderName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Account holder name must be 2-100 characters'),
  body('bankDetails.bankName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be 2-100 characters')
];

/**
 * Validation rules for payout approval/rejection
 */
const payoutActionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid payout ID is required'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

/**
 * Validation rules for marking payout as processed
 */
const markProcessedValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid payout ID is required'),
  body('transactionId')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('Transaction ID must be 5-100 characters'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

/**
 * Validation rules for bank details update
 */
const updateBankDetailsValidation = [
  body('accountNumber')
    .isLength({ min: 8, max: 20 })
    .withMessage('Account number must be 8-20 characters'),
  body('ifscCode')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Valid IFSC code is required'),
  body('accountHolderName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Account holder name must be 2-100 characters'),
  body('bankName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be 2-100 characters'),
  body('branchName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Branch name cannot exceed 100 characters')
];

/**
 * @route   POST /api/payouts
 * @desc    Create a payout request
 * @access  Private (Host)
 */
router.post('/',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host']),
  createPayoutValidation,
  PayoutController.createPayout
);

/**
 * @route   GET /api/payouts
 * @desc    Get payouts for host or all payouts (admin)
 * @access  Private (Host/Admin)
 */
router.get('/',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host', 'admin']),
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
      .isIn(['all', 'pending', 'approved', 'rejected', 'processed'])
      .withMessage('Invalid status filter'),
    query('hostId')
      .optional()
      .isMongoId()
      .withMessage('Valid host ID is required')
  ],
  (req, res, next) => {
    // Route to appropriate handler based on user role
    if (req.user.role === 'admin') {
      return PayoutController.getAllPayouts(req, res, next);
    } else {
      return PayoutController.getHostPayouts(req, res, next);
    }
  }
);

/**
 * @route   GET /api/payouts/:id
 * @desc    Get payout by ID
 * @access  Private (Host/Admin)
 */
router.get('/:id',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host', 'admin']),
  param('id').isMongoId().withMessage('Valid payout ID is required'),
  PayoutController.getPayoutById
);

/**
 * @route   POST /api/payouts/:id/approve
 * @desc    Approve payout
 * @access  Private (Admin)
 */
router.post('/:id/approve',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['admin']),
  payoutActionValidation,
  PayoutController.approvePayout
);

/**
 * @route   POST /api/payouts/:id/reject
 * @desc    Reject payout
 * @access  Private (Admin)
 */
router.post('/:id/reject',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['admin']),
  [
    param('id')
      .isMongoId()
      .withMessage('Valid payout ID is required'),
    body('reason')
      .isLength({ min: 5, max: 200 })
      .withMessage('Rejection reason must be 5-200 characters')
  ],
  PayoutController.rejectPayout
);

/**
 * @route   POST /api/payouts/:id/process
 * @desc    Mark payout as processed
 * @access  Private (Admin)
 */
router.post('/:id/process',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['admin']),
  markProcessedValidation,
  PayoutController.markProcessed
);

/**
 * @route   GET /api/payouts/stats/summary
 * @desc    Get payout statistics
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
  PayoutController.getPayoutStats
);

/**
 * @route   PUT /api/payouts/bank-details
 * @desc    Update bank details
 * @access  Private (Host)
 */
router.put('/bank-details',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host']),
  updateBankDetailsValidation,
  PayoutController.updateBankDetails
);

module.exports = router;
