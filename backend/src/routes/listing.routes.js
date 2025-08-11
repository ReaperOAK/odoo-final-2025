const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const ListingController = require('../controllers/listing.controller');

const router = express.Router();

/**
 * Validation rules for listing creation
 */
const createListingValidation = [
  body('title')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be 5-100 characters'),
  body('description')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be 20-2000 characters'),
  body('category')
    .isIn(['electronics', 'furniture', 'appliances', 'tools', 'sports', 'books', 'clothing', 'vehicles', 'other'])
    .withMessage('Invalid category'),
  body('subcategory')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subcategory must be 2-50 characters'),
  body('pricing.basePrice')
    .isFloat({ min: 1 })
    .withMessage('Base price must be at least ₹1'),
  body('pricing.currency')
    .optional()
    .equals('INR')
    .withMessage('Currency must be INR'),
  body('pricing.pricingModel')
    .isIn(['fixed', 'hourly', 'daily', 'weekly', 'monthly'])
    .withMessage('Invalid pricing model'),
  body('location.address')
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be 10-200 characters'),
  body('location.city')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be 2-50 characters'),
  body('location.state')
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be 2-50 characters'),
  body('location.pincode')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Valid 6-digit pincode is required'),
  body('images')
    .isArray({ min: 1, max: 10 })
    .withMessage('At least 1 and maximum 10 images are required'),
  body('images.*')
    .isURL()
    .withMessage('Valid image URL is required'),
  body('availability.available')
    .optional()
    .isBoolean()
    .withMessage('Availability must be true or false'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('condition')
    .optional()
    .isIn(['new', 'like_new', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  body('tags.*')
    .optional()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be 2-30 characters')
];

/**
 * Validation rules for listing update
 */
const updateListingValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid listing ID is required'),
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be 5-100 characters'),
  body('description')
    .optional()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be 20-2000 characters'),
  body('category')
    .optional()
    .isIn(['electronics', 'furniture', 'appliances', 'tools', 'sports', 'books', 'clothing', 'vehicles', 'other'])
    .withMessage('Invalid category'),
  body('pricing.basePrice')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Base price must be at least ₹1'),
  body('location.address')
    .optional()
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be 10-200 characters'),
  body('images')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('At least 1 and maximum 10 images are required'),
  body('availability.available')
    .optional()
    .isBoolean()
    .withMessage('Availability must be true or false')
];

/**
 * Validation rules for availability check
 */
const availabilityValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid listing ID is required'),
  query('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  query('endDate')
    .isISO8601()
    .withMessage('Valid end date is required'),
  query('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];

/**
 * Validation rules for pricing calculation
 */
const pricingValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid listing ID is required'),
  query('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  query('endDate')
    .isISO8601()
    .withMessage('Valid end date is required'),
  query('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  query('couponCode')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be 3-20 characters')
];

/**
 * @route   POST /api/listings
 * @desc    Create a new listing
 * @access  Private (Host)
 */
router.post('/',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host']),
  createListingValidation,
  ListingController.createListing
);

/**
 * @route   GET /api/listings
 * @desc    Get all listings with search and filters
 * @access  Public
 */
router.get('/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('search')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search term must be 2-100 characters'),
    query('category')
      .optional()
      .isIn(['electronics', 'furniture', 'appliances', 'tools', 'sports', 'books', 'clothing', 'vehicles', 'other'])
      .withMessage('Invalid category'),
    query('city')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('City must be 2-50 characters'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number'),
    query('condition')
      .optional()
      .isIn(['new', 'like_new', 'good', 'fair', 'poor'])
      .withMessage('Invalid condition'),
    query('available')
      .optional()
      .isBoolean()
      .withMessage('Available must be true or false'),
    query('sortBy')
      .optional()
      .isIn(['price', 'rating', 'distance', 'newest', 'popular'])
      .withMessage('Invalid sort option'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    query('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    query('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    query('radius')
      .optional()
      .isFloat({ min: 0.1, max: 100 })
      .withMessage('Radius must be between 0.1 and 100 km')
  ],
  ListingController.getListings
);

/**
 * @route   GET /api/listings/categories
 * @desc    Get all categories with counts
 * @access  Public
 */
router.get('/categories', ListingController.getCategories);

/**
 * @route   GET /api/listings/host
 * @desc    Get listings for current host
 * @access  Private (Host)
 */
router.get('/host',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('status')
      .optional()
      .isIn(['all', 'active', 'inactive', 'pending'])
      .withMessage('Invalid status filter')
  ],
  ListingController.getHostListings
);

/**
 * @route   GET /api/listings/:id
 * @desc    Get listing by ID
 * @access  Public
 */
router.get('/:id',
  param('id').isMongoId().withMessage('Valid listing ID is required'),
  ListingController.getListingById
);

/**
 * @route   PUT /api/listings/:id
 * @desc    Update listing
 * @access  Private (Host - Owner only)
 */
router.put('/:id',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host']),
  updateListingValidation,
  ListingController.updateListing
);

/**
 * @route   DELETE /api/listings/:id
 * @desc    Delete listing
 * @access  Private (Host - Owner only)
 */
router.delete('/:id',
  authMiddleware.verifyToken,
  authMiddleware.requireRoles(['host']),
  param('id').isMongoId().withMessage('Valid listing ID is required'),
  ListingController.deleteListing
);

/**
 * @route   GET /api/listings/:id/availability
 * @desc    Check listing availability
 * @access  Public
 */
router.get('/:id/availability',
  availabilityValidation,
  ListingController.checkAvailability
);

/**
 * @route   GET /api/listings/:id/pricing
 * @desc    Calculate pricing for listing
 * @access  Public
 */
router.get('/:id/pricing',
  pricingValidation,
  ListingController.calculatePricing
);

module.exports = router;
