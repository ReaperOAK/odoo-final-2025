const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Reservation = require('../models/reservation.model');
const logger = require('../utils/logger');

class RazorpayService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    this.paymentMode = process.env.PAYMENT_MODE || 'razorpay'; // 'razorpay' or 'mock'
    
    // Initialize Razorpay SDK only if in real mode
    if (this.paymentMode === 'razorpay' && this.keyId && this.keySecret) {
      try {
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret
        });
        logger.info('Razorpay SDK initialized successfully');
      } catch (error) {
        logger.warn('Razorpay SDK not available, using mock mode', { error: error.message });
        this.paymentMode = 'mock';
      }
    } else {
      this.paymentMode = 'mock';
      logger.info('Using mock payment mode');
    }
  }
  
  /**
   * Create Razorpay order for payment
   */
  async createOrder(orderData) {
    try {
      const { orderId, amount, currency = 'INR', receipt, notes = {} } = orderData;
      
      if (this.paymentMode === 'mock') {
        return this.createMockOrder(orderData);
      }
      
      if (!this.razorpay) {
        throw new Error('Razorpay not initialized');
      }
      
      const razorpayOrderData = {
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt: receipt || `order_${orderId}`,
        notes: {
          order_id: orderId,
          platform: 'rental_marketplace',
          ...notes
        },
        payment_capture: 1 // Auto-capture payment
      };
      
      const razorpayOrder = await this.razorpay.orders.create(razorpayOrderData);
      
      logger.info('Razorpay order created successfully', {
        razorpayOrderId: razorpayOrder.id,
        orderId,
        amount,
        currency
      });
      
      // Update order with Razorpay order ID
      await Order.findByIdAndUpdate(orderId, {
        'payment.razorpayOrderId': razorpayOrder.id,
        'payment.status': 'pending',
        'payment.initiatedAt': new Date()
      });
      
      return {
        success: true,
        razorpayOrder,
        gatewayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount / 100, // Convert back to rupees
        currency: razorpayOrder.currency,
        status: razorpayOrder.status
      };
      
    } catch (error) {
      logger.error('Razorpay order creation failed', {
        error: error.message,
        orderData: JSON.stringify(orderData)
      });
      throw new Error(`Payment order creation failed: ${error.message}`);
    }
  }
  
  /**
   * Create mock order for offline demo
   */
  async createMockOrder(orderData) {
    const { orderId, amount, currency = 'INR' } = orderData;
    
    const mockOrderId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Update order with mock payment details
    await Order.findByIdAndUpdate(orderId, {
      'payment.razorpayOrderId': mockOrderId,
      'payment.status': 'pending',
      'payment.method': 'mock',
      'payment.initiatedAt': new Date()
    });
    
    logger.info('Mock payment order created', {
      mockOrderId,
      orderId,
      amount,
      currency
    });
    
    return {
      success: true,
      razorpayOrder: {
        id: mockOrderId,
        amount: amount * 100,
        currency,
        status: 'created'
      },
      gatewayOrderId: mockOrderId,
      amount,
      currency,
      status: 'created',
      isMock: true
    };
  }
  
  /**
   * Verify payment signature
   */
  verifyPaymentSignature(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
      
      if (this.paymentMode === 'mock') {
        return this.verifyMockPayment(paymentData);
      }
      
      if (!this.keySecret) {
        throw new Error('Razorpay key secret not configured');
      }
      
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(body.toString())
        .digest('hex');
      
      const isValid = expectedSignature === razorpay_signature;
      
      logger.info('Payment signature verification', {
        razorpay_payment_id,
        razorpay_order_id,
        isValid
      });
      
      return {
        isValid,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      };
      
    } catch (error) {
      logger.error('Payment signature verification failed', {
        error: error.message,
        paymentData: JSON.stringify(paymentData)
      });
      return {
        isValid: false,
        error: error.message
      };
    }
  }
  
  /**
   * Verify mock payment (always returns valid for demo)
   */
  verifyMockPayment(paymentData) {
    const { razorpay_order_id, mock_payment_id } = paymentData;
    
    const mockPaymentId = mock_payment_id || `mock_pay_${Date.now()}`;
    
    logger.info('Mock payment verification (always valid)', {
      mockPaymentId,
      razorpay_order_id
    });
    
    return {
      isValid: true,
      paymentId: mockPaymentId,
      orderId: razorpay_order_id,
      isMock: true
    };
  }
  
  /**
   * Process successful payment
   */
  async processSuccessfulPayment(paymentData, orderId) {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const verification = this.verifyPaymentSignature(paymentData);
        
        if (!verification.isValid) {
          throw new Error('Invalid payment signature');
        }
        
        // Get order
        const order = await Order.findById(orderId).session(session);
        if (!order) {
          throw new Error('Order not found');
        }
        
        if (order.payment.status === 'completed') {
          throw new Error('Payment already processed');
        }
        
        // Create payment record
        const payment = new Payment({
          orderId: order._id,
          customerId: order.customerId,
          hostId: order.hostId,
          amount: order.pricing.totalAmount,
          currency: order.payment.currency,
          method: this.paymentMode === 'mock' ? 'mock' : 'razorpay',
          type: 'booking',
          status: 'completed',
          gateway: {
            razorpayOrderId: verification.orderId,
            razorpayPaymentId: verification.paymentId,
            razorpaySignature: paymentData.razorpay_signature
          },
          breakdown: {
            subtotal: order.pricing.subtotal,
            platformFee: order.pricing.platformFee,
            serviceFee: order.pricing.serviceFee,
            gstAmount: order.pricing.taxAmount,
            totalAmount: order.pricing.totalAmount
          },
          customer: order.customer,
          security: {
            ipAddress: paymentData.ipAddress || '127.0.0.1',
            userAgent: paymentData.userAgent || 'Unknown'
          },
          timeline: {
            initiatedAt: order.payment.initiatedAt,
            completedAt: new Date()
          },
          gatewayResponse: {
            raw: paymentData,
            transactionId: verification.paymentId
          }
        });
        
        await payment.save({ session });
        
        // Update order status
        await order.updateStatus('confirmed', 'Payment successful');
        order.payment.status = 'completed';
        order.payment.razorpayPaymentId = verification.paymentId;
        order.payment.completedAt = new Date();
        order.pricing.paidAmount = order.pricing.totalAmount;
        order.pricing.pendingAmount = 0;
        
        await order.save({ session });
        
        // Update all reservations to confirmed status
        await Reservation.updateMany(
          { orderId: order._id },
          { 
            $set: { 
              status: 'confirmed',
              'timeline.confirmedAt': new Date()
            }
          },
          { session }
        );
        
        // Update host wallet balance
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(
          order.hostId,
          { 
            $inc: { 
              walletBalance: order.pricing.hostEarnings,
              totalEarnings: order.pricing.hostEarnings
            }
          },
          { session }
        );
        
        logger.info('Payment processed successfully', {
          paymentId: payment._id,
          orderId: order._id,
          amount: payment.amount,
          method: payment.method
        });
        
        return {
          success: true,
          payment,
          order: await Order.findById(order._id)
            .populate('customerId', 'name email')
            .populate('hostId', 'name email hostProfile')
            .session(session),
          message: 'Payment processed successfully'
        };
      });
    } catch (error) {
      logger.error('Payment processing failed', {
        error: error.message,
        orderId,
        paymentData: JSON.stringify(paymentData)
      });
      throw error;
    } finally {
      await session.endSession();
    }
  }
  
  /**
   * Handle failed payment
   */
  async processFailedPayment(paymentData, orderId, failureReason) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      
      // Create failed payment record
      const payment = new Payment({
        orderId: order._id,
        customerId: order.customerId,
        hostId: order.hostId,
        amount: order.pricing.totalAmount,
        currency: order.payment.currency,
        method: this.paymentMode === 'mock' ? 'mock' : 'razorpay',
        type: 'booking',
        status: 'failed',
        failure: {
          failureReason,
          errorCode: paymentData.error?.code,
          errorDescription: paymentData.error?.description
        },
        timeline: {
          initiatedAt: order.payment.initiatedAt,
          failedAt: new Date()
        },
        gatewayResponse: {
          raw: paymentData
        }
      });
      
      await payment.save();
      
      // Update order status
      order.payment.status = 'failed';
      order.payment.failedAt = new Date();
      order.status = 'cancelled';
      
      await order.save();
      
      // Cancel reservations and restore inventory
      const reservations = await Reservation.find({ orderId: order._id });
      
      for (const reservation of reservations) {
        await reservation.updateStatus('cancelled', `Payment failed: ${failureReason}`);
        
        // Restore listing availability
        const Listing = mongoose.model('Listing');
        await Listing.findByIdAndUpdate(
          reservation.listingId,
          { $inc: { availableQuantity: reservation.quantity } }
        );
      }
      
      logger.info('Failed payment processed', {
        paymentId: payment._id,
        orderId: order._id,
        failureReason
      });
      
      return {
        success: false,
        payment,
        order,
        message: 'Payment failed and order cancelled'
      };
      
    } catch (error) {
      logger.error('Failed payment processing error', {
        error: error.message,
        orderId,
        failureReason
      });
      throw error;
    }
  }
  
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body, signature) {
    try {
      if (this.paymentMode === 'mock') {
        return true; // Always valid for mock mode
      }
      
      if (!this.webhookSecret) {
        logger.warn('Webhook secret not configured');
        return false;
      }
      
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');
      
      return expectedSignature === signature;
    } catch (error) {
      logger.error('Webhook signature verification failed', { error: error.message });
      return false;
    }
  }
  
  /**
   * Handle webhook events
   */
  async handleWebhook(payload, signature) {
    try {
      if (!this.verifyWebhookSignature(JSON.stringify(payload), signature)) {
        throw new Error('Invalid webhook signature');
      }
      
      const { event, payload: eventPayload } = payload;
      
      logger.info('Processing webhook event', { event, paymentId: eventPayload.payment?.entity?.id });
      
      switch (event) {
        case 'payment.captured':
          return await this.handlePaymentCaptured(eventPayload);
          
        case 'payment.failed':
          return await this.handlePaymentFailed(eventPayload);
          
        case 'order.paid':
          return await this.handleOrderPaid(eventPayload);
          
        default:
          logger.info('Unhandled webhook event', { event });
          return { success: true, message: 'Event ignored' };
      }
      
    } catch (error) {
      logger.error('Webhook processing failed', {
        error: error.message,
        payload: JSON.stringify(payload)
      });
      throw error;
    }
  }
  
  /**
   * Handle payment captured webhook
   */
  async handlePaymentCaptured(payload) {
    const payment = payload.payment.entity;
    const orderId = payment.notes?.order_id;
    
    if (!orderId) {
      throw new Error('Order ID not found in payment notes');
    }
    
    return await this.processSuccessfulPayment({
      razorpay_order_id: payment.order_id,
      razorpay_payment_id: payment.id,
      razorpay_signature: 'webhook_verified'
    }, orderId);
  }
  
  /**
   * Handle payment failed webhook
   */
  async handlePaymentFailed(payload) {
    const payment = payload.payment.entity;
    const orderId = payment.notes?.order_id;
    
    if (!orderId) {
      throw new Error('Order ID not found in payment notes');
    }
    
    return await this.processFailedPayment(
      { error: payment.error_description },
      orderId,
      payment.error_description || 'Payment failed'
    );
  }
  
  /**
   * Handle order paid webhook
   */
  async handleOrderPaid(payload) {
    // Similar to payment captured, but for order-level events
    return await this.handlePaymentCaptured(payload);
  }
  
  /**
   * Create refund
   */
  async createRefund(paymentId, amount, reason = 'Requested by customer') {
    try {
      if (this.paymentMode === 'mock') {
        return this.createMockRefund(paymentId, amount, reason);
      }
      
      if (!this.razorpay) {
        throw new Error('Razorpay not initialized');
      }
      
      const refundData = {
        amount: Math.round(amount * 100), // Convert to paise
        notes: {
          reason,
          refund_type: 'customer_request'
        }
      };
      
      const refund = await this.razorpay.payments.refund(paymentId, refundData);
      
      logger.info('Refund created successfully', {
        refundId: refund.id,
        paymentId,
        amount,
        reason
      });
      
      // Update payment record
      await Payment.findOneAndUpdate(
        { 'gateway.razorpayPaymentId': paymentId },
        {
          'refund.refundId': refund.id,
          'refund.refundAmount': amount,
          'refund.refundReason': reason,
          'refund.refundStatus': 'processing',
          'refund.refundInitiatedAt': new Date()
        }
      );
      
      return {
        success: true,
        refund,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      };
      
    } catch (error) {
      logger.error('Refund creation failed', {
        error: error.message,
        paymentId,
        amount,
        reason
      });
      throw error;
    }
  }
  
  /**
   * Create mock refund for demo
   */
  async createMockRefund(paymentId, amount, reason) {
    const mockRefundId = `mock_rfnd_${Date.now()}`;
    
    // Update payment record
    await Payment.findOneAndUpdate(
      { 'gateway.razorpayPaymentId': paymentId },
      {
        'refund.refundId': mockRefundId,
        'refund.refundAmount': amount,
        'refund.refundReason': reason,
        'refund.refundStatus': 'completed',
        'refund.refundInitiatedAt': new Date(),
        'refund.refundCompletedAt': new Date()
      }
    );
    
    logger.info('Mock refund created', {
      mockRefundId,
      paymentId,
      amount,
      reason
    });
    
    return {
      success: true,
      refund: {
        id: mockRefundId,
        amount: amount * 100,
        status: 'processed'
      },
      refundId: mockRefundId,
      amount,
      status: 'processed',
      isMock: true
    };
  }
  
  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      if (this.paymentMode === 'mock') {
        return {
          id: paymentId,
          amount: 100000, // Mock amount in paise
          status: 'captured',
          method: 'mock',
          isMock: true
        };
      }
      
      if (!this.razorpay) {
        throw new Error('Razorpay not initialized');
      }
      
      const payment = await this.razorpay.payments.fetch(paymentId);
      
      return {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        createdAt: new Date(payment.created_at * 1000)
      };
      
    } catch (error) {
      logger.error('Get payment details failed', {
        error: error.message,
        paymentId
      });
      throw error;
    }
  }
  
  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(dateRange = {}) {
    try {
      const matchStage = {};
      
      if (dateRange.start || dateRange.end) {
        matchStage.createdAt = {};
        if (dateRange.start) matchStage.createdAt.$gte = new Date(dateRange.start);
        if (dateRange.end) matchStage.createdAt.$lte = new Date(dateRange.end);
      }
      
      const analytics = await Payment.aggregate([
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
            refundedAmount: {
              $sum: { $cond: [{ $ne: ['$refund.refundAmount', null] }, '$refund.refundAmount', 0] }
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
      
      return analytics[0] || {
        totalPayments: 0,
        totalAmount: 0,
        avgAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        refundedAmount: 0,
        successRate: 0
      };
      
    } catch (error) {
      logger.error('Payment analytics failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new RazorpayService();
