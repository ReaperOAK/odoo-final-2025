const mongoose = require('mongoose');
const Listing = require('../models/listing.model');
const Reservation = require('../models/reservation.model');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const logger = require('../utils/logger');

class ReservationService {
  /**
   * Create atomic reservation with order and payment
   * This is the core method that ensures data consistency across all related models
   */
  static async createOrderAndReserve(orderData, options = {}) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        logger.info('Starting order and reservation transaction', { 
          customerId: orderData.customerId,
          lineItemsCount: orderData.lineItems.length 
        });
        
        const { customerId, lineItems, paymentMode = 'razorpay', metadata = {} } = orderData;
        
        // Validate input
        if (!customerId || !lineItems || lineItems.length === 0) {
          throw new Error('Invalid order data: customerId and lineItems are required');
        }
        
        const reservations = [];
        const processedLineItems = [];
        let totalAmount = 0;
        let totalDeposit = 0;
        
        // Process each line item
        for (const lineItem of lineItems) {
          const {
            listingId,
            quantity = 1,
            startDate,
            endDate,
            unitPrice,
            customUnitPrice // Allow override for special pricing
          } = lineItem;
          
          // Validate line item
          if (!listingId || !startDate || !endDate) {
            throw new Error('Invalid line item: listingId, startDate, and endDate are required');
          }
          
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          if (start >= end) {
            throw new Error('End date must be after start date');
          }
          
          if (start < new Date()) {
            throw new Error('Start date cannot be in the past');
          }
          
          // Get listing with session for consistent read
          const listing = await Listing.findById(listingId).session(session);
          if (!listing) {
            throw new Error(`Listing not found: ${listingId}`);
          }
          
          if (!listing.isAvailable) {
            throw new Error(`Listing is not available: ${listing.title}`);
          }
          
          // Check if listing can accommodate this booking
          if (!listing.canAccommodateBooking(quantity, start, end)) {
            throw new Error(`Listing cannot accommodate booking requirements: ${listing.title}`);
          }
          
          // Check availability using aggregation pipeline for atomic read
          const availabilityCheck = await this.checkAtomicAvailability(
            listingId, start, end, quantity, session
          );
          
          if (!availabilityCheck.available) {
            throw new Error(
              `Not enough items available. Requested: ${quantity}, Available: ${availabilityCheck.availableQuantity} for listing: ${listing.title}`
            );
          }
          
          // Calculate pricing
          const effectiveUnitPrice = customUnitPrice || listing.effectivePrice;
          const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // days
          const subtotal = effectiveUnitPrice * quantity * duration;
          const depositAmount = listing.depositAmount * quantity;
          
          // Create reservation
          const reservation = new Reservation({
            listingId,
            customerId,
            hostId: listing.ownerId,
            quantity,
            startDate: start,
            endDate: end,
            status: 'pending',
            pricing: {
              unitPrice: effectiveUnitPrice,
              totalDays: duration,
              subtotal,
              depositAmount,
              platformFee: subtotal * 0.05, // 5% platform fee
              taxAmount: subtotal * 0.18, // 18% GST
              totalAmount: subtotal + depositAmount,
              hostEarnings: subtotal * 0.95 // 95% to host after commission
            },
            pickup: {
              method: lineItem.pickupMethod || 'self_pickup',
              address: lineItem.pickupAddress || listing.location.address,
              instructions: lineItem.pickupInstructions || listing.policies.pickupInstructions
            },
            return: {
              method: lineItem.returnMethod || 'self_return',
              address: lineItem.returnAddress || listing.location.address,
              instructions: lineItem.returnInstructions || listing.policies.returnInstructions
            }
          });
          
          await reservation.save({ session });
          reservations.push(reservation);
          
          // Update listing availability
          listing.availableQuantity -= quantity;
          await listing.save({ session });
          
          // Prepare line item for order
          processedLineItems.push({
            listingId,
            reservationId: reservation._id,
            quantity,
            startDate: start,
            endDate: end,
            unitPrice: effectiveUnitPrice,
            duration,
            subtotal,
            depositAmount
          });
          
          totalAmount += reservation.pricing.totalAmount;
          totalDeposit += depositAmount;
          
          logger.info('Reservation created successfully', {
            reservationId: reservation._id,
            listingId,
            quantity,
            startDate: start,
            endDate: end
          });
        }
        
        // Get host ID (assuming all items from same host for now)
        const hostId = reservations[0].hostId;
        
        // Create order
        const order = new Order({
          customerId,
          hostId,
          lineItems: processedLineItems,
          pricing: {
            subtotal: totalAmount - totalDeposit,
            totalDeposit,
            platformFee: totalAmount * 0.05,
            serviceFee: 0,
            taxAmount: totalAmount * 0.18,
            totalAmount,
            platformCommission: totalAmount * 0.05,
            hostEarnings: totalAmount * 0.95,
            pendingAmount: totalAmount
          },
          status: 'draft',
          payment: {
            status: 'pending',
            method: paymentMode,
            currency: 'INR'
          },
          customer: orderData.customer || {},
          host: orderData.host || {},
          metadata: {
            source: 'api',
            ...metadata
          }
        });
        
        await order.save({ session });
        
        // Update reservations with order ID
        await Reservation.updateMany(
          { _id: { $in: reservations.map(r => r._id) } },
          { $set: { orderId: order._id } },
          { session }
        );
        
        logger.info('Order created successfully', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.pricing.totalAmount,
          reservationCount: reservations.length
        });
        
        // Create payment record
        if (paymentMode !== 'cash') {
          const payment = new Payment({
            orderId: order._id,
            customerId,
            hostId,
            amount: totalAmount,
            currency: 'INR',
            method: paymentMode,
            type: 'booking',
            breakdown: {
              subtotal: order.pricing.subtotal,
              platformFee: order.pricing.platformFee,
              serviceFee: order.pricing.serviceFee,
              gstAmount: order.pricing.taxAmount,
              totalAmount: order.pricing.totalAmount
            },
            customer: {
              email: orderData.customer?.email || '',
              phone: orderData.customer?.phone || '',
              name: orderData.customer?.name || ''
            },
            security: {
              ipAddress: metadata.ipAddress || '127.0.0.1',
              userAgent: metadata.userAgent || 'Unknown'
            },
            metadata: {
              source: 'web',
              ...metadata
            }
          });
          
          await payment.save({ session });
          
          // Update order with payment details
          order.payment.razorpayOrderId = payment._id.toString();
          await order.save({ session });
          
          logger.info('Payment record created', {
            paymentId: payment._id,
            orderId: order._id,
            amount: payment.amount
          });
        }
        
        // Return complete order data
        return {
          success: true,
          order: await Order.findById(order._id)
            .populate('customerId', 'name email phone')
            .populate('hostId', 'name email hostProfile')
            .populate('lineItems.listingId', 'title images category location ownerId')
            .populate('lineItems.reservationId')
            .session(session),
          reservations,
          totalAmount,
          message: 'Order and reservations created successfully'
        };
      }, {
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary'
      });
      
      logger.info('Transaction completed successfully');
      
      // The return value from withTransaction is the return value of the callback
      const result = await session.commitTransaction();
      return result;
      
    } catch (error) {
      logger.error('Transaction failed', { 
        error: error.message,
        stack: error.stack,
        orderData: JSON.stringify(orderData)
      });
      
      await session.abortTransaction();
      throw new Error(`Order creation failed: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }
  
  /**
   * Check availability atomically within a transaction
   */
  static async checkAtomicAvailability(listingId, startDate, endDate, quantity = 1, session = null) {
    try {
      const pipeline = [
        {
          $match: {
            listingId: mongoose.Types.ObjectId(listingId),
            status: { $in: ['confirmed', 'picked_up', 'in_progress'] },
            $or: [
              {
                $and: [
                  { startDate: { $lte: startDate } },
                  { endDate: { $gt: startDate } }
                ]
              },
              {
                $and: [
                  { startDate: { $lt: endDate } },
                  { endDate: { $gte: endDate } }
                ]
              },
              {
                $and: [
                  { startDate: { $gte: startDate } },
                  { endDate: { $lte: endDate } }
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
      ];
      
      const reservationQuery = session ? 
        Reservation.aggregate(pipeline).session(session) :
        Reservation.aggregate(pipeline);
        
      const overlappingReservations = await reservationQuery;
      
      const reservedQuantity = overlappingReservations.length > 0 ? 
        overlappingReservations[0].totalReservedQuantity : 0;
      
      // Get listing total quantity
      const listingQuery = session ?
        Listing.findById(listingId).session(session) :
        Listing.findById(listingId);
        
      const listing = await listingQuery;
      
      if (!listing) {
        return {
          available: false,
          availableQuantity: 0,
          requestedQuantity: quantity,
          reservedQuantity: 0,
          error: 'Listing not found'
        };
      }
      
      const availableQuantity = listing.totalQuantity - reservedQuantity;
      
      return {
        available: availableQuantity >= quantity,
        availableQuantity,
        requestedQuantity: quantity,
        reservedQuantity,
        totalQuantity: listing.totalQuantity
      };
      
    } catch (error) {
      logger.error('Availability check failed', {
        error: error.message,
        listingId,
        startDate,
        endDate,
        quantity
      });
      throw error;
    }
  }
  
  /**
   * Extend a reservation (with atomic transaction)
   */
  static async extendReservation(reservationId, newEndDate, userId, reason = '') {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const reservation = await Reservation.findById(reservationId).session(session);
        
        if (!reservation) {
          throw new Error('Reservation not found');
        }
        
        if (!reservation.canModify(userId)) {
          throw new Error('Not authorized to modify this reservation');
        }
        
        if (!['confirmed', 'picked_up', 'in_progress'].includes(reservation.status)) {
          throw new Error('Reservation cannot be extended in current status');
        }
        
        const newEnd = new Date(newEndDate);
        if (newEnd <= reservation.endDate) {
          throw new Error('New end date must be after current end date');
        }
        
        // Check availability for the extended period
        const availabilityCheck = await this.checkAtomicAvailability(
          reservation.listingId,
          reservation.endDate,
          newEnd,
          reservation.quantity,
          session
        );
        
        if (!availabilityCheck.available) {
          throw new Error('Extension period is not available');
        }
        
        // Calculate additional cost
        const listing = await Listing.findById(reservation.listingId).session(session);
        const extraDays = Math.ceil((newEnd - reservation.endDate) / (1000 * 60 * 60 * 24));
        const additionalCost = extraDays * reservation.pricing.unitPrice * reservation.quantity;
        
        // Add extension request
        reservation.requestExtension(newEnd, reason);
        reservation.pricing.totalAmount += additionalCost;
        reservation.endDate = newEnd;
        
        await reservation.save({ session });
        
        // Update order total
        const order = await Order.findById(reservation.orderId).session(session);
        if (order) {
          order.pricing.totalAmount += additionalCost;
          order.pricing.pendingAmount += additionalCost;
          await order.save({ session });
        }
        
        return {
          success: true,
          reservation,
          additionalCost,
          message: 'Reservation extended successfully'
        };
      });
    } catch (error) {
      logger.error('Reservation extension failed', {
        error: error.message,
        reservationId,
        newEndDate,
        userId
      });
      throw error;
    } finally {
      await session.endSession();
    }
  }
  
  /**
   * Cancel a reservation (with refund calculation)
   */
  static async cancelReservation(reservationId, userId, reason = '', adminOverride = false) {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const reservation = await Reservation.findById(reservationId).session(session);
        
        if (!reservation) {
          throw new Error('Reservation not found');
        }
        
        if (!adminOverride && !reservation.canModify(userId)) {
          throw new Error('Not authorized to cancel this reservation');
        }
        
        if (!reservation.canCancel && !adminOverride) {
          throw new Error('Reservation cannot be cancelled in current status');
        }
        
        // Calculate refund based on cancellation policy
        const listing = await Listing.findById(reservation.listingId).session(session);
        const refundAmount = this.calculateCancellationRefund(reservation, listing);
        
        // Update reservation status
        await reservation.updateStatus('cancelled', `Cancelled: ${reason}`);
        
        // Restore listing availability
        listing.availableQuantity += reservation.quantity;
        await listing.save({ session });
        
        // Update order
        const order = await Order.findById(reservation.orderId).session(session);
        if (order) {
          // Check if all reservations are cancelled
          const activeReservations = await Reservation.countDocuments({
            orderId: order._id,
            status: { $nin: ['cancelled', 'completed'] }
          }).session(session);
          
          if (activeReservations === 0) {
            order.status = 'cancelled';
            order.cancellation = {
              reason,
              cancelledBy: 'customer',
              refundAmount
            };
          }
          
          await order.save({ session });
        }
        
        return {
          success: true,
          reservation,
          refundAmount,
          message: 'Reservation cancelled successfully'
        };
      });
    } catch (error) {
      logger.error('Reservation cancellation failed', {
        error: error.message,
        reservationId,
        userId,
        reason
      });
      throw error;
    } finally {
      await session.endSession();
    }
  }
  
  /**
   * Calculate cancellation refund based on policy
   */
  static calculateCancellationRefund(reservation, listing) {
    const now = new Date();
    const hoursUntilStart = (reservation.startDate - now) / (1000 * 60 * 60);
    const totalAmount = reservation.pricing.totalAmount;
    
    // Default cancellation policy logic
    if (hoursUntilStart >= 48) {
      return totalAmount * 0.9; // 90% refund
    } else if (hoursUntilStart >= 24) {
      return totalAmount * 0.5; // 50% refund
    } else {
      return totalAmount * 0.1; // 10% refund
    }
  }
  
  /**
   * Bulk availability check for multiple listings
   */
  static async checkBulkAvailability(requests) {
    try {
      const results = [];
      
      for (const request of requests) {
        const { listingId, startDate, endDate, quantity = 1 } = request;
        
        const availability = await this.checkAtomicAvailability(
          listingId, startDate, endDate, quantity
        );
        
        results.push({
          listingId,
          ...availability
        });
      }
      
      return results;
    } catch (error) {
      logger.error('Bulk availability check failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get reservation conflicts for a date range
   */
  static async getReservationConflicts(listingId, startDate, endDate, excludeReservationId = null) {
    try {
      const conflicts = await Reservation.findConflicts(
        listingId, startDate, endDate, excludeReservationId
      ).populate('customerId', 'name email')
       .populate('orderId', 'orderNumber status');
      
      return conflicts;
    } catch (error) {
      logger.error('Get reservation conflicts failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Generate reservation analytics
   */
  static async getReservationAnalytics(hostId, dateRange = {}) {
    try {
      const matchStage = { hostId: mongoose.Types.ObjectId(hostId) };
      
      if (dateRange.start || dateRange.end) {
        matchStage.createdAt = {};
        if (dateRange.start) matchStage.createdAt.$gte = new Date(dateRange.start);
        if (dateRange.end) matchStage.createdAt.$lte = new Date(dateRange.end);
      }
      
      const analytics = await Reservation.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalReservations: { $sum: 1 },
            totalRevenue: { $sum: '$pricing.hostEarnings' },
            avgReservationValue: { $avg: '$pricing.totalAmount' },
            confirmedReservations: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            },
            completedReservations: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelledReservations: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            avgDuration: { $avg: '$duration' }
          }
        }
      ]);
      
      return analytics[0] || {
        totalReservations: 0,
        totalRevenue: 0,
        avgReservationValue: 0,
        confirmedReservations: 0,
        completedReservations: 0,
        cancelledReservations: 0,
        avgDuration: 0
      };
    } catch (error) {
      logger.error('Reservation analytics failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = ReservationService;
