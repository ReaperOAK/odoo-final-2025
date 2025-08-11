const express = require('express');
const { authMiddleware, isAdmin, optionalAuth } = require('../middleware/auth.middleware');
const {
  validateAvailability,
  validateBooking,
  validateStatusUpdate,
  validatePagination
} = require('../middleware/validate.middleware');
const {
  checkRentalAvailability,
  calculateRentalPrice,
  createBooking,
  getRentals,
  updateRentalStatus,
  getRentalById,
  getRentalStats
} = require('../controllers/rental.controller');

const router = express.Router();

// POST /api/rentals/check-availability - Check availability (public with optional auth for better experience)
router.post('/check-availability', 
  validateAvailability,
  optionalAuth,
  checkRentalAvailability
);

// POST /api/rentals/calculate-price - Calculate price (public with optional auth)
router.post('/calculate-price', 
  validateAvailability,
  optionalAuth,
  calculateRentalPrice
);

// POST /api/rentals/create - Create booking (authenticated users only)
router.post('/create', 
  authMiddleware,
  validateBooking,
  createBooking
);

// GET /api/rentals - Get rentals list with filtering and pagination
router.get('/', 
  authMiddleware,
  validatePagination,
  getRentals
);

// GET /api/rentals/stats - Get rental statistics (admin only)
router.get('/stats',
  authMiddleware,
  isAdmin,
  getRentalStats
);

// GET /api/rentals/:id - Get rental by ID (owner or admin)
router.get('/:id',
  authMiddleware,
  getRentalById
);

// PATCH /api/rentals/:id/status - Update rental status (admin only)
router.patch('/:id/status', 
  authMiddleware,
  isAdmin,
  validateStatusUpdate,
  updateRentalStatus
);

module.exports = router;
