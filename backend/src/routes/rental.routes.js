const express = require('express');
const { authMiddleware, isAdmin } = require('../middleware/auth.middleware');
const {
  checkRentalAvailability,
  calculateRentalPrice,
  createBooking,
  getRentals,
  updateRentalStatus
} = require('../controllers/rental.controller');

const router = express.Router();

// POST /api/rentals/check-availability - Check availability (public)
router.post('/check-availability', checkRentalAvailability);

// POST /api/rentals/calculate-price - Calculate price (public)
router.post('/calculate-price', calculateRentalPrice);

// POST /api/rentals/create - Create booking (authenticated)
router.post('/create', authMiddleware, createBooking);

// GET /api/rentals - Get rentals (authenticated)
router.get('/', authMiddleware, getRentals);

// PATCH /api/rentals/:id/status - Update rental status (admin only)
router.patch('/:id/status', authMiddleware, isAdmin, updateRentalStatus);

module.exports = router;
