const RentalOrder = require('../models/rentalOrder.model');
const Product = require('../models/product.model');

/**
 * Check if a product is available for booking in the given time range
 * @param {String} productId - Product ID
 * @param {Date} startTime - Booking start time
 * @param {Date} endTime - Booking end time
 * @param {Number} qty - Quantity requested (default: 1)
 * @returns {Object} { isAvailable: Boolean, availableStock: Number }
 */
const checkAvailability = async (productId, startTime, endTime, qty = 1) => {
  try {
    // Get product to check total stock
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Count overlapping active bookings
    const overlappingCount = await RentalOrder.countDocuments({
      product: productId,
      status: { $in: ['confirmed', 'picked_up'] },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    });

    const availableStock = product.stock - overlappingCount;
    const isAvailable = availableStock >= qty;

    return {
      isAvailable,
      availableStock,
      requestedQuantity: qty,
      totalStock: product.stock
    };
  } catch (error) {
    throw new Error(`Availability check failed: ${error.message}`);
  }
};

module.exports = { checkAvailability };
