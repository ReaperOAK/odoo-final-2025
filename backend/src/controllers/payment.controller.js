const mongoose = require('mongoose');
const Payment = require('../models/payment.model');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const RazorpayService = require('../services/razorpay.service');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Payment Controller for P2P Marketplace
 * Handles payment processing, webhooks, and refunds
 */
class PaymentController {
  /**
   * Razorpay webhook handler
   */
  static async handleWebhook(req, res) {
    try {
      const webhookSignature = req.get('X-Razorpay-Signature');
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      
      if (!webhookSignature || !webhookSecret) {
        logger.warn('Webhook signature or secret missing');
        return res.status(400).json({
          success: false,
          message: 'Webhook signature missing'
        });
      }
      
      // Verify webhook signature
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');
      
      if (webhookSignature !== expectedSignature) {
        logger.warn('Invalid webhook signature', {
          received: webhookSignature,
          expected: expectedSignature
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid signature'
        });
      }
      
      const { event, payload } = req.body;
      const paymentEntity = payload.payment.entity;
      
      logger.info('Webhook received', {
        event,
        paymentId: paymentEntity.id,
        orderId: paymentEntity.order_id,
        status: paymentEntity.status
      });
      
      switch (event) {
        case 'payment.authorized':
          await this.handlePaymentAuthorized(paymentEntity);
          break;
          
        case 'payment.captured':
          await this.handlePaymentCaptured(paymentEntity);
          break;
          
        case 'payment.failed':
          await this.handlePaymentFailed(paymentEntity);
          break;
          
        case 'refund.created':
          await this.handleRefundCreated(payload.refund.entity);
          break;
          
        case 'refund.processed':
          await this.handleRefundProcessed(payload.refund.entity);
          break;
          
        default:
          logger.info('Unhandled webhook event', { event });
      }
      
      res.status(200).json({ success: true });
      
    } catch (error) {
      logger.error('Webhook processing failed', {
        error: error.message,
        stack: error.stack,
        body: JSON.stringify(req.body)
      });
      
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  }
  
  /**
   * Handle payment authorized webhook
   */
  static async handlePaymentAuthorized(paymentEntity) {
    try {
      const payment = await Payment.findOne({
        razorpayPaymentId: paymentEntity.id
      });
      
      if (payment) {
        payment.status = 'authorized';
        payment.rawResponse = paymentEntity;
        await payment.save();
        
        logger.info('Payment authorized', {
          paymentId: payment._id,
          razorpayPaymentId: paymentEntity.id
        });
      }
    } catch (error) {
      logger.error('Handle payment authorized failed', {
        error: error.message,
        paymentId: paymentEntity.id
      });
    }
  }
  
  /**
   * Handle payment captured webhook
   */
  static async handlePaymentCaptured(paymentEntity) {
    try {
      const payment = await Payment.findOne({
        razorpayPaymentId: paymentEntity.id
      });
      
      if (payment) {
        payment.status = 'completed';
        payment.capturedAmount = paymentEntity.amount / 100; // Convert paise to rupees
        payment.rawResponse = paymentEntity;
        await payment.save();
        
        // Update order status
        const order = await Order.findById(payment.orderId);
        if (order && order.status === 'pending') {
          order.status = 'confirmed';
          order.payment.status = 'completed';
          order.payment.paidAt = new Date();
          await order.save();
        }
        
        logger.info('Payment captured', {
          paymentId: payment._id,
          orderId: payment.orderId,
          amount: payment.capturedAmount
        });
      }
    } catch (error) {
      logger.error('Handle payment captured failed', {
        error: error.message,
        paymentId: paymentEntity.id
      });
    }
  }
  
  /**
   * Handle payment failed webhook
   */
  static async handlePaymentFailed(paymentEntity) {
    try {
      const payment = await Payment.findOne({
        razorpayPaymentId: paymentEntity.id
      });
      
      if (payment) {
        payment.status = 'failed';
        payment.failureReason = paymentEntity.error_description || 'Payment failed';
        payment.rawResponse = paymentEntity;
        await payment.save();
        
        // Update order status
        const order = await Order.findById(payment.orderId);
        if (order) {
          order.payment.status = 'failed';
          order.payment.failureReason = payment.failureReason;
          await order.save();
        }
        
        logger.info('Payment failed', {
          paymentId: payment._id,
          orderId: payment.orderId,
          reason: payment.failureReason
        });
      }
    } catch (error) {
      logger.error('Handle payment failed failed', {
        error: error.message,
        paymentId: paymentEntity.id
      });
    }
  }
  
  /**
   * Handle refund created webhook
   */
  static async handleRefundCreated(refundEntity) {
    try {
      const payment = await Payment.findOne({
        razorpayPaymentId: refundEntity.payment_id
      });
      
      if (payment) {
        payment.refunds.push({
          razorpayRefundId: refundEntity.id,
          amount: refundEntity.amount / 100,
          status: 'created',
          reason: 'Refund initiated',
          processedAt: new Date()
        });
        await payment.save();
        
        logger.info('Refund created', {
          paymentId: payment._id,
          refundId: refundEntity.id,
          amount: refundEntity.amount / 100
        });
      }
    } catch (error) {
      logger.error('Handle refund created failed', {
        error: error.message,
        refundId: refundEntity.id
      });
    }
  }
  
  /**
   * Handle refund processed webhook
   */
  static async handleRefundProcessed(refundEntity) {
    try {
      const payment = await Payment.findOne({
        razorpayPaymentId: refundEntity.payment_id
      });
      
      if (payment) {
        const refund = payment.refunds.find(r => 
          r.razorpayRefundId === refundEntity.id
        );
        
        if (refund) {
          refund.status = 'processed';
          refund.processedAt = new Date();
          await payment.save();
          
          // Update order refund status
          const order = await Order.findById(payment.orderId);
          if (order && order.cancellation) {
            order.cancellation.refundStatus = 'processed';
            order.cancellation.refundProcessedAt = new Date();
            await order.save();
          }
          
          logger.info('Refund processed', {
            paymentId: payment._id,
            refundId: refundEntity.id,
            orderId: payment.orderId
          });
        }
      }
    } catch (error) {
      logger.error('Handle refund processed failed', {
        error: error.message,
        refundId: refundEntity.id
      });
    }
  }
  
  /**
   * Get payment details
   */
  static async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment ID'
        });
      }
      
      const payment = await Payment.findById(id)
        .populate('orderId', 'orderNumber status pricing customer')
        .populate('customerId', 'name email');
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      
      // Check authorization
      const userId = req.user.id;
      const userRole = req.user.role;
      const isCustomer = payment.customerId._id.toString() === userId;
      const isAdmin = userRole === 'admin';
      
      if (!isCustomer && !isAdmin) {
        // Check if user is the host of the order
        const order = await Order.findById(payment.orderId);
        const isHost = order && order.hostId.toString() === userId;
        
        if (!isHost) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view this payment'
          });
        }
      }
      
      res.json({
        success: true,
        data: payment
      });
      
    } catch (error) {
      logger.error('Get payment by ID failed', {
        error: error.message,
        paymentId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get payments for user (customer or host)
   */
  static async getUserPayments(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status, type = 'all' } = req.query;
      
      const skip = (page - 1) * limit;
      let query = {};
      
      if (type === 'customer' || type === 'all') {
        query.customerId = mongoose.Types.ObjectId(userId);
      }
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      // For host payments, we need to find through orders
      let hostPayments = [];
      if (type === 'host' || type === 'all') {
        const hostOrders = await Order.find({ 
          hostId: mongoose.Types.ObjectId(userId) 
        }).select('_id');
        
        const hostOrderIds = hostOrders.map(o => o._id);
        
        if (hostOrderIds.length > 0) {
          let hostQuery = { orderId: { $in: hostOrderIds } };
          if (status && status !== 'all') {
            hostQuery.status = status;
          }
          
          hostPayments = await Payment.find(hostQuery)
            .populate('orderId', 'orderNumber status pricing customer')
            .populate('customerId', 'name email')
            .sort({ createdAt: -1 })
            .lean();
        }
      }
      
      let customerPayments = [];
      if (type === 'customer' || type === 'all') {
        customerPayments = await Payment.find(query)
          .populate('orderId', 'orderNumber status pricing customer')
          .sort({ createdAt: -1 })
          .lean();
      }
      
      // Combine and sort payments
      let allPayments = [...customerPayments, ...hostPayments];
      allPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Apply pagination
      const totalCount = allPayments.length;
      const paginatedPayments = allPayments.slice(skip, skip + parseInt(limit));
      const totalPages = Math.ceil(totalCount / limit);
      
      res.json({
        success: true,
        data: {
          payments: paginatedPayments,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalPayments: totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
      
    } catch (error) {
      logger.error('Get user payments failed', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Create refund for a payment
   */
  static async createRefund(req, res) {
    try {
      const { id } = req.params;
      const { amount, reason = 'Refund requested' } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment ID'
        });
      }
      
      const payment = await Payment.findById(id);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      
      if (payment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Can only refund completed payments'
        });
      }
      
      // Check authorization - only admin or host can create refunds
      const userId = req.user.id;
      const userRole = req.user.role;
      const isAdmin = userRole === 'admin';
      
      let isHost = false;
      if (!isAdmin) {
        const order = await Order.findById(payment.orderId);
        isHost = order && order.hostId.toString() === userId;
      }
      
      if (!isAdmin && !isHost) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create refund'
        });
      }
      
      // Validate refund amount
      const maxRefundAmount = payment.amount - payment.refundedAmount;
      const refundAmount = amount || maxRefundAmount;
      
      if (refundAmount <= 0 || refundAmount > maxRefundAmount) {
        return res.status(400).json({
          success: false,
          message: `Invalid refund amount. Maximum refundable: ₹${maxRefundAmount}`
        });
      }
      
      // Process refund
      const result = await RazorpayService.createRefund(
        payment.razorpayPaymentId,
        refundAmount,
        reason
      );
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Refund creation failed'
        });
      }
      
      res.json({
        success: true,
        message: 'Refund created successfully',
        data: {
          refund: result.refund,
          payment: await Payment.findById(id)
        }
      });
      
    } catch (error) {
      logger.error('Create refund failed', {
        error: error.message,
        paymentId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create refund',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get payment statistics
   */
  static async getPaymentStats(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { period = '30', type = 'all' } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      
      let matchStage = {
        createdAt: { $gte: startDate, $lte: new Date() }
      };
      
      // Build match stage based on user role and type
      if (userRole !== 'admin') {
        if (type === 'customer') {
          matchStage.customerId = mongoose.Types.ObjectId(userId);
        } else if (type === 'host') {
          // Get host orders first
          const hostOrders = await Order.find({ 
            hostId: mongoose.Types.ObjectId(userId) 
          }).select('_id');
          matchStage.orderId = { $in: hostOrders.map(o => o._id) };
        } else {
          // For 'all', get both customer and host payments
          const hostOrders = await Order.find({ 
            hostId: mongoose.Types.ObjectId(userId) 
          }).select('_id');
          
          matchStage.$or = [
            { customerId: mongoose.Types.ObjectId(userId) },
            { orderId: { $in: hostOrders.map(o => o._id) } }
          ];
        }
      }
      
      const stats = await Payment.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalRefunded: { $sum: '$refundedAmount' },
            netAmount: { $sum: { $subtract: ['$amount', '$refundedAmount'] } },
            completedPayments: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failedPayments: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            avgPaymentAmount: { $avg: '$amount' }
          }
        }
      ]);
      
      const result = stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        totalRefunded: 0,
        netAmount: 0,
        completedPayments: 0,
        failedPayments: 0,
        avgPaymentAmount: 0
      };
      
      // Calculate success rate
      result.successRate = result.totalPayments > 0 
        ? (result.completedPayments / result.totalPayments) * 100 
        : 0;
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Get payment stats failed', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Verify payment signature
   */
  static async verifyPayment(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required payment parameters'
        });
      }
      
      const isValid = RazorpayService.verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }
      
      res.json({
        success: true,
        message: 'Payment signature verified successfully'
      });
      
    } catch (error) {
      logger.error('Verify payment failed', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = PaymentController;
