const mongoose = require('mongoose');
const RentalOrder = require('../models/rentalOrder.model');
const Product = require('../models/product.model');
const { checkAvailability } = require('../utils/availability');
const { calculatePrice } = require('../utils/calcPrice');
const logger = require('../utils/logger');

// Check availability
const checkRentalAvailability = async (req, res, next) => {
  try {
    const { productId, startTime, endTime, qty = 1 } = req.body;

    if (!productId || !startTime || !endTime) {
      return res.status(400).json({
        error: true,
        message: 'Product ID, start time, and end time are required'
      });
    }

    const availabilityResult = await checkAvailability(productId, startTime, endTime, qty);

    res.status(200).json({
      error: false,
      data: availabilityResult
    });
  } catch (error) {
    next(error);
  }
};

// Calculate rental price
const calculateRentalPrice = async (req, res, next) => {
  try {
    const { productId, startTime, endTime } = req.body;

    if (!productId || !startTime || !endTime) {
      return res.status(400).json({
        error: true,
        message: 'Product ID, start time, and end time are required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        error: true,
        message: 'Product not found'
      });
    }

    const totalPrice = calculatePrice(product, startTime, endTime);

    res.status(200).json({
      error: false,
      data: {
        totalPrice,
        productId,
        startTime,
        endTime,
        pricing: product.pricing
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create booking with transaction and retry logic
const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      session.startTransaction();

      const { productId, startTime, endTime, qty = 1 } = req.body;

      if (!productId || !startTime || !endTime) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          error: true,
          message: 'Product ID, start time, and end time are required'
        });
      }

      // Get product within transaction
      const product = await Product.findById(productId).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          error: true,
          message: 'Product not found'
        });
      }

      // Re-check availability within transaction
      const overlappingCount = await RentalOrder.countDocuments({
        product: productId,
        status: { $in: ['confirmed', 'picked_up'] },
        startTime: { $lt: new Date(endTime) },
        endTime: { $gt: new Date(startTime) }
      }).session(session);

      if (product.stock - overlappingCount < qty) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          error: true,
          message: 'Product not available for the selected time period'
        });
      }

      // Calculate price
      const totalPrice = calculatePrice(product, startTime, endTime);

      // Create booking
      const rental = await RentalOrder.create([{
        customer: req.user._id,
        product: productId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalPrice
      }], { session });

      await session.commitTransaction();
      session.endSession();

      // Populate the created rental
      await rental[0].populate(['customer', 'product']);

      logger.info('Booking created successfully', { 
        rentalId: rental[0]._id, 
        customerId: req.user._id,
        productId 
      });

      return res.status(201).json({
        error: false,
        message: 'Booking created successfully',
        data: rental[0]
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      if (attempts >= maxAttempts) {
        return next(error);
      }

      // Small delay before retry
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
  }
};

// Get rentals (all for admin, user's own for customers)
const getRentals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, mine } = req.query;
    
    let query = {};
    
    // If user is not admin or mine=true, show only their rentals
    if (req.user.role !== 'admin' || mine === 'true') {
      query.customer = req.user._id;
    }
    
    if (status) {
      query.status = status;
    }

    const rentals = await RentalOrder.find(query)
      .populate('customer', 'name email')
      .populate('product', 'name description images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RentalOrder.countDocuments(query);

    res.status(200).json({
      error: false,
      data: rentals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update rental status (Admin only)
const updateRentalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const validStatuses = ['confirmed', 'picked_up', 'returned', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid status. Valid options: ' + validStatuses.join(', ')
      });
    }

    const rental = await RentalOrder.findById(id);
    if (!rental) {
      return res.status(404).json({
        error: true,
        message: 'Rental not found'
      });
    }

    // Calculate late fee if returning late
    if (status === 'returned' && new Date() > rental.endTime) {
      const hoursLate = Math.ceil((new Date() - rental.endTime) / (1000 * 60 * 60));
      rental.lateFee = hoursLate * 10; // $10 per hour late (configurable)
    }

    rental.status = status;
    await rental.save();

    await rental.populate(['customer', 'product']);

    logger.info('Rental status updated', { rentalId: id, newStatus: status });

    res.status(200).json({
      error: false,
      message: 'Rental status updated successfully',
      data: rental
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkRentalAvailability,
  calculateRentalPrice,
  createBooking,
  getRentals,
  updateRentalStatus
};
