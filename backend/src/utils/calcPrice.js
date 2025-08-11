const { differenceInHours, differenceInDays, differenceInWeeks, differenceInMinutes } = require('date-fns');
const logger = require('./logger');

// Price calculation cache for same product and duration
const priceCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Calculate rental price based on product pricing and duration
 * @param {Object} product - Product with pricing array
 * @param {Date} startTime - Rental start time
 * @param {Date} endTime - Rental end time
 * @param {String} requestId - Request ID for logging
 * @returns {Object} Price breakdown with total, unit used, and calculations
 */
const calculatePrice = (product, startTime, endTime, requestId = 'unknown') => {
  logger.startTimer('price-calculation', requestId);
  
  try {
    // Input validation
    if (!product || !product.pricing || product.pricing.length === 0) {
      throw new Error('Product has no pricing information');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }

    if (end <= start) {
      throw new Error('End time must be after start time');
    }

    // Create cache key
    const cacheKey = `${product._id}-${start.getTime()}-${end.getTime()}`;
    const cached = priceCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      logger.debug('Price cache hit', { productId: product._id, requestId });
      logger.endTimer('price-calculation', requestId, { result: 'cached' });
      return cached.result;
    }

    // Calculate duration in different units with high precision
    const totalMinutes = differenceInMinutes(end, start);
    const hours = Math.ceil(totalMinutes / 60); // Round up to next hour
    const days = Math.ceil(differenceInDays(end, start)) || 1; // Minimum 1 day
    const weeks = Math.ceil(differenceInWeeks(end, start)) || 1; // Minimum 1 week

    // Calculate price for each available unit and find the best option
    const priceOptions = [];

    for (const pricing of product.pricing) {
      let quantity = 0;
      let unitUsed = pricing.unit;

      switch (pricing.unit) {
        case 'hour':
          quantity = hours;
          break;
        case 'day':
          quantity = days;
          break;
        case 'week':
          quantity = weeks;
          break;
        default:
          logger.warn('Unknown pricing unit', { 
            unit: pricing.unit, 
            productId: product._id,
            requestId 
          });
          continue;
      }

      const totalPrice = quantity * pricing.rate;
      
      priceOptions.push({
        unit: unitUsed,
        rate: pricing.rate,
        quantity,
        totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimal places
        pricePerMinute: totalPrice / totalMinutes // For comparison
      });
    }

    if (priceOptions.length === 0) {
      throw new Error('No valid pricing options found');
    }

    // Find the most economical option (lowest price per minute)
    const bestOption = priceOptions.reduce((best, current) => 
      current.pricePerMinute < best.pricePerMinute ? current : best
    );

    // Calculate detailed breakdown
    const result = {
      totalPrice: bestOption.totalPrice,
      bestPricing: {
        unit: bestOption.unit,
        rate: bestOption.rate,
        quantity: bestOption.quantity,
        subtotal: bestOption.totalPrice
      },
      duration: {
        minutes: totalMinutes,
        hours,
        days,
        weeks,
        startTime: start.toISOString(),
        endTime: end.toISOString()
      },
      allOptions: priceOptions.map(opt => ({
        unit: opt.unit,
        rate: opt.rate,
        quantity: opt.quantity,
        totalPrice: opt.totalPrice
      })),
      savings: priceOptions.length > 1 ? 
        Math.round((priceOptions.reduce((max, opt) => 
          opt.totalPrice > max.totalPrice ? opt : max
        ).totalPrice - bestOption.totalPrice) * 100) / 100 : 0
    };

    // Cache the result
    priceCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Clean up expired cache entries (skip in test environment)
    if (process.env.NODE_ENV?.trim() !== 'test' && typeof jest === 'undefined') {
      setTimeout(() => {
        if (priceCache.has(cacheKey)) {
          const entry = priceCache.get(cacheKey);
          if (Date.now() - entry.timestamp >= CACHE_DURATION) {
            priceCache.delete(cacheKey);
          }
        }
      }, CACHE_DURATION);
    }

    logger.info('Price calculated', {
      productId: product._id,
      totalPrice: result.totalPrice,
      unit: result.bestPricing.unit,
      quantity: result.bestPricing.quantity,
      requestId
    });

    logger.endTimer('price-calculation', requestId, { 
      totalPrice: result.totalPrice,
      unit: result.bestPricing.unit
    });

    return result;

  } catch (error) {
    logger.error('Price calculation failed', {
      productId: product._id,
      startTime,
      endTime,
      requestId,
      error: error.message
    });
    
    logger.endTimer('price-calculation', requestId, { result: 'error' });
    throw new Error(`Price calculation failed: ${error.message}`);
  }
};

/**
 * Calculate price for multiple rentals in batch
 * @param {Array} requests - Array of {product, startTime, endTime}
 * @param {String} requestId - Request ID for logging
 * @returns {Array} Array of price calculations
 */
const calculateBatchPrices = (requests, requestId = 'unknown') => {
  logger.startTimer('batch-price-calculation', requestId);
  
  try {
    const results = requests.map((req, index) => {
      try {
        return calculatePrice(req.product, req.startTime, req.endTime, `${requestId}-${index}`);
      } catch (error) {
        return {
          error: true,
          message: error.message,
          productId: req.product._id
        };
      }
    });
    
    logger.endTimer('batch-price-calculation', requestId, { count: requests.length });
    return results;
  } catch (error) {
    logger.error('Batch price calculation failed', { requestId, error: error.message });
    throw error;
  }
};

/**
 * Get price estimates for common durations
 * @param {Object} product - Product with pricing
 * @param {Date} startTime - Base start time
 * @param {String} requestId - Request ID for logging
 * @returns {Object} Price estimates for different durations
 */
const getPriceEstimates = (product, startTime, requestId = 'unknown') => {
  const start = new Date(startTime);
  const estimates = {};
  
  // Common durations: 1 hour, 4 hours, 1 day, 3 days, 1 week
  const durations = [
    { label: '1 hour', hours: 1 },
    { label: '4 hours', hours: 4 },
    { label: '1 day', hours: 24 },
    { label: '3 days', hours: 72 },
    { label: '1 week', hours: 168 }
  ];
  
  durations.forEach(duration => {
    try {
      const endTime = new Date(start.getTime() + (duration.hours * 60 * 60 * 1000));
      const pricing = calculatePrice(product, start, endTime, requestId);
      estimates[duration.label] = {
        duration: duration.label,
        hours: duration.hours,
        totalPrice: pricing.totalPrice,
        bestUnit: pricing.bestPricing.unit
      };
    } catch (error) {
      estimates[duration.label] = {
        error: true,
        message: error.message
      };
    }
  });
  
  return estimates;
};

// Clear cache function for testing/manual refresh
const clearPriceCache = () => {
  priceCache.clear();
  logger.info('Price cache cleared');
};

module.exports = { 
  calculatePrice, 
  calculateBatchPrices,
  getPriceEstimates,
  clearPriceCache
};
