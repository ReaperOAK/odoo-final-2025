const mongoose = require('mongoose');
const RentalOrder = require('../models/rentalOrder.model');
const Product = require('../models/product.model');
const { checkAvailability, checkBatchAvailability } = require('../utils/availability');
const { calculatePrice } = require('../utils/calcPrice');
const { asyncHandler, AppError, ERROR_TYPES } = require('../middleware/error.middleware');
const logger = require('../utils/logger');
const { differenceInDays } = require('date-fns');

/**
 * Check availability for a product in a specific time range
 */
const checkRentalAvailability = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { productId, startTime, endTime, qty = 1 } = req.body;

  logger.info('Availability check requested', { 
    productId, 
    startTime, 
    endTime, 
    qty,
    requestId 
  });

  const availabilityResult = await checkAvailability(
    productId, 
    startTime, 
    endTime, 
    qty, 
    requestId
  );

  res.status(200).json({
    error: false,
    data: availabilityResult,
    requestId
  });
});

/**
 * Calculate rental price for a product and time range
 */
const calculateRentalPrice = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { productId, startTime, endTime } = req.body;

  logger.info('Price calculation requested', { 
    productId, 
    startTime, 
    endTime,
    requestId 
  });

  logger.startTimer('price-calculation-request', requestId);

  const product = await Product.findById(productId).lean();
  if (!product) {
    logger.endTimer('price-calculation-request', requestId, { result: 'product-not-found' });
    throw new AppError('Product not found', 404, ERROR_TYPES.NOT_FOUND);
  }

  const priceResult = calculatePrice(product, startTime, endTime, requestId);

  logger.endTimer('price-calculation-request', requestId, { 
    totalPrice: priceResult.totalPrice 
  });

  res.status(200).json({
    error: false,
    data: priceResult,
    requestId
  });
});

/**
 * Create a new booking with atomic transaction and retry logic
 */
const createBooking = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { productId, startTime, endTime, qty = 1 } = req.body;
  const customerId = req.user._id;

  logger.info('Booking creation started', { 
    productId, 
    startTime, 
    endTime, 
    qty,
    customerId,
    requestId 
  });

  logger.startTimer('booking-creation', requestId);

  const session = await mongoose.startSession();
  let attempts = 0;
  const maxAttempts = 3;
  const baseDelay = 50; // Base delay in milliseconds

  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      await session.startTransaction();

      logger.debug(`Booking attempt ${attempts}/${maxAttempts}`, { requestId });

      // Get product within transaction with a lock
      const product = await Product.findById(productId).session(session);
      if (!product) {
        await session.abortTransaction();
        throw new AppError('Product not found', 404, ERROR_TYPES.NOT_FOUND);
      }

      // Re-check availability within transaction to prevent race conditions
      logger.startTimer('transaction-availability-check', requestId);
      const overlappingCount = await RentalOrder.countDocuments({
        product: productId,
        status: { $in: ['confirmed', 'picked_up'] },
        $and: [
          { startTime: { $lt: new Date(endTime) } },
          { endTime: { $gt: new Date(startTime) } }
        ]
      }).session(session);
      logger.endTimer('transaction-availability-check', requestId, { overlappingCount });

      const availableStock = product.stock - overlappingCount;
      
      if (availableStock < qty) {
        await session.abortTransaction();
        logger.warn('Booking failed - Insufficient availability', {
          requestId,
          productId,
          requestedQty: qty,
          availableStock,
          totalStock: product.stock,
          overlappingCount
        });
        
        throw new AppError(
          `Product not available for the selected time period. Only ${availableStock} units available`,
          400,
          ERROR_TYPES.CONFLICT,
          {
            availableStock,
            requestedQuantity: qty,
            totalStock: product.stock
          }
        );
      }

      // Calculate price
      logger.startTimer('transaction-price-calc', requestId);
      const priceResult = calculatePrice(product, startTime, endTime, requestId);
      logger.endTimer('transaction-price-calc', requestId);

      // Create booking
      logger.startTimer('booking-create', requestId);
      const rental = await RentalOrder.create([{
        customer: customerId,
        product: productId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalPrice: priceResult.totalPrice
      }], { session });
      logger.endTimer('booking-create', requestId);

      await session.commitTransaction();
      
      // Populate the created rental outside of transaction for performance
      await rental[0].populate([
        { path: 'customer', select: 'name email' },
        { path: 'product', select: 'name description images pricing' }
      ]);

      logger.info('Booking created successfully', { 
        rentalId: rental[0]._id, 
        customerId,
        productId,
        totalPrice: rental[0].totalPrice,
        attempt: attempts,
        requestId 
      });

      logger.endTimer('booking-creation', requestId, { 
        result: 'success',
        rentalId: rental[0]._id,
        attempts
      });

      return res.status(201).json({
        error: false,
        message: 'Booking created successfully',
        data: {
          ...rental[0].toObject(),
          priceBreakdown: priceResult
        },
        requestId
      });

    } catch (error) {
      await session.abortTransaction();

      // If it's not a concurrency issue or we've exhausted attempts, throw immediately
      if (error.isOperational || attempts >= maxAttempts) {
        logger.error('Booking creation failed', {
          requestId,
          error: error.message,
          attempts,
          productId,
          customerId
        });
        
        logger.endTimer('booking-creation', requestId, { 
          result: 'failed',
          attempts,
          error: error.message
        });
        
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempts - 1) + Math.random() * 100;
      
      logger.warn(`Booking attempt ${attempts} failed, retrying in ${delay}ms`, {
        requestId,
        error: error.message,
        productId
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    } finally {
      await session.endSession();
    }
  }
});

/**
 * Get rentals with advanced filtering and pagination
 */
const getRentals = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { 
    page = 1, 
    limit = 20, 
    status, 
    mine,
    productId,
    startDate,
    endDate,
    sort = '-createdAt'
  } = req.query;
  
  logger.info('Rentals list requested', { 
    page, 
    limit, 
    status, 
    mine,
    productId,
    userId: req.user._id,
    userRole: req.user.role,
    requestId 
  });

  logger.startTimer('rentals-fetch', requestId);
  
  let query = {};
  
  // Role-based access control
  if (req.user.role !== 'admin' || mine === 'true') {
    query.customer = req.user._id;
  }
  
  // Status filtering
  if (status && ['confirmed', 'picked_up', 'returned', 'cancelled'].includes(status)) {
    query.status = status;
  }
  
  // Product filtering
  if (productId) {
    query.product = productId;
  }
  
  // Date range filtering
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
  const skip = (pageNum - 1) * limitNum;

  // Execute queries in parallel for better performance
  const [rentals, total] = await Promise.all([
    RentalOrder.find(query)
      .populate('customer', 'name email')
      .populate('product', 'name description images pricing')
      .sort(sort)
      .limit(limitNum)
      .skip(skip)
      .lean(), // Use lean for better performance
    
    RentalOrder.countDocuments(query)
  ]);

  // Add calculated fields
  const enrichedRentals = rentals.map(rental => ({
    ...rental,
    duration: {
      days: differenceInDays(new Date(rental.endTime), new Date(rental.startTime)),
      hours: Math.ceil((new Date(rental.endTime) - new Date(rental.startTime)) / (1000 * 60 * 60))
    },
    isOverdue: rental.status === 'picked_up' && new Date() > new Date(rental.endTime)
  }));

  logger.endTimer('rentals-fetch', requestId, { 
    count: rentals.length,
    totalPages: Math.ceil(total / limitNum)
  });

  res.status(200).json({
    error: false,
    data: enrichedRentals,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1
    },
    filters: {
      status,
      mine: mine === 'true',
      productId,
      startDate,
      endDate
    },
    requestId
  });
});

/**
 * Update rental status (admin only)
 */
const updateRentalStatus = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { id } = req.params;
  const { status } = req.body;

  logger.info('Rental status update requested', { 
    rentalId: id, 
    newStatus: status,
    adminId: req.user._id,
    requestId 
  });

  logger.startTimer('status-update', requestId);

  const rental = await RentalOrder.findById(id)
    .populate('customer', 'name email')
    .populate('product', 'name');

  if (!rental) {
    logger.endTimer('status-update', requestId, { result: 'not-found' });
    throw new AppError('Rental not found', 404, ERROR_TYPES.NOT_FOUND);
  }

  // Validate status transition
  const validTransitions = {
    'confirmed': ['picked_up', 'cancelled'],
    'picked_up': ['returned', 'cancelled'],
    'returned': [], // Final state
    'cancelled': [] // Final state
  };

  if (!validTransitions[rental.status].includes(status)) {
    logger.warn('Invalid status transition attempted', {
      requestId,
      rentalId: id,
      currentStatus: rental.status,
      requestedStatus: status,
      adminId: req.user._id
    });
    
    logger.endTimer('status-update', requestId, { result: 'invalid-transition' });
    throw new AppError(
      `Cannot change status from ${rental.status} to ${status}`,
      400,
      ERROR_TYPES.VALIDATION,
      {
        currentStatus: rental.status,
        requestedStatus: status,
        validTransitions: validTransitions[rental.status]
      }
    );
  }

  const oldStatus = rental.status;
  rental.status = status;

  // Calculate late fee if returning late
  if (status === 'returned' && new Date() > new Date(rental.endTime)) {
    const overdueDays = Math.ceil(
      (new Date() - new Date(rental.endTime)) / (1000 * 60 * 60 * 24)
    );
    
    // Calculate late fee as 10% of total price per day
    const dailyLateFee = rental.totalPrice * 0.1;
    rental.lateFee = Math.round(dailyLateFee * overdueDays * 100) / 100;
    
    logger.info('Late fee calculated', {
      requestId,
      rentalId: id,
      overdueDays,
      lateFee: rental.lateFee
    });
  }

  await rental.save();

  logger.info('Rental status updated successfully', { 
    rentalId: id, 
    oldStatus,
    newStatus: status,
    lateFee: rental.lateFee,
    adminId: req.user._id,
    requestId 
  });

  logger.endTimer('status-update', requestId, { result: 'success' });

  res.status(200).json({
    error: false,
    message: `Rental status updated to ${status}`,
    data: rental,
    changes: {
      oldStatus,
      newStatus: status,
      lateFee: rental.lateFee || 0,
      updatedAt: new Date().toISOString()
    },
    requestId
  });
});

/**
 * Get rental by ID with detailed information
 */
const getRentalById = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { id } = req.params;

  logger.startTimer('rental-detail-fetch', requestId);

  const rental = await RentalOrder.findById(id)
    .populate('customer', 'name email')
    .populate('product', 'name description images pricing')
    .lean();

  if (!rental) {
    logger.endTimer('rental-detail-fetch', requestId, { result: 'not-found' });
    throw new AppError('Rental not found', 404, ERROR_TYPES.NOT_FOUND);
  }

  // Check access permissions
  if (req.user.role !== 'admin' && rental.customer._id.toString() !== req.user._id.toString()) {
    logger.warn('Unauthorized rental access attempt', {
      requestId,
      rentalId: id,
      userId: req.user._id,
      rentalCustomer: rental.customer._id
    });
    
    throw new AppError('Access denied. You can only view your own rentals', 403, ERROR_TYPES.PERMISSION);
  }

  // Enrich with calculated fields
  const enrichedRental = {
    ...rental,
    duration: {
      days: differenceInDays(new Date(rental.endTime), new Date(rental.startTime)),
      hours: Math.ceil((new Date(rental.endTime) - new Date(rental.startTime)) / (1000 * 60 * 60))
    },
    isOverdue: rental.status === 'picked_up' && new Date() > new Date(rental.endTime),
    daysUntilDue: rental.status === 'picked_up' ? 
      Math.ceil((new Date(rental.endTime) - new Date()) / (1000 * 60 * 60 * 24)) : null
  };

  logger.endTimer('rental-detail-fetch', requestId, { result: 'success' });

  res.status(200).json({
    error: false,
    data: enrichedRental,
    requestId
  });
});

/**
 * Get rental statistics (admin only)
 */
const getRentalStats = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  
  logger.startTimer('rental-stats', requestId);

  const [
    totalRentals,
    activeRentals,
    overdueRentals,
    totalRevenue,
    revenueThisMonth
  ] = await Promise.all([
    RentalOrder.countDocuments(),
    RentalOrder.countDocuments({ status: { $in: ['confirmed', 'picked_up'] } }),
    RentalOrder.countDocuments({ 
      status: 'picked_up',
      endTime: { $lt: new Date() }
    }),
    RentalOrder.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    RentalOrder.aggregate([
      { 
        $match: { 
          status: { $ne: 'cancelled' },
          createdAt: { 
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ])
  ]);

  const stats = {
    totalRentals,
    activeRentals,
    overdueRentals,
    totalRevenue: totalRevenue[0]?.total || 0,
    revenueThisMonth: revenueThisMonth[0]?.total || 0,
    completedRentals: await RentalOrder.countDocuments({ status: 'returned' }),
    cancelledRentals: await RentalOrder.countDocuments({ status: 'cancelled' })
  };

  logger.endTimer('rental-stats', requestId);

  res.status(200).json({
    error: false,
    data: stats,
    requestId
  });
});

module.exports = {
  checkRentalAvailability,
  calculateRentalPrice,
  createBooking,
  getRentals,
  updateRentalStatus,
  getRentalById,
  getRentalStats
};
