const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Reservation = require('../models/reservation.model');
const Listing = require('../models/listing.model');
const User = require('../models/user.model');
const ReservationService = require('../services/reservation.service');
const RazorpayService = require('../services/razorpay.service');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Order Controller for P2P Marketplace
 * Handles order creation, payment processing, and order management
 */
class OrderController {
  /**
   * Create a new order with reservations
   */
  static async createOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }
      
      const userId = req.user.id;
      const { lineItems, paymentMode = 'razorpay', customer, metadata = {} } = req.body;
      
      if (!lineItems || lineItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one line item is required'
        });
      }
      
      // Validate all line items belong to the same lender (for now)
      const lenderIds = new Set();
      for (const item of lineItems) {
        const listing = await Listing.findById(item.listingId);
        if (!listing) {
          return res.status(400).json({
            success: false,
            message: `Listing not found: ${item.listingId}`
          });
        }
        lenderIds.add(listing.ownerId.toString());
      }
      
      if (lenderIds.size > 1) {
        return res.status(400).json({
          success: false,
          message: 'Currently, orders can only contain items from a single lender'
        });
      }
      
      // Get customer and lender details
      const customerUser = await User.findById(userId);
      const lenderId = Array.from(lenderIds)[0];
      const lenderUser = await User.findById(lenderId);
      
      const orderData = {
        customerId: userId,
        lenderId,
        lineItems,
        paymentMode,
        customer: {
          name: customer?.name || customerUser.name,
          email: customer?.email || customerUser.email,
          phone: customer?.phone || '',
          ...customer
        },
        lender: {
          name: lenderUser.name,
          email: lenderUser.email,
          phone: lenderUser.profile?.phone || '',
          businessName: lenderUser.profile?.displayName
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          source: 'web',
          ...metadata
        }
      };
      
      // Create order and reservations atomically
      const result = await ReservationService.createOrderAndReserve(orderData);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Order creation failed'
        });
      }
      
      const { order, reservations, totalAmount } = result;
      
      // Create payment order if not cash payment
      let paymentOrder = null;
      if (paymentMode !== 'cash') {
        try {
          paymentOrder = await RazorpayService.createOrder({
            orderId: order._id,
            amount: totalAmount,
            currency: 'INR',
            receipt: order.orderNumber,
            notes: {
              customer_id: userId,
              lender_id: lenderId,
              order_number: order.orderNumber
            }
          });
        } catch (paymentError) {
          logger.error('Payment order creation failed', {
            orderId: order._id,
            error: paymentError.message
          });
          
          // Don't fail the entire order, user can retry payment
          paymentOrder = {
            success: false,
            error: paymentError.message
          };
        }
      }
      
      logger.info('Order created successfully', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerId: userId,
        lenderId,
        totalAmount,
        reservationCount: reservations.length
      });
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order,
          reservations,
          paymentOrder: paymentOrder?.success ? paymentOrder : null,
          nextStep: paymentMode === 'cash' ? 'confirmation' : 'payment'
        }
      });
      
    } catch (error) {
      logger.error('Order creation failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        body: JSON.stringify(req.body)
      });
      
      // Enhanced error details for debugging
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      const errorDetails = {
        success: false,
        message: 'Failed to create order',
        error: isDevelopment ? (error.message || error.toString()) : 'Internal server error'
      };
      
      // Add additional debug info in development
      if (isDevelopment) {
        errorDetails.debug = {
          nodeEnv: process.env.NODE_ENV,
          errorType: error.constructor.name,
          errorStack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
          timestamp: new Date().toISOString()
        };
      }
      
      res.status(500).json(errorDetails);
    }
  }
  
  /**
   * Process payment for an order
   */
  static async processPayment(req, res) {
    try {
      const { id } = req.params;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, mock_payment_id } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID'
        });
      }
      
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      // Verify user owns this order
      if (order.customerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to process payment for this order'
        });
      }
      
      if (order.payment.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Payment already completed for this order'
        });
      }
      
      // Process payment
      const paymentData = {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        mock_payment_id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      const result = await RazorpayService.processSuccessfulPayment(paymentData, id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Payment processing failed'
        });
      }
      
      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          order: result.order,
          payment: result.payment,
          reservations: await Reservation.find({ orderId: id })
        }
      });
      
    } catch (error) {
      logger.error('Payment processing failed', {
        error: error.message,
        orderId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get order by ID
   */
  static async getOrderById(req, res) {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID'
        });
      }
      
      const order = await Order.findById(id)
        .populate('customerId', 'name email phone')
        .populate('lenderId', 'name email profile')
        .populate('lineItems.listingId', 'title images category location ownerId')
        .populate('lineItems.reservationId');
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      // Check authorization
      const userId = req.user.id;
      const userRole = req.user.role;
      const isOwner = order.customerId._id.toString() === userId;
      const isHost = order.hostId._id.toString() === userId;
      const isAdmin = userRole === 'admin';
      
      if (!isOwner && !isHost && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this order'
        });
      }
      
      res.json({
        success: true,
        data: order
      });
      
    } catch (error) {
      logger.error('Get order by ID failed', {
        error: error.message,
        orderId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get orders for current user
   */
  static async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status, type = 'all' } = req.query;
      
      const skip = (page - 1) * limit;
      let query = {};
      
      // Determine query based on user type
      switch (type) {
        case 'customer':
          query.customerId = mongoose.Types.ObjectId(userId);
          break;
        case 'host':
          query.hostId = mongoose.Types.ObjectId(userId);
          break;
        default:
          query.$or = [
            { customerId: mongoose.Types.ObjectId(userId) },
            { hostId: mongoose.Types.ObjectId(userId) }
          ];
      }
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      const [orders, totalCount] = await Promise.all([
        Order.find(query)
          .populate('customerId', 'name email')
          .populate('hostId', 'name email hostProfile.displayName')
          .populate('lineItems.listingId', 'title images category')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Order.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalOrders: totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
      
    } catch (error) {
      logger.error('Get user orders failed', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Update order status (host/admin only)
   */
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes = '' } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID'
        });
      }
      
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      // Check authorization
      const userId = req.user.id;
      const userRole = req.user.role;
      const isHost = order.hostId.toString() === userId;
      const isAdmin = userRole === 'admin';
      
      if (!isHost && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this order'
        });
      }
      
      // Validate status transition
      const validTransitions = {
        'confirmed': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'disputed'],
        'completed': ['disputed'],
        'cancelled': [],
        'disputed': ['completed', 'cancelled']
      };
      
      if (!validTransitions[order.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${order.status} to ${status}`
        });
      }
      
      // Update order status
      await order.updateStatus(status, notes);
      
      // Update related reservations
      if (status === 'in_progress') {
        await Reservation.updateMany(
          { orderId: order._id },
          { 
            $set: { 
              status: 'picked_up',
              'timeline.pickedUpAt': new Date()
            }
          }
        );
      } else if (status === 'completed') {
        await Reservation.updateMany(
          { orderId: order._id },
          { 
            $set: { 
              status: 'completed',
              'timeline.returnedAt': new Date(),
              'timeline.completedAt': new Date()
            }
          }
        );
      }
      
      logger.info('Order status updated', {
        orderId: id,
        oldStatus: order.status,
        newStatus: status,
        updatedBy: userId
      });
      
      res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: await Order.findById(id)
          .populate('customerId', 'name email')
          .populate('hostId', 'name email hostProfile')
      });
      
    } catch (error) {
      logger.error('Update order status failed', {
        error: error.message,
        orderId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Cancel order
   */
  static async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason = 'Cancelled by customer' } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID'
        });
      }
      
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      // Check authorization
      const userId = req.user.id;
      const userRole = req.user.role;
      const isCustomer = order.customerId.toString() === userId;
      const isHost = order.hostId.toString() === userId;
      const isAdmin = userRole === 'admin';
      
      if (!isCustomer && !isHost && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this order'
        });
      }
      
      if (!order.canCancel) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be cancelled in current status'
        });
      }
      
      // Calculate cancellation charges and refund
      const cancellationCharges = this.calculateCancellationCharges(order);
      const refundAmount = order.pricing.paidAmount - cancellationCharges;
      
      // Update order
      order.status = 'cancelled';
      order.cancellation = {
        reason,
        cancelledBy: isCustomer ? 'customer' : (isHost ? 'host' : 'admin'),
        cancellationFee: cancellationCharges,
        refundAmount
      };
      
      await order.save();
      
      // Cancel all reservations
      const reservations = await Reservation.find({ orderId: id });
      
      for (const reservation of reservations) {
        await ReservationService.cancelReservation(
          reservation._id,
          userId,
          reason,
          isAdmin
        );
      }
      
      // Process refund if applicable
      if (refundAmount > 0 && order.payment.status === 'completed') {
        try {
          await RazorpayService.createRefund(
            order.payment.razorpayPaymentId,
            refundAmount,
            reason
          );
        } catch (refundError) {
          logger.error('Refund processing failed', {
            orderId: id,
            refundAmount,
            error: refundError.message
          });
        }
      }
      
      logger.info('Order cancelled successfully', {
        orderId: id,
        reason,
        cancelledBy: order.cancellation.cancelledBy,
        refundAmount
      });
      
      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: {
          order,
          cancellationCharges,
          refundAmount
        }
      });
      
    } catch (error) {
      logger.error('Cancel order failed', {
        error: error.message,
        orderId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to cancel order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Add review to order
   */
  static async addReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, review } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID'
        });
      }
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      if (!order.canReview(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to review this order or order not completed'
        });
      }
      
      await order.addReview(req.user.id, rating, review);
      
      // Update host rating if customer reviewed
      if (order.customerId.toString() === req.user.id) {
        const host = await User.findById(order.hostId);
        if (host) {
          await host.updateHostRating(rating);
        }
        
        // Update listing ratings
        for (const lineItem of order.lineItems) {
          const listing = await Listing.findById(lineItem.listingId);
          if (listing) {
            await listing.updateRating(rating);
          }
        }
      }
      
      logger.info('Review added successfully', {
        orderId: id,
        reviewerId: req.user.id,
        rating
      });
      
      res.json({
        success: true,
        message: 'Review added successfully',
        data: order
      });
      
    } catch (error) {
      logger.error('Add review failed', {
        error: error.message,
        orderId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to add review',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get order statistics
   */
  static async getOrderStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = '30' } = req.query; // days
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      
      const stats = await Order.getOrderStats(userId, {
        start: startDate,
        end: new Date()
      });
      
      res.json({
        success: true,
        data: stats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0,
          completedOrders: 0,
          cancelledOrders: 0
        }
      });
      
    } catch (error) {
      logger.error('Get order stats failed', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Calculate cancellation charges based on policy
   */
  static calculateCancellationCharges(order) {
    const now = new Date();
    const orderDate = order.createdAt;
    const hoursFromBooking = (now - orderDate) / (1000 * 60 * 60);
    
    // Default cancellation policy
    if (hoursFromBooking <= 1) {
      return 0; // Free cancellation within 1 hour
    } else if (hoursFromBooking <= 24) {
      return order.pricing.totalAmount * 0.1; // 10% charge
    } else {
      return order.pricing.totalAmount * 0.25; // 25% charge
    }
  }
}

module.exports = OrderController;
