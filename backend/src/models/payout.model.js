const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  payoutId: {
    type: String,
    unique: true,
    index: true
  },
  hostId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  
  // Payout amount details
  amount: { 
    type: Number, 
    required: true,
    min: 0.01
  },
  currency: { 
    type: String, 
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  
  // Payout status
  status: { 
    type: String, 
    enum: [
      'pending',      // Payout request created
      'processing',   // Being processed by payment gateway
      'completed',    // Successfully transferred to host
      'failed',       // Payout failed
      'cancelled',    // Payout cancelled
      'on_hold',      // Held due to verification or dispute
      'reversed'      // Payout was reversed
    ], 
    default: 'pending',
    required: true,
    index: true
  },
  
  // Payout method
  method: { 
    type: String, 
    enum: [
      'bank_transfer',    // Direct bank transfer
      'upi',             // UPI transfer
      'razorpay_payout', // Razorpay payout
      'paypal',          // PayPal payout
      'wallet',          // Digital wallet
      'cheque',          // Bank cheque
      'manual'           // Manual processing
    ],
    required: true,
    default: 'bank_transfer'
  },
  
  // Bank account details (encrypted/tokenized in production)
  bankDetails: {
    accountNumber: { type: String },
    accountHolderName: { type: String },
    bankName: { type: String },
    ifscCode: { type: String },
    branchName: { type: String },
    accountType: { 
      type: String, 
      enum: ['savings', 'current'],
      default: 'savings' 
    },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  },
  
  // UPI details
  upiDetails: {
    vpa: { type: String }, // Virtual Payment Address
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  },
  
  // Payout breakdown
  breakdown: {
    grossAmount: { type: Number, required: true, min: 0 }, // Original earnings
    platformCommission: { type: Number, default: 0, min: 0 },
    processingFee: { type: Number, default: 0, min: 0 },
    taxDeduction: { type: Number, default: 0, min: 0 }, // TDS if applicable
    adjustments: { type: Number, default: 0 }, // Can be positive or negative
    netAmount: { type: Number, required: true, min: 0 } // Final payout amount
  },
  
  // Related orders and earnings
  sourceOrders: [{
    orderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Order',
      required: true 
    },
    orderNumber: { type: String },
    earnings: { type: Number, required: true, min: 0 },
    completedAt: { type: Date }
  }],
  
  // Timeline
  timeline: {
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    processedAt: { type: Date },
    completedAt: { type: Date },
    failedAt: { type: Date },
    cancelledAt: { type: Date }
  },
  
  // Gateway specific details
  gateway: {
    // Razorpay payout fields
    razorpayPayoutId: { type: String, index: true },
    razorpayFundAccountId: { type: String },
    
    // Bank transfer fields
    transactionId: { type: String, index: true },
    utr: { type: String }, // Unique Transaction Reference
    rrn: { type: String }, // Retrieval Reference Number
    
    // Processing details
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    gatewayFee: { type: Number, default: 0, min: 0 },
    exchangeRate: { type: Number }, // For currency conversion
    
    // Failure details
    failureReason: { type: String },
    errorCode: { type: String },
    errorDescription: { type: String }
  },
  
  // Host details at time of payout
  host: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    pan: { type: String }, // For tax purposes
    gst: { type: String }, // GST number if business
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    }
  },
  
  // Verification and compliance
  verification: {
    kycStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending' 
    },
    documentsVerified: { type: Boolean, default: false },
    riskScore: { type: Number, min: 0, max: 100 },
    complianceCheck: {
      amlStatus: { type: String, enum: ['passed', 'failed', 'pending'] },
      sanctionCheck: { type: String, enum: ['passed', 'failed', 'pending'] },
      checkedAt: { type: Date }
    }
  },
  
  // Tax and legal
  tax: {
    tdsApplicable: { type: Boolean, default: false },
    tdsRate: { type: Number, default: 0, min: 0, max: 30 },
    tdsAmount: { type: Number, default: 0, min: 0 },
    gstApplicable: { type: Boolean, default: false },
    gstAmount: { type: Number, default: 0, min: 0 },
    invoiceRequired: { type: Boolean, default: false },
    invoiceGenerated: { type: Boolean, default: false }
  },
  
  // Approval workflow
  approval: {
    autoApproved: { type: Boolean, default: true },
    approvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    approvalNotes: { type: String },
    requiresManualReview: { type: Boolean, default: false },
    reviewReason: { type: String }
  },
  
  // Notifications
  notifications: {
    emailSent: { type: Boolean, default: false },
    smsSent: { type: Boolean, default: false },
    whatsappSent: { type: Boolean, default: false },
    lastNotificationAt: { type: Date }
  },
  
  // Retry mechanism
  retries: [{
    attemptNumber: { type: Number, required: true },
    attemptedAt: { type: Date, default: Date.now },
    status: { type: String, required: true },
    failureReason: { type: String },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed }
  }],
  
  // Dispute and resolution
  disputes: [{
    type: { 
      type: String, 
      enum: ['amount_mismatch', 'account_issue', 'fraud_suspicion', 'other'],
      required: true 
    },
    description: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['open', 'under_review', 'resolved', 'closed'],
      default: 'open' 
    },
    raisedBy: { 
      type: String, 
      enum: ['host', 'admin', 'system'],
      required: true 
    },
    raisedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolution: { type: String }
  }],
  
  // Schedule information (for recurring payouts)
  schedule: {
    isScheduled: { type: Boolean, default: false },
    frequency: { 
      type: String, 
      enum: ['instant', 'daily', 'weekly', 'bi_weekly', 'monthly'],
      default: 'weekly' 
    },
    scheduledFor: { type: Date },
    nextPayoutDate: { type: Date }
  },
  
  // Metadata and tracking
  metadata: {
    source: { 
      type: String, 
      enum: ['auto', 'manual', 'scheduled', 'api'],
      default: 'auto' 
    },
    batchId: { type: String }, // For batch processing
    campaignId: { type: String },
    notes: { type: String },
    tags: [String],
    
    // Performance tracking
    processingTime: { type: Number }, // seconds
    queueTime: { type: Number }, // seconds in queue
    
    // System information
    apiVersion: { type: String, default: '2.0' },
    requestId: { type: String }
  }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to generate payout ID
PayoutSchema.pre('save', function(next) {
  if (!this.payoutId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    this.payoutId = `PO-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Virtuals
PayoutSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

PayoutSchema.virtual('isPending').get(function() {
  return ['pending', 'processing'].includes(this.status);
});

PayoutSchema.virtual('hasFailed').get(function() {
  return ['failed', 'cancelled'].includes(this.status);
});

PayoutSchema.virtual('canRetry').get(function() {
  return this.status === 'failed' && this.retries.length < 3;
});

PayoutSchema.virtual('totalOrders').get(function() {
  return this.sourceOrders.length;
});

PayoutSchema.virtual('processingDuration').get(function() {
  if (this.timeline.completedAt && this.timeline.requestedAt) {
    return Math.round((this.timeline.completedAt - this.timeline.requestedAt) / 1000);
  }
  return null;
});

// Instance methods
PayoutSchema.methods.updateStatus = function(newStatus, notes = '', gatewayResponse = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  const now = new Date();
  
  // Update timeline
  switch (newStatus) {
    case 'processing':
      this.timeline.processedAt = now;
      break;
    case 'completed':
      this.timeline.completedAt = now;
      break;
    case 'failed':
      this.timeline.failedAt = now;
      break;
    case 'cancelled':
      this.timeline.cancelledAt = now;
      break;
  }
  
  // Store gateway response if provided
  if (gatewayResponse) {
    this.gateway.gatewayResponse = gatewayResponse;
    
    // Extract relevant fields
    if (gatewayResponse.payout_id) {
      this.gateway.razorpayPayoutId = gatewayResponse.payout_id;
    }
    if (gatewayResponse.utr) {
      this.gateway.utr = gatewayResponse.utr;
    }
    if (gatewayResponse.failure_reason) {
      this.gateway.failureReason = gatewayResponse.failure_reason;
    }
  }
  
  // Add retry record
  if (this.retries.length === 0 || this.retries[this.retries.length - 1].status !== newStatus) {
    this.retries.push({
      attemptNumber: this.retries.length + 1,
      status: newStatus,
      failureReason: notes,
      gatewayResponse: gatewayResponse
    });
  }
  
  // Update metadata
  if (this.metadata) {
    this.metadata.notes = (this.metadata.notes || '') + 
      `\n[${now.toISOString()}] Status: ${oldStatus} → ${newStatus}. ${notes}`;
  }
  
  return this.save();
};

PayoutSchema.methods.approve = function(approvedBy, notes = '') {
  if (this.status !== 'pending') {
    throw new Error('Can only approve pending payouts');
  }
  
  this.approval.approvedBy = approvedBy;
  this.approval.approvalNotes = notes;
  this.timeline.approvedAt = new Date();
  
  return this.updateStatus('processing', 'Approved for processing');
};

PayoutSchema.methods.addDispute = function(type, description, raisedBy) {
  this.disputes.push({
    type,
    description,
    raisedBy,
    status: 'open'
  });
  
  // Put payout on hold if not already processed
  if (['pending', 'processing'].includes(this.status)) {
    this.status = 'on_hold';
  }
  
  return this.save();
};

PayoutSchema.methods.calculateTax = function() {
  const grossAmount = this.breakdown.grossAmount;
  
  // Calculate TDS if applicable (for Indian hosts earning > threshold)
  if (this.tax.tdsApplicable && this.tax.tdsRate > 0) {
    this.tax.tdsAmount = (grossAmount * this.tax.tdsRate) / 100;
  }
  
  // Calculate GST if applicable (for business accounts)
  if (this.tax.gstApplicable) {
    this.tax.gstAmount = (grossAmount * 18) / 100; // 18% GST
  }
  
  // Update breakdown
  this.breakdown.taxDeduction = this.tax.tdsAmount;
  this.breakdown.netAmount = grossAmount - 
    this.breakdown.platformCommission - 
    this.breakdown.processingFee - 
    this.breakdown.taxDeduction + 
    this.breakdown.adjustments;
    
  return this.save();
};

PayoutSchema.methods.retry = function() {
  if (!this.canRetry) {
    throw new Error('Payout cannot be retried');
  }
  
  this.status = 'pending';
  return this.save();
};

PayoutSchema.methods.addSourceOrder = function(orderId, orderNumber, earnings, completedAt) {
  // Check if order already exists
  const existingOrder = this.sourceOrders.find(
    order => order.orderId.toString() === orderId.toString()
  );
  
  if (!existingOrder) {
    this.sourceOrders.push({
      orderId,
      orderNumber,
      earnings,
      completedAt
    });
    
    // Update breakdown
    this.breakdown.grossAmount = (this.breakdown.grossAmount || 0) + earnings;
    this.breakdown.netAmount = (this.breakdown.netAmount || 0) + earnings;
  }
  
  return this.save();
};

// Static methods
PayoutSchema.statics.findByPayoutId = function(payoutId) {
  return this.findOne({ payoutId })
    .populate('hostId', 'name email phone hostProfile')
    .populate('sourceOrders.orderId', 'orderNumber pricing.hostEarnings timeline.completedAt');
};

PayoutSchema.statics.createFromOrders = async function(hostId, orderIds) {
  const Order = mongoose.model('Order');
  
  // Get completed orders for the host
  const orders = await Order.find({
    _id: { $in: orderIds },
    hostId: hostId,
    status: 'completed',
    'payment.status': 'completed'
  });
  
  if (orders.length === 0) {
    throw new Error('No eligible orders found for payout');
  }
  
  // Calculate total earnings
  const totalEarnings = orders.reduce((sum, order) => sum + order.pricing.hostEarnings, 0);
  const platformCommission = orders.reduce((sum, order) => sum + order.pricing.platformCommission, 0);
  
  // Get host details
  const User = mongoose.model('User');
  const host = await User.findById(hostId);
  
  if (!host || !host.isHost) {
    throw new Error('Invalid host');
  }
  
  // Create payout
  const payout = new this({
    hostId: hostId,
    amount: totalEarnings,
    breakdown: {
      grossAmount: totalEarnings + platformCommission,
      platformCommission: platformCommission,
      netAmount: totalEarnings
    },
    sourceOrders: orders.map(order => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      earnings: order.pricing.hostEarnings,
      completedAt: order.timeline.completedAt
    })),
    host: {
      name: host.name,
      email: host.email,
      phone: host.hostProfile?.phone,
      address: host.hostProfile?.address
    }
  });
  
  return payout.save();
};

PayoutSchema.statics.getPayoutStats = function(hostId, dateRange = {}) {
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
        totalPayouts: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedPayouts: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
        },
        avgAmount: { $avg: '$amount' },
        avgProcessingTime: { $avg: '$metadata.processingTime' }
      }
    }
  ]);
};

PayoutSchema.statics.getPendingPayouts = function(filters = {}) {
  const query = { status: { $in: ['pending', 'processing'] } };
  
  if (filters.hostId) query.hostId = filters.hostId;
  if (filters.method) query.method = filters.method;
  if (filters.minAmount) query.amount = { $gte: filters.minAmount };
  
  return this.find(query)
    .populate('hostId', 'name email hostProfile')
    .sort({ createdAt: 1 });
};

// Indexes for performance optimization
PayoutSchema.index({ payoutId: 1 }, { unique: true });
PayoutSchema.index({ hostId: 1, createdAt: -1 });
PayoutSchema.index({ status: 1, createdAt: -1 });
PayoutSchema.index({ method: 1, status: 1 });
PayoutSchema.index({ 'gateway.razorpayPayoutId': 1 });
PayoutSchema.index({ 'gateway.transactionId': 1 });
PayoutSchema.index({ createdAt: -1 });

// Compound indexes for common queries
PayoutSchema.index({ hostId: 1, status: 1, createdAt: -1 });
PayoutSchema.index({ status: 1, method: 1, createdAt: -1 });
PayoutSchema.index({ 'schedule.scheduledFor': 1, status: 1 });

module.exports = mongoose.model('Payout', PayoutSchema);
