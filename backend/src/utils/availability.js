const RentalOrder = require('../models/rentalOrder.model');
const Product = require('../models/product.model');
const logger = require('./logger');

// Simple in-memory cache for product stock (valid for 30 seconds)
const productCache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds

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
    
    // Clean up expired cache entries
    setTimeout(() => {
      if (productCache.has(cacheKey)) {
        const entry = productCache.get(cacheKey);
        if (Date.now() - entry.timestamp >= CACHE_DURATION) {
          productCache.delete(cacheKey);
        }
      }
    }, CACHE_DURATION);
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
    
    // Input validation and sanitization
    if (!productId || !startTime || !endTime) {
      throw new Error('Missing required parameters: productId, startTime, endTime');
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }
    
    if (end <= start) {
      throw new Error('End time must be after start time');
    }
    
    if (start <= new Date()) {
      throw new Error('Start time must be in the future');
    }
    
    // Validate quantity
    if (qty < 1 || qty > 100) {
      throw new Error('Quantity must be between 1 and 100');
    }
    
    // Get product with caching
    const product = await getCachedProduct(productId, requestId);
    if (!product) {
      throw new Error('Product not found');
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
        availableStock: 0,
        requestedQuantity: qty,
        totalStock: product.stock,
        reason: 'insufficient_total_stock'
      };
    }
    
    // Count overlapping active bookings with optimized query
    logger.startTimer('overlap-count', requestId);
    const overlappingCount = await RentalOrder.countDocuments({
      product: productId,
      status: { $in: ['confirmed', 'picked_up'] },
      $and: [
        { startTime: { $lt: end } },
        { endTime: { $gt: start } }
      ]
    });
    logger.endTimer('overlap-count', requestId, { overlappingCount });
    
    const availableStock = product.stock - overlappingCount;
    const isAvailable = availableStock >= qty;
    
    logger.info('Availability check completed', {
      productId,
      requestedQty: qty,
      totalStock: product.stock,
      overlappingCount,
      availableStock,
      isAvailable,
      requestId
    });
    
    logger.endTimer('availability-check', requestId, { 
      result: isAvailable ? 'available' : 'unavailable',
      availableStock 
    });
    
    return {
      isAvailable,
      availableStock,
      requestedQuantity: qty,
      totalStock: product.stock,
      overlappingBookings: overlappingCount,
      timeSlot: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    };
    
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
  logger.info('Product cache cleared');
};

module.exports = { 
  checkAvailability, 
  checkBatchAvailability,
  getAvailabilityCalendar,
  clearProductCache
};
