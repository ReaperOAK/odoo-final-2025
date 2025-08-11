const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  listingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing', 
    required: true,
    index: true 
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    index: true 
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1,
    max: 1000
  },
  startDate: { 
    type: Date, 
    required: true, 
    index: true,
    validate: {
      validator: function(v) {
        return v >= new Date();
      },
      message: 'Start date cannot be in the past'
    }
  },
  endDate: { 
    type: Date, 
    required: true, 
    index: true,
    validate: {
      validator: function(v) {
        return v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  status: { 
    type: String, 
    enum: [
      'pending',     // Initial state, payment not confirmed
      'confirmed',   // Payment confirmed, reservation active
      'picked_up',   // Items picked up by customer
      'in_progress', // Rental in progress
      'returned',    // Items returned by customer
      'completed',   // Rental completed successfully
      'cancelled',   // Cancelled by customer or host
      'expired',     // Reservation expired (not picked up)
      'disputed'     // Dispute raised
    ], 
    default: 'pending',
    index: true
  },
  
  // Pricing breakdown
  pricing: {
    unitPrice: { type: Number, required: true, min: 0 },
    totalHours: { type: Number, min: 0 },
    totalDays: { type: Number, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    hostEarnings: { type: Number, required: true, min: 0 }
  },
  
  // Timeline tracking
  timeline: {
    reservedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
    pickedUpAt: { type: Date },
    expectedReturnAt: { type: Date },
    returnedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date }
  },
  
  // Pickup and return details
  pickup: {
    method: { 
      type: String, 
      enum: ['self_pickup', 'delivery'], 
      default: 'self_pickup' 
    },
    address: { type: String },
    instructions: { type: String },
    contactPerson: { type: String },
    contactPhone: { type: String },
    scheduledTime: { type: Date },
    actualTime: { type: Date },
    notes: { type: String },
    images: [String],
    verificationCode: { type: String }
  },
  
  return: {
    method: { 
      type: String, 
      enum: ['self_return', 'pickup'], 
      default: 'self_return' 
    },
    address: { type: String },
    instructions: { type: String },
    scheduledTime: { type: Date },
    actualTime: { type: Date },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'damaged'],
      default: 'good'
    },
    notes: { type: String },
    images: [String],
    damageReport: {
      hasDamage: { type: Boolean, default: false },
      description: { type: String },
      estimatedCost: { type: Number, min: 0 },
      images: [String]
    },
    verificationCode: { type: String }
  },
  
  // Additional charges
  additionalCharges: [{
    type: { 
      type: String, 
      enum: ['late_fee', 'damage_fee', 'cleaning_fee', 'delivery_fee', 'other'],
      required: true 
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    appliedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['pending', 'applied', 'disputed', 'waived'],
      default: 'pending' 
    }
  }],
  
  // Communication
  messages: [{
    from: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: { 
      type: String, 
      enum: ['message', 'system', 'reminder'],
      default: 'message' 
    }
  }],
  
  // Reviews and ratings
  review: {
    customerRating: { type: Number, min: 1, max: 5 },
    customerReview: { type: String, maxlength: 1000 },
    hostRating: { type: Number, min: 1, max: 5 },
    hostReview: { type: String, maxlength: 1000 },
    reviewedAt: { type: Date }
  },
  
  // System fields
  cancellationReason: { type: String },
  adminNotes: { type: String },
  isLateReturn: { type: Boolean, default: false },
  lateReturnHours: { type: Number, default: 0, min: 0 },
  extensionRequests: [{
    requestedEndDate: { type: Date, required: true },
    reason: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending' 
    },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
    additionalCost: { type: Number, min: 0 }
  }],
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
ReservationSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

ReservationSchema.virtual('isActive').get(function() {
  return ['confirmed', 'picked_up', 'in_progress'].includes(this.status);
});

ReservationSchema.virtual('isOverdue').get(function() {
  return this.status === 'picked_up' && new Date() > this.endDate;
});

ReservationSchema.virtual('canCancel').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

ReservationSchema.virtual('totalCharges').get(function() {
  const additionalTotal = this.additionalCharges
    .filter(charge => charge.status === 'applied')
    .reduce((sum, charge) => sum + charge.amount, 0);
  return this.pricing.totalAmount + additionalTotal;
});

// Instance methods
ReservationSchema.methods.updateStatus = function(newStatus, notes = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  const now = new Date();
  
  switch (newStatus) {
    case 'confirmed':
      this.timeline.confirmedAt = now;
      break;
    case 'picked_up':
      this.timeline.pickedUpAt = now;
      this.pickup.actualTime = now;
      break;
    case 'returned':
      this.timeline.returnedAt = now;
      this.return.actualTime = now;
      this.checkForLateReturn();
      break;
    case 'completed':
      this.timeline.completedAt = now;
      break;
    case 'cancelled':
      this.timeline.cancelledAt = now;
      break;
  }
  
  // Add system message
  this.messages.push({
    from: null, // System message
    message: `Status changed from ${oldStatus} to ${newStatus}${notes ? ': ' + notes : ''}`,
    type: 'system'
  });
  
  return this.save();
};

ReservationSchema.methods.checkForLateReturn = function() {
  if (this.timeline.returnedAt && this.timeline.returnedAt > this.endDate) {
    this.isLateReturn = true;
    this.lateReturnHours = Math.ceil(
      (this.timeline.returnedAt - this.endDate) / (1000 * 60 * 60)
    );
    
    // Calculate late fee if applicable
    const listing = this.populated('listingId') || this.listingId;
    if (listing && listing.policies && listing.policies.lateReturnFee > 0) {
      this.addAdditionalCharge(
        'late_fee',
        listing.policies.lateReturnFee * this.lateReturnHours,
        `Late return fee for ${this.lateReturnHours} hours`
      );
    }
  }
};

ReservationSchema.methods.addAdditionalCharge = function(type, amount, description) {
  this.additionalCharges.push({
    type,
    amount,
    description,
    status: 'pending'
  });
  return this.save();
};

ReservationSchema.methods.addMessage = function(fromUserId, message, type = 'message') {
  this.messages.push({
    from: fromUserId,
    message,
    type
  });
  return this.save();
};

ReservationSchema.methods.requestExtension = function(newEndDate, reason) {
  // Calculate additional cost based on extended period
  const currentDuration = this.duration;
  const newDuration = Math.ceil((newEndDate - this.startDate) / (1000 * 60 * 60 * 24));
  const extraDays = newDuration - currentDuration;
  const additionalCost = extraDays * this.pricing.unitPrice;
  
  this.extensionRequests.push({
    requestedEndDate: newEndDate,
    reason,
    additionalCost
  });
  
  return this.save();
};

ReservationSchema.methods.canModify = function(userId) {
  return this.customerId.toString() === userId.toString() || 
         this.hostId.toString() === userId.toString();
};

// Static methods for availability checking
ReservationSchema.statics.checkAvailability = async function(listingId, startDate, endDate, quantity = 1) {
  try {
    // Find overlapping confirmed reservations
    const overlappingReservations = await this.aggregate([
      {
        $match: {
          listingId: mongoose.Types.ObjectId(listingId),
          status: { $in: ['confirmed', 'picked_up', 'in_progress'] },
          $or: [
            {
              $and: [
                { startDate: { $lte: new Date(startDate) } },
                { endDate: { $gt: new Date(startDate) } }
              ]
            },
            {
              $and: [
                { startDate: { $lt: new Date(endDate) } },
                { endDate: { $gte: new Date(endDate) } }
              ]
            },
            {
              $and: [
                { startDate: { $gte: new Date(startDate) } },
                { endDate: { $lte: new Date(endDate) } }
              ]
            }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalReservedQuantity: { $sum: '$quantity' }
        }
      }
    ]);
    
    const reservedQuantity = overlappingReservations.length > 0 ? 
      overlappingReservations[0].totalReservedQuantity : 0;
    
    // Get listing details
    const Listing = mongoose.model('Listing');
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      throw new Error('Listing not found');
    }
    
    const availableQuantity = listing.totalQuantity - reservedQuantity;
    
    return {
      available: availableQuantity >= quantity,
      availableQuantity,
      requestedQuantity: quantity,
      reservedQuantity
    };
  } catch (error) {
    throw new Error(`Availability check failed: ${error.message}`);
  }
};

ReservationSchema.statics.findConflicts = function(listingId, startDate, endDate, excludeReservationId = null) {
  const query = {
    listingId: new mongoose.Types.ObjectId(listingId),
    status: { $in: ['confirmed', 'picked_up', 'in_progress'] },
    $or: [
      {
        $and: [
          { startDate: { $lte: new Date(startDate) } },
          { endDate: { $gt: new Date(startDate) } }
        ]
      },
      {
        $and: [
          { startDate: { $lt: new Date(endDate) } },
          { endDate: { $gte: new Date(endDate) } }
        ]
      },
      {
        $and: [
          { startDate: { $gte: new Date(startDate) } },
          { endDate: { $lte: new Date(endDate) } }
        ]
      }
    ]
  };
  
  if (excludeReservationId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeReservationId) };
  }
  
  return this.find(query);
};

// Pre-save middleware
ReservationSchema.pre('save', function(next) {
  // Calculate expected return date if not set
  if (!this.timeline.expectedReturnAt) {
    this.timeline.expectedReturnAt = this.endDate;
  }
  
  // Set verification codes for pickup/return if not set
  if (!this.pickup.verificationCode && this.status === 'confirmed') {
    this.pickup.verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  if (!this.return.verificationCode && this.status === 'picked_up') {
    this.return.verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  next();
});

// Indexes for performance optimization
ReservationSchema.index({ listingId: 1, startDate: 1, endDate: 1 });
ReservationSchema.index({ customerId: 1, status: 1, createdAt: -1 });
ReservationSchema.index({ hostId: 1, status: 1, createdAt: -1 });
ReservationSchema.index({ orderId: 1 });
ReservationSchema.index({ status: 1, createdAt: -1 });
ReservationSchema.index({ startDate: 1, endDate: 1 });
ReservationSchema.index({ 'timeline.expectedReturnAt': 1, status: 1 });

// Compound indexes for availability checking
ReservationSchema.index({ 
  listingId: 1, 
  status: 1, 
  startDate: 1, 
  endDate: 1 
});

module.exports = mongoose.model('Reservation', ReservationSchema);
