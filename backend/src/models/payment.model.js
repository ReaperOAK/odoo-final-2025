const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    required: true,
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
  
  // Payment amount details
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
  
  // Payment method and gateway
  method: { 
    type: String, 
    enum: [
      'razorpay', 'stripe', 'paypal', 'paytm', 'googlepay', 
      'phonepe', 'wallet', 'upi', 'netbanking', 'card', 
      'cash', 'bank_transfer'
    ],
    required: true,
    default: 'razorpay'
  },
  
  // Payment gateway specific fields
  gateway: {
    // Razorpay fields
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },
    
    // Stripe fields
    stripePaymentIntentId: { type: String },
    stripeChargeId: { type: String },
    
    // PayPal fields
    paypalOrderId: { type: String },
    paypalPaymentId: { type: String },
    
    // UPI fields
    upiTransactionId: { type: String },
    upiVPA: { type: String },
    
    // Card details (tokenized)
    cardLast4: { type: String },
    cardBrand: { type: String },
    cardType: { type: String }, // debit/credit
    
    // Bank details
    bankName: { type: String },
    bankCode: { type: String }
  },
  
  // Payment status
  status: { 
    type: String, 
    enum: [
      'initiated',     // Payment request created
      'pending',       // Waiting for user action
      'processing',    // Payment being processed
      'completed',     // Payment successful
      'failed',        // Payment failed
      'cancelled',     // Payment cancelled by user
      'expired',       // Payment session expired
      'refunded',      // Payment refunded
      'disputed'       // Payment disputed
    ], 
    default: 'initiated',
    required: true,
    index: true
  },
  
  // Payment type
  type: {
    type: String,
    enum: ['booking', 'deposit', 'full_payment', 'additional_charge', 'refund'],
    default: 'booking',
    required: true
  },
  
  // Timeline
  timeline: {
    initiatedAt: { type: Date, default: Date.now },
    pendingAt: { type: Date },
    processingAt: { type: Date },
    completedAt: { type: Date },
    failedAt: { type: Date },
    cancelledAt: { type: Date },
    expiredAt: { type: Date },
    refundedAt: { type: Date }
  },
  
  // Payment breakdown
  breakdown: {
    subtotal: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    convenienceFee: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponDiscount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 }
  },
  
  // Gateway response details
  gatewayResponse: {
    raw: { type: mongoose.Schema.Types.Mixed }, // Full gateway response
    transactionId: { type: String, index: true },
    authCode: { type: String },
    rrn: { type: String }, // Retrieval Reference Number
    processorResponseCode: { type: String },
    processorResponseText: { type: String }
  },
  
  // Failure details
  failure: {
    errorCode: { type: String },
    errorDescription: { type: String },
    failureReason: { type: String },
    retryCount: { type: Number, default: 0 },
    lastRetryAt: { type: Date }
  },
  
  // Refund details
  refund: {
    refundId: { type: String },
    refundAmount: { type: Number, min: 0 },
    refundReason: { type: String },
    refundStatus: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed']
    },
    refundInitiatedAt: { type: Date },
    refundCompletedAt: { type: Date },
    refundReference: { type: String }
  },
  
  // Customer payment details
  customer: {
    email: { type: String, required: true },
    phone: { type: String },
    name: { type: String, required: true }
  },
  
  // Security and fraud detection
  security: {
    ipAddress: { type: String, required: true },
    userAgent: { type: String },
    fingerprint: { type: String },
    riskScore: { type: Number, min: 0, max: 100 },
    fraudCheck: {
      status: { 
        type: String, 
        enum: ['passed', 'failed', 'manual_review'],
        default: 'passed' 
      },
      reason: { type: String },
      checkedAt: { type: Date }
    }
  },
  
  // Webhook and notification details
  webhooks: [{
    eventType: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    signature: { type: String },
    verificationStatus: { 
      type: String, 
      enum: ['verified', 'failed', 'pending'],
      default: 'pending' 
    },
    receivedAt: { type: Date, default: Date.now },
    processedAt: { type: Date }
  }],
  
  // Reconciliation
  reconciliation: {
    isReconciled: { type: Boolean, default: false },
    reconciledAt: { type: Date },
    settlementId: { type: String },
    settlementAmount: { type: Number },
    settlementDate: { type: Date },
    fees: {
      gatewayFee: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      netAmount: { type: Number }
    }
  },
  
  // Metadata
  metadata: {
    sessionId: { type: String },
    deviceType: { type: String, enum: ['mobile', 'desktop', 'tablet'] },
    browser: { type: String },
    source: { type: String, enum: ['web', 'mobile_app', 'api'] },
    campaign: { type: String },
    referrer: { type: String }
  },
  
  // Additional tracking
  attempts: [{
    attemptNumber: { type: Number, required: true },
    status: { type: String, required: true },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    attemptedAt: { type: Date, default: Date.now },
    failureReason: { type: String }
  }],
  
  notes: { type: String }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
PaymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

PaymentSchema.virtual('isFailed').get(function() {
  return ['failed', 'cancelled', 'expired'].includes(this.status);
});

PaymentSchema.virtual('isPending').get(function() {
  return ['initiated', 'pending', 'processing'].includes(this.status);
});

PaymentSchema.virtual('canRefund').get(function() {
  return this.status === 'completed' && !this.refund.refundAmount;
});

PaymentSchema.virtual('processingTime').get(function() {
  if (this.timeline.completedAt && this.timeline.initiatedAt) {
    return Math.round((this.timeline.completedAt - this.timeline.initiatedAt) / 1000);
  }
  return null;
});

// Instance methods
PaymentSchema.methods.updateStatus = function(newStatus, gatewayResponse = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  const now = new Date();
  
  // Update timeline
  switch (newStatus) {
    case 'pending':
      this.timeline.pendingAt = now;
      break;
    case 'processing':
      this.timeline.processingAt = now;
      break;
    case 'completed':
      this.timeline.completedAt = now;
      break;
    case 'failed':
      this.timeline.failedAt = now;
      this.failure.retryCount = (this.failure.retryCount || 0) + 1;
      this.failure.lastRetryAt = now;
      break;
    case 'cancelled':
      this.timeline.cancelledAt = now;
      break;
    case 'expired':
      this.timeline.expiredAt = now;
      break;
    case 'refunded':
      this.timeline.refundedAt = now;
      break;
  }
  
  // Store gateway response
  if (gatewayResponse) {
    this.gatewayResponse.raw = gatewayResponse;
    
    // Extract common fields based on payment method
    if (this.method === 'razorpay' && gatewayResponse.razorpay_payment_id) {
      this.gateway.razorpayPaymentId = gatewayResponse.razorpay_payment_id;
      this.gateway.razorpaySignature = gatewayResponse.razorpay_signature;
    }
  }
  
  // Add attempt record
  this.attempts.push({
    attemptNumber: this.attempts.length + 1,
    status: newStatus,
    gatewayResponse: gatewayResponse,
    failureReason: newStatus === 'failed' ? gatewayResponse?.error_description : null
  });
  
  return this.save();
};

PaymentSchema.methods.processRefund = function(amount, reason) {
  if (!this.isSuccessful) {
    throw new Error('Cannot refund unsuccessful payment');
  }
  
  if (amount > this.amount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }
  
  this.refund = {
    refundAmount: amount,
    refundReason: reason,
    refundStatus: 'pending',
    refundInitiatedAt: new Date()
  };
  
  return this.save();
};

PaymentSchema.methods.addWebhook = function(eventType, payload, signature) {
  this.webhooks.push({
    eventType,
    payload,
    signature,
    receivedAt: new Date()
  });
  
  return this.save();
};

PaymentSchema.methods.verifyWebhook = function(webhookIndex, isVerified) {
  if (this.webhooks[webhookIndex]) {
    this.webhooks[webhookIndex].verificationStatus = isVerified ? 'verified' : 'failed';
    this.webhooks[webhookIndex].processedAt = new Date();
  }
  
  return this.save();
};

PaymentSchema.methods.calculateFees = function() {
  const gatewayFeeRate = 0.025; // 2.5% gateway fee
  const gstRate = 0.18; // 18% GST on gateway fee
  
  const gatewayFee = this.amount * gatewayFeeRate;
  const gst = gatewayFee * gstRate;
  const netAmount = this.amount - gatewayFee - gst;
  
  this.reconciliation.fees = {
    gatewayFee,
    gst,
    netAmount
  };
  
  return {
    gatewayFee,
    gst,
    netAmount,
    totalFees: gatewayFee + gst
  };
};

// Static methods
PaymentSchema.statics.findByGatewayId = function(gatewayId, method = 'razorpay') {
  const query = {};
  
  switch (method) {
    case 'razorpay':
      query.$or = [
        { 'gateway.razorpayOrderId': gatewayId },
        { 'gateway.razorpayPaymentId': gatewayId }
      ];
      break;
    case 'stripe':
      query.$or = [
        { 'gateway.stripePaymentIntentId': gatewayId },
        { 'gateway.stripeChargeId': gatewayId }
      ];
      break;
  }
  
  return this.findOne(query);
};

PaymentSchema.statics.getPaymentStats = function(filters = {}) {
  const matchStage = {};
  
  if (filters.startDate || filters.endDate) {
    matchStage.createdAt = {};
    if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.createdAt.$lte = new Date(filters.endDate);
  }
  
  if (filters.method) matchStage.method = filters.method;
  if (filters.status) matchStage.status = filters.status;
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        successfulAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        },
        refundedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$refund.refundAmount', 0] }
        }
      }
    },
    {
      $addFields: {
        successRate: {
          $multiply: [
            { $divide: ['$successfulPayments', '$totalPayments'] },
            100
          ]
        }
      }
    }
  ]);
};

PaymentSchema.statics.getDailyStats = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        successfulAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

// Pre-save middleware
PaymentSchema.pre('save', function(next) {
  // Ensure breakdown totals are correct
  if (this.breakdown) {
    const calculatedTotal = this.breakdown.subtotal + 
                           this.breakdown.platformFee + 
                           this.breakdown.serviceFee + 
                           this.breakdown.gstAmount + 
                           this.breakdown.convenienceFee - 
                           this.breakdown.discountAmount - 
                           this.breakdown.couponDiscount;
                           
    if (Math.abs(this.breakdown.totalAmount - calculatedTotal) > 0.01) {
      this.breakdown.totalAmount = calculatedTotal;
    }
  }
  
  next();
});

// Indexes for performance optimization
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ customerId: 1, createdAt: -1 });
PaymentSchema.index({ hostId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ method: 1, status: 1 });
PaymentSchema.index({ 'gateway.razorpayOrderId': 1 });
PaymentSchema.index({ 'gateway.razorpayPaymentId': 1 });
PaymentSchema.index({ 'gatewayResponse.transactionId': 1 });
PaymentSchema.index({ createdAt: -1 });

// Compound indexes for analytics
PaymentSchema.index({ status: 1, method: 1, createdAt: -1 });
PaymentSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
