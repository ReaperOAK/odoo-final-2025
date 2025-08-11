const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: String,
  stock: { type: Number, required: true, min: 0 },
  pricing: [{
    unit: { type: String, enum: ['hour', 'day', 'week'], required: true },
    rate: { type: Number, required: true } // rupees/dollars etc
  }],
  images: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Index for search optimization
ProductSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
