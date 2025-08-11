const { differenceInHours, differenceInDays, differenceInWeeks } = require('date-fns');

/**
 * Calculate rental price based on product pricing and duration
 * @param {Object} product - Product with pricing array
 * @param {Date} startTime - Rental start time
 * @param {Date} endTime - Rental end time
 * @returns {Number} Total price
 */
const calculatePrice = (product, startTime, endTime) => {
  if (!product.pricing || product.pricing.length === 0) {
    throw new Error('Product has no pricing information');
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    throw new Error('End time must be after start time');
  }

  // Calculate duration in different units
  const hours = differenceInHours(end, start);
  const days = differenceInDays(end, start);
  const weeks = differenceInWeeks(end, start);

  // Find the best pricing option (lowest total cost)
  let bestPrice = Infinity;

  for (const pricing of product.pricing) {
    let totalPrice = 0;

    switch (pricing.unit) {
      case 'hour':
        totalPrice = hours * pricing.rate;
        break;
      case 'day':
        totalPrice = Math.max(1, days) * pricing.rate; // Minimum 1 day
        break;
      case 'week':
        totalPrice = Math.max(1, weeks) * pricing.rate; // Minimum 1 week
        break;
      default:
        continue;
    }

    if (totalPrice < bestPrice) {
      bestPrice = totalPrice;
    }
  }

  if (bestPrice === Infinity) {
    throw new Error('Unable to calculate price with available pricing options');
  }

  return Math.round(bestPrice * 100) / 100; // Round to 2 decimal places
};

module.exports = { calculatePrice };
