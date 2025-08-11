const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    index: true
  },
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  lenderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  
  // Order can contain multiple line items (different listings or same listing with different dates)
  lineItems: [{
    listingId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Listing', 
      required: true 
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation'
    },
    quantity: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true }, // in days or hours
    subtotal: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0 }
  }],
  
  // Pricing breakdown
  pricing: {
    subtotal: { type: Number, required: true, min: 0 },
    totalDeposit: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    
    // Commission breakdown
    platformCommission: { type: Number, default: 0, min: 0 },
    lenderEarnings: { type: Number, required: true, min: 0 },
    
    // Payment breakdown
    paidAmount: { type: Number, default: 0, min: 0 },
    refundAmount: { type: Number, default: 0, min: 0 },
    pendingAmount: { type: Number, default: 0, min: 0 }
  },
  
  // Order status
  status: { 
    type: String, 
    enum: [
      'draft',        // Order created but not paid
      'pending',      // Payment initiated
      'confirmed',    // Payment successful, reservations confirmed
      'in_progress',  // Items picked up, rental active
      'completed',    // All items returned, order finished
      'cancelled',    // Order cancelled
      'refunded',     // Order refunded
      'disputed'      // Dispute raised
    ], 
    default: 'draft',
    index: true 
  },
  
  // Payment details
  payment: {
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'], 
      default: 'pending',
      index: true
    },
    method: { 
      type: String, 
      enum: ['razorpay', 'stripe', 'paypal', 'wallet', 'cash', 'bank_transfer'],
      default: 'razorpay'
    },
    currency: { type: String, default: 'INR' },
    
    // Payment gateway details
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    
    // Transaction timeline
    initiatedAt: { type: Date },
    completedAt: { type: Date },
    failedAt: { type: Date },
    
    // Refund details
    refunds: [{
      amount: { type: Number, required: true, min: 0 },
      reason: { type: String, required: true },
      refundId: { type: String },
      status: { 
        type: String, 
        enum: ['pending', 'processed', 'failed'],
        default: 'pending' 
      },
      requestedAt: { type: Date, default: Date.now },
      processedAt: { type: Date }
    }],
    
    paymentAttempts: [{
      amount: { type: Number, required: true },
      status: { type: String, enum: ['success', 'failed'], required: true },
      gatewayResponse: { type: mongoose.Schema.Types.Mixed },
      attemptedAt: { type: Date, default: Date.now },
      failureReason: { type: String }
    }]
  },
  
  // Customer details
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    }
  },
  
  // Lender details
  lender: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    businessName: String
  },
  
  // Timeline
  timeline: {
    createdAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
    startedAt: { type: Date }, // First item picked up
    completedAt: { type: Date }, // Last item returned
    cancelledAt: { type: Date }
  },
  
  // Communication and notes
  notes: {
    customerNotes: { type: String },
    hostNotes: { type: String },
    adminNotes: { type: String },
    internalNotes: { type: String }
  },
  
  // Special instructions
  instructions: {
    pickup: { type: String },
    return: { type: String },
    usage: { type: String },
    emergency: { type: String }
  },
  
  // Cancellation details
  cancellation: {
    reason: { type: String },
    cancelledBy: { 
      type: String, 
      enum: ['customer', 'lender', 'admin', 'system'] 
    },
    cancellationFee: { type: Number, default: 0, min: 0 },
    refundAmount: { type: Number, default: 0, min: 0 },
    refundPolicy: { type: String }
  },
  
  // Reviews and ratings
  reviews: {
    customerToLender: {
      rating: { type: Number, min: 1, max: 5 },
      review: { type: String, maxlength: 1000 },
      reviewedAt: { type: Date }
    },
    lenderToCustomer: {
      rating: { type: Number, min: 1, max: 5 },
      review: { type: String, maxlength: 1000 },
      reviewedAt: { type: Date }
    }
  },
  
  // Additional charges applied to the order
  additionalCharges: [{
    type: { 
      type: String, 
      enum: ['late_fee', 'damage_fee', 'cleaning_fee', 'delivery_fee', 'convenience_fee', 'other'],
      required: true 
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    appliedAt: { type: Date, default: Date.now },
    appliedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    status: { 
      type: String, 
      enum: ['pending', 'applied', 'disputed', 'waived'],
      default: 'applied' 
    }
  }],
  
  // Dispute handling
  disputes: [{
    type: { 
      type: String, 
      enum: ['damage', 'late_return', 'no_show', 'payment', 'service', 'other'],
      required: true 
    },
    description: { type: String, required: true },
    raisedBy: { 
      type: String, 
      enum: ['customer', 'host'],
      required: true 
    },
    status: { 
      type: String, 
      enum: ['open', 'under_review', 'resolved', 'closed'],
      default: 'open' 
    },
    resolution: { type: String },
    raisedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    assignedTo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }
  }],
  
  // Delivery/pickup tracking
  logistics: {
    deliveryRequired: { type: Boolean, default: false },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    deliveryFee: { type: Number, default: 0, min: 0 },
    deliveryInstructions: String,
    trackingNumber: String,
    courierPartner: String
  },
  
  // System metadata
  metadata: {
    source: { 
      type: String, 
      enum: ['web', 'mobile', 'api'],
      default: 'web' 
    },
    userAgent: String,
    ipAddress: String,
    referrer: String,
    campaign: String,
    version: { type: String, default: '2.0' }
  },
  
  // Analytics and tracking
  analytics: {
    conversionSource: String,
    timeToBook: Number, // seconds from listing view to order
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    browser: String
  }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to generate order number
OrderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    this.orderNumber = `ORD-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Virtuals
OrderSchema.virtual('totalItems').get(function() {
  return this.lineItems.reduce((total, item) => total + item.quantity, 0);
});

OrderSchema.virtual('totalDuration').get(function() {
  return Math.max(...this.lineItems.map(item => item.duration));
});

OrderSchema.virtual('isRefundable').get(function() {
  return ['confirmed', 'in_progress'].includes(this.status) && 
         this.payment.status === 'completed';
});

OrderSchema.virtual('canCancel').get(function() {
  return ['draft', 'pending', 'confirmed'].includes(this.status);
});

OrderSchema.virtual('finalAmount').get(function() {
  const additionalTotal = this.additionalCharges
    .filter(charge => charge.status === 'applied')
    .reduce((sum, charge) => sum + charge.amount, 0);
  return this.pricing.totalAmount + additionalTotal;
});

// Instance methods
OrderSchema.methods.updateStatus = function(newStatus, notes = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  const now = new Date();
  
  switch (newStatus) {
    case 'confirmed':
      this.timeline.confirmedAt = now;
      this.payment.completedAt = now;
      this.payment.status = 'completed';
      break;
    case 'in_progress':
      this.timeline.startedAt = now;
      break;
    case 'completed':
      this.timeline.completedAt = now;
      break;
    case 'cancelled':
      this.timeline.cancelledAt = now;
      break;
  }
  
  if (notes) {
    this.notes.internalNotes = (this.notes.internalNotes || '') + 
      `\n[${now.toISOString()}] Status: ${oldStatus} → ${newStatus}. ${notes}`;
  }
  
  return this.save();
};

OrderSchema.methods.addAdditionalCharge = function(type, amount, description, appliedBy) {
  this.additionalCharges.push({
    type,
    amount,
    description,
    appliedBy,
    status: 'applied'
  });
  return this.save();
};

OrderSchema.methods.processRefund = function(amount, reason) {
  if (amount > this.pricing.paidAmount) {
    throw new Error('Refund amount cannot exceed paid amount');
  }
  
  this.payment.refunds.push({
    amount,
    reason,
    status: 'pending'
  });
  
  this.pricing.refundAmount = (this.pricing.refundAmount || 0) + amount;
  this.pricing.pendingAmount = this.pricing.totalAmount - this.pricing.paidAmount - this.pricing.refundAmount;
  
  return this.save();
};

OrderSchema.methods.addDispute = function(type, description, raisedBy) {
  this.disputes.push({
    type,
    description,
    raisedBy,
    status: 'open'
  });
  
  if (this.status !== 'disputed') {
    this.status = 'disputed';
  }
  
  return this.save();
};

OrderSchema.methods.calculateEarnings = function() {
  const platformCommissionRate = 0.05; // 5% platform commission
  const subtotal = this.pricing.subtotal;
  const platformCommission = subtotal * platformCommissionRate;
  const hostEarnings = subtotal - platformCommission;
  
  this.pricing.platformCommission = platformCommission;
  this.pricing.hostEarnings = hostEarnings;
  
  return {
    platformCommission,
    hostEarnings,
    commissionRate: platformCommissionRate
  };
};

OrderSchema.methods.canReview = function(userId) {
  return (this.customerId.toString() === userId.toString() || 
          this.hostId.toString() === userId.toString()) &&
         this.status === 'completed';
};

OrderSchema.methods.addReview = function(userId, rating, review) {
  if (this.customerId.toString() === userId.toString()) {
    this.reviews.customerToHost = {
      rating,
      review,
      reviewedAt: new Date()
    };
  } else if (this.hostId.toString() === userId.toString()) {
    this.reviews.hostToCustomer = {
      rating,
      review,
      reviewedAt: new Date()
    };
  } else {
    throw new Error('User not authorized to review this order');
  }
  
  return this.save();
};

// Static methods
OrderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber })
    .populate('customerId', 'name email phone')
    .populate('hostId', 'name email phone hostProfile')
    .populate('lineItems.listingId', 'title images category location')
    .populate('lineItems.reservationId');
};

OrderSchema.statics.getOrderStats = function(hostId, dateRange = {}) {
  const matchStage = { hostId: mongoose.Types.ObjectId(hostId) };
  
  if (dateRange.start || dateRange.end) {
    matchStage.createdAt = {};
    if (dateRange.start) matchStage.createdAt.$gte = new Date(dateRange.start);
    if (dateRange.end) matchStage.createdAt.$lte = new Date(dateRange.end);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.hostEarnings' },
        avgOrderValue: { $avg: '$pricing.totalAmount' },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Indexes for performance optimization
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ hostId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'payment.status': 1 });
OrderSchema.index({ 'payment.razorpayOrderId': 1 });
OrderSchema.index({ createdAt: -1 });

// Compound indexes for common queries
OrderSchema.index({ hostId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ customerId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ 'payment.status': 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
