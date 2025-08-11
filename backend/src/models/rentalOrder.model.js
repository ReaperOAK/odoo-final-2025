const mongoose = require('mongoose');

const RentalOrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true, index: true },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['confirmed', 'picked_up', 'returned', 'cancelled'], 
    default: 'confirmed', 
    index: true 
  },
  lateFee: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for availability queries
RentalOrderSchema.index({ product: 1, startTime: 1, endTime: 1 });
RentalOrderSchema.index({ customer: 1, createdAt: -1 });
RentalOrderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('RentalOrder', RentalOrderSchema);
