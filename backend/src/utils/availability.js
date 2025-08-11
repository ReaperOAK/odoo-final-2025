const mongoose = require('mongoose');
const RentalOrder = require('../models/rentalOrder.model');
const Product = require('../models/product.model');
const logger = require('./logger');
const { AppError, ERROR_TYPES } = require('../middleware/error.middleware');

// Simple in-memory cache for product stock (valid for 30 seconds)
const productCache = new Map();
const availabilityCache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds
const AVAILABILITY_CACHE_DURATION = 10 * 1000; // 10 seconds for availability checks

/**
 * Get product with caching for better performance
 * @param {String} productId - Product ID
 * @param {String} requestId - Request ID for logging
 * @returns {Object} Product document
 */
const getCachedProduct = async (productId, requestId) => {
  const cacheKey = `product-${productId}`;
  const cached = productCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    logger.debug('Product cache hit', { productId, requestId });
    return cached.product;
  }

  logger.startTimer('product-fetch', requestId);
  const product = await Product.findById(productId).lean(); // Using lean() for better performance
  logger.endTimer('product-fetch', requestId, { productId });

  if (product) {
    productCache.set(cacheKey, {
      product,
      timestamp: Date.now()
    });

    // Clean up expired cache entries (skip in test environment)
    if (process.env.NODE_ENV?.trim() !== 'test') {
      setTimeout(() => {
        if (productCache.has(cacheKey)) {
          const entry = productCache.get(cacheKey);
          if (Date.now() - entry.timestamp >= CACHE_DURATION) {
            productCache.delete(cacheKey);
          }
        }
      }, CACHE_DURATION);
    }
  }

  return product;
};

/**
 * Check if a product is available for booking in the given time range
 * @param {String} productId - Product ID
 * @param {Date} startTime - Booking start time
 * @param {Date} endTime - Booking end time
 * @param {Number} qty - Quantity requested (default: 1)
 * @param {String} requestId - Request ID for logging
 * @returns {Object} { isAvailable: Boolean, availableStock: Number }
 */
const checkAvailability = async (productId, startTime, endTime, qty = 1, requestId = 'unknown') => {
  try {
    logger.startTimer('availability-check', requestId);

    // Create cache key for this availability check
    const cacheKey = `avail-${productId}-${startTime}-${endTime}-${qty}`;
    const cached = availabilityCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < AVAILABILITY_CACHE_DURATION) {
      logger.debug('Availability cache hit', { productId, requestId });
      logger.endTimer('availability-check', requestId, { result: 'cached' });
      return cached.result;
    }

    // Input validation and sanitization
    if (!productId || !startTime || !endTime) {
      throw new AppError('Missing required parameters: productId, startTime, endTime', 400, ERROR_TYPES.VALIDATION);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid date format', 400, ERROR_TYPES.VALIDATION);
    }

    if (end <= start) {
      throw new AppError('End time must be after start time', 400, ERROR_TYPES.VALIDATION);
    }

    // Allow dates within 1 minute of current time to account for timezone differences
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (start <= oneMinuteAgo) {
      logger.info('Start time is in the past', {
        productId,
        startTime,
        currentTime: new Date().toISOString(),
        requestId
      });

      logger.endTimer('availability-check', requestId, { result: 'past-date' });
      return {
        isAvailable: false,
        available: false,
        availableStock: 0,
        requestedQuantity: qty,
        totalStock: product?.stock || 0,
        reason: 'start_time_in_past',
        timeSlot: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      };
    }

    // Validate quantity
    if (qty < 1 || qty > 100) {
      throw new AppError('Quantity must be between 1 and 100', 400, ERROR_TYPES.VALIDATION);
    }

    // Get product with caching
    const product = await getCachedProduct(productId, requestId);
    if (!product) {
      throw new AppError('Product not found', 404, ERROR_TYPES.NOT_FOUND);
    }


    // Check if product has sufficient stock
    if (product.stock < qty) {
      logger.info('Insufficient total stock', {
        productId,
        requestedQty: qty,
        totalStock: product.stock,
        requestId
      });

      logger.endTimer('availability-check', requestId, { result: 'insufficient-stock' });
      return {
        isAvailable: false,
        available: false, // Add for frontend compatibility
        availableStock: 0,
        requestedQuantity: qty,
        totalStock: product.stock,
        reason: 'insufficient_total_stock'
      };
    }

    // Sum overlapping quantities from active bookings
    logger.startTimer('overlap-count', requestId);

    // Use aggregation to sum quantities, not just count documents
    const overlappingResult = await RentalOrder.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          status: { $in: ['confirmed', 'picked_up'] },
          startTime: { $lt: end },
          endTime: { $gt: start }
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ], {
      maxTimeMS: 500  // Maximum 500ms timeout
    });

    const overlappingQuantity = overlappingResult.length > 0 ? overlappingResult[0].totalQuantity : 0;

    logger.endTimer('overlap-count', requestId, { overlappingQuantity });

    const availableStock = product.stock - overlappingQuantity;
    const isAvailable = availableStock >= qty;

    logger.info('Availability check completed', {
      productId,
      requestedQty: qty,
      totalStock: product.stock,
      overlappingQuantity,
      availableStock,
      isAvailable,
      requestId
    });

    logger.endTimer('availability-check', requestId, {
      result: isAvailable ? 'available' : 'unavailable',
      availableStock
    });

    const result = {
      isAvailable,
      available: isAvailable, // Add for frontend compatibility
      availableStock,
      requestedQuantity: qty,
      totalStock: product.stock,
      overlappingBookings: overlappingQuantity,
      timeSlot: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    };

    // Cache the result
    availabilityCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Clean up expired availability cache entries (skip in test environment)
    if (process.env.NODE_ENV?.trim() !== 'test') {
      setTimeout(() => {
        if (availabilityCache.has(cacheKey)) {
          const entry = availabilityCache.get(cacheKey);
          if (Date.now() - entry.timestamp >= AVAILABILITY_CACHE_DURATION) {
            availabilityCache.delete(cacheKey);
          }
        }
      }, AVAILABILITY_CACHE_DURATION);
    }

    return result;

  } catch (error) {
    logger.error('Availability check failed', {
      productId,
      startTime,
      endTime,
      qty,
      requestId,
      error: error.message,
      stack: error.stack
    });

    // Re-throw AppError as-is, wrap others
    if (error.isOperational) {
      throw error;
    }
    throw new Error(`Availability check failed: ${error.message}`);
  }
};

/**
 * Check availability for multiple products in batch
 * @param {Array} requests - Array of {productId, startTime, endTime, qty}
 * @param {String} requestId - Request ID for logging
 * @returns {Array} Array of availability results
 */
const checkBatchAvailability = async (requests, requestId = 'unknown') => {
  logger.startTimer('batch-availability', requestId);

  try {
    const results = await Promise.all(
      requests.map(req =>
        checkAvailability(req.productId, req.startTime, req.endTime, req.qty, requestId)
          .catch(error => ({
            error: true,
            message: error.message,
            productId: req.productId
          }))
      )
    );

    logger.endTimer('batch-availability', requestId, { count: requests.length });
    return results;
  } catch (error) {
    logger.error('Batch availability check failed', { requestId, error: error.message });
    throw error;
  }
};

/**
 * Get availability calendar for a product over a date range
 * @param {String} productId - Product ID
 * @param {Date} startDate - Start date for calendar
 * @param {Date} endDate - End date for calendar
 * @param {String} requestId - Request ID for logging
 * @returns {Array} Array of daily availability
 */
const getAvailabilityCalendar = async (productId, startDate, endDate, requestId = 'unknown') => {
  logger.startTimer('availability-calendar', requestId);

  try {
    const product = await getCachedProduct(productId, requestId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get all bookings in the date range
    const bookings = await RentalOrder.find({
      product: productId,
      status: { $in: ['confirmed', 'picked_up'] },
      $or: [
        { startTime: { $gte: startDate, $lte: endDate } },
        { endTime: { $gte: startDate, $lte: endDate } },
        { startTime: { $lte: startDate }, endTime: { $gte: endDate } }
      ]
    }).lean();

    const calendar = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const overlapping = bookings.filter(booking =>
        (booking.startTime < dayEnd && booking.endTime > dayStart)
      );

      calendar.push({
        date: dayStart.toISOString().split('T')[0],
        availableStock: Math.max(0, product.stock - overlapping.length),
        totalStock: product.stock,
        overlappingBookings: overlapping.length
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    logger.endTimer('availability-calendar', requestId, {
      productId,
      days: calendar.length
    });

    return calendar;
  } catch (error) {
    logger.error('Availability calendar failed', {
      productId,
      startDate,
      endDate,
      requestId,
      error: error.message
    });
    throw error;
  }
};

// Clear cache function for testing/manual refresh
const clearProductCache = () => {
  productCache.clear();
  availabilityCache.clear();
  logger.info('Product and availability cache cleared');
};

module.exports = {
  checkAvailability,
  checkBatchAvailability,
  getAvailabilityCalendar,
  clearProductCache
};
