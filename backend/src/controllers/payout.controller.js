const mongoose = require('mongoose');
const Payout = require('../models/payout.model');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Payout Controller for P2P Marketplace
 * Handles host payouts, bank details, and earnings management
 */
class PayoutController {
  /**
   * Create a payout request
   */
  static async createPayout(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }
      
      const hostId = req.user.id;
      const { amount, orderIds = [], bankDetails } = req.body;
      
      // Verify user is a host
      const host = await User.findById(hostId);
      if (!host || !host.roles.includes('host')) {
        return res.status(403).json({
          success: false,
          message: 'Only hosts can request payouts'
        });
      }
      
      // Validate bank details if provided
      if (bankDetails) {
        const requiredFields = ['accountNumber', 'ifscCode', 'accountHolderName', 'bankName'];
        const missingFields = requiredFields.filter(field => !bankDetails[field]);
        
        if (missingFields.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Missing bank details: ${missingFields.join(', ')}`
          });
        }
      }
      
      // Get eligible orders for payout
      let eligibleOrders;
      if (orderIds.length > 0) {
        eligibleOrders = await Order.find({
          _id: { $in: orderIds },
          hostId,
          status: 'completed',
          'payout.status': { $in: ['pending', null] }
        });
      } else {
        eligibleOrders = await Order.find({
          hostId,
          status: 'completed',
          'payout.status': { $in: ['pending', null] },
          createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // At least 24 hours old
        });
      }
      
      if (eligibleOrders.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No eligible orders found for payout'
        });
      }
      
      // Calculate total earnings
      const totalEarnings = eligibleOrders.reduce((sum, order) => {
        const hostEarnings = order.pricing.totalAmount - order.pricing.platformFee;
        return sum + hostEarnings;
      }, 0);
      
      // Validate requested amount
      if (amount && amount > totalEarnings) {
        return res.status(400).json({
          success: false,
          message: `Requested amount (₹${amount}) exceeds available earnings (₹${totalEarnings})`
        });
      }
      
      const payoutAmount = amount || totalEarnings;
      
      // Create payout request
      const payout = new Payout({
        hostId,
        amount: payoutAmount,
        orderIds: eligibleOrders.map(o => o._id),
        bankDetails: bankDetails || host.hostProfile?.bankDetails,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestedAt: new Date()
        }
      });
      
      await payout.save();
      
      // Update order payout status
      await Order.updateMany(
        { _id: { $in: eligibleOrders.map(o => o._id) } },
        { 
          $set: { 
            'payout.status': 'requested',
            'payout.payoutId': payout._id,
            'payout.requestedAt': new Date()
          }
        }
      );
      
      logger.info('Payout request created', {
        payoutId: payout._id,
        hostId,
        amount: payoutAmount,
        orderCount: eligibleOrders.length
      });
      
      res.status(201).json({
        success: true,
        message: 'Payout request created successfully',
        data: {
          payout,
          eligibleOrders: eligibleOrders.length,
          totalEarnings
        }
      });
      
    } catch (error) {
      logger.error('Create payout failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        body: JSON.stringify(req.body)
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create payout request',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get payouts for host
   */
  static async getHostPayouts(req, res) {
    try {
      const hostId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;
      
      const skip = (page - 1) * limit;
      let query = { hostId: mongoose.Types.ObjectId(hostId) };
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      const [payouts, totalCount] = await Promise.all([
        Payout.find(query)
          .populate('orderIds', 'orderNumber status pricing createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Payout.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      res.json({
        success: true,
        data: {
          payouts,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalPayouts: totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
      
    } catch (error) {
      logger.error('Get host payouts failed', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payouts',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get payout by ID
   */
  static async getPayoutById(req, res) {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payout ID'
        });
      }
      
      const payout = await Payout.findById(id)
        .populate('hostId', 'name email hostProfile')
        .populate('orderIds', 'orderNumber status pricing customer createdAt')
        .populate('approvedBy', 'name email');
      
      if (!payout) {
        return res.status(404).json({
          success: false,
          message: 'Payout not found'
        });
      }
      
      // Check authorization
      const userId = req.user.id;
      const userRole = req.user.role;
      const isHost = payout.hostId._id.toString() === userId;
      const isAdmin = userRole === 'admin';
      
      if (!isHost && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this payout'
        });
      }
      
      res.json({
        success: true,
        data: payout
      });
      
    } catch (error) {
      logger.error('Get payout by ID failed', {
        error: error.message,
        payoutId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payout',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get all payouts (admin only)
   */
  static async getAllPayouts(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
      
      const { page = 1, limit = 10, status, hostId } = req.query;
      
      const skip = (page - 1) * limit;
      let query = {};
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (hostId) {
        if (!mongoose.Types.ObjectId.isValid(hostId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid host ID'
          });
        }
        query.hostId = mongoose.Types.ObjectId(hostId);
      }
      
      const [payouts, totalCount] = await Promise.all([
        Payout.find(query)
          .populate('hostId', 'name email hostProfile')
          .populate('approvedBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Payout.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      res.json({
        success: true,
        data: {
          payouts,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalPayouts: totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
      
    } catch (error) {
      logger.error('Get all payouts failed', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payouts',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Approve payout (admin only)
   */
  static async approvePayout(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
      
      const { id } = req.params;
      const { notes = '' } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payout ID'
        });
      }
      
      const payout = await Payout.findById(id);
      
      if (!payout) {
        return res.status(404).json({
          success: false,
          message: 'Payout not found'
        });
      }
      
      if (payout.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot approve payout with status: ${payout.status}`
        });
      }
      
      // Update payout status
      payout.status = 'approved';
      payout.approvedBy = req.user.id;
      payout.approvedAt = new Date();
      if (notes) {
        payout.notes = notes;
      }
      
      await payout.save();
      
      // Update related orders
      await Order.updateMany(
        { _id: { $in: payout.orderIds } },
        { 
          $set: { 
            'payout.status': 'approved',
            'payout.approvedAt': new Date(),
            'payout.approvedBy': req.user.id
          }
        }
      );
      
      // Update host wallet balance
      const host = await User.findById(payout.hostId);
      if (host) {
        host.hostProfile.walletBalance += payout.amount;
        await host.save();
      }
      
      logger.info('Payout approved', {
        payoutId: id,
        hostId: payout.hostId,
        amount: payout.amount,
        approvedBy: req.user.id
      });
      
      res.json({
        success: true,
        message: 'Payout approved successfully',
        data: await Payout.findById(id)
          .populate('hostId', 'name email hostProfile')
          .populate('approvedBy', 'name email')
      });
      
    } catch (error) {
      logger.error('Approve payout failed', {
        error: error.message,
        payoutId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to approve payout',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Reject payout (admin only)
   */
  static async rejectPayout(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
      
      const { id } = req.params;
      const { reason = 'Payout rejected' } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payout ID'
        });
      }
      
      const payout = await Payout.findById(id);
      
      if (!payout) {
        return res.status(404).json({
          success: false,
          message: 'Payout not found'
        });
      }
      
      if (payout.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot reject payout with status: ${payout.status}`
        });
      }
      
      // Update payout status
      payout.status = 'rejected';
      payout.rejectedBy = req.user.id;
      payout.rejectedAt = new Date();
      payout.rejectionReason = reason;
      
      await payout.save();
      
      // Reset order payout status
      await Order.updateMany(
        { _id: { $in: payout.orderIds } },
        { 
          $set: { 
            'payout.status': 'pending',
            'payout.payoutId': null
          }
        }
      );
      
      logger.info('Payout rejected', {
        payoutId: id,
        hostId: payout.hostId,
        amount: payout.amount,
        rejectedBy: req.user.id,
        reason
      });
      
      res.json({
        success: true,
        message: 'Payout rejected successfully',
        data: await Payout.findById(id)
          .populate('hostId', 'name email hostProfile')
          .populate('rejectedBy', 'name email')
      });
      
    } catch (error) {
      logger.error('Reject payout failed', {
        error: error.message,
        payoutId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to reject payout',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Mark payout as processed (admin only)
   */
  static async markProcessed(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
      
      const { id } = req.params;
      const { transactionId, notes = '' } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payout ID'
        });
      }
      
      const payout = await Payout.findById(id);
      
      if (!payout) {
        return res.status(404).json({
          success: false,
          message: 'Payout not found'
        });
      }
      
      if (payout.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Only approved payouts can be marked as processed'
        });
      }
      
      // Update payout status
      payout.status = 'processed';
      payout.processedAt = new Date();
      payout.transactionId = transactionId;
      if (notes) {
        payout.notes = notes;
      }
      
      await payout.save();
      
      // Update related orders
      await Order.updateMany(
        { _id: { $in: payout.orderIds } },
        { 
          $set: { 
            'payout.status': 'processed',
            'payout.processedAt': new Date(),
            'payout.transactionId': transactionId
          }
        }
      );
      
      logger.info('Payout marked as processed', {
        payoutId: id,
        hostId: payout.hostId,
        amount: payout.amount,
        transactionId
      });
      
      res.json({
        success: true,
        message: 'Payout marked as processed successfully',
        data: await Payout.findById(id)
          .populate('hostId', 'name email hostProfile')
          .populate('approvedBy', 'name email')
      });
      
    } catch (error) {
      logger.error('Mark payout processed failed', {
        error: error.message,
        payoutId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to mark payout as processed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get payout statistics
   */
  static async getPayoutStats(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { period = '30' } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      
      let matchStage = {
        createdAt: { $gte: startDate, $lte: new Date() }
      };
      
      // Filter by host if not admin
      if (userRole !== 'admin') {
        matchStage.hostId = mongoose.Types.ObjectId(userId);
      }
      
      const stats = await Payout.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalPayouts: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            pendingPayouts: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            approvedPayouts: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            processedPayouts: {
              $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] }
            },
            rejectedPayouts: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            },
            avgPayoutAmount: { $avg: '$amount' }
          }
        }
      ]);
      
      const result = stats[0] || {
        totalPayouts: 0,
        totalAmount: 0,
        pendingPayouts: 0,
        approvedPayouts: 0,
        processedPayouts: 0,
        rejectedPayouts: 0,
        avgPayoutAmount: 0
      };
      
      // Add pending earnings for hosts
      if (userRole !== 'admin') {
        const pendingEarnings = await Order.aggregate([
          {
            $match: {
              hostId: mongoose.Types.ObjectId(userId),
              status: 'completed',
              'payout.status': { $in: ['pending', null] }
            }
          },
          {
            $group: {
              _id: null,
              pendingAmount: {
                $sum: { $subtract: ['$pricing.totalAmount', '$pricing.platformFee'] }
              },
              pendingOrders: { $sum: 1 }
            }
          }
        ]);
        
        result.pendingEarnings = pendingEarnings[0]?.pendingAmount || 0;
        result.pendingOrdersCount = pendingEarnings[0]?.pendingOrders || 0;
      }
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Get payout stats failed', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payout statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Update bank details
   */
  static async updateBankDetails(req, res) {
    try {
      const userId = req.user.id;
      const { accountNumber, ifscCode, accountHolderName, bankName, branchName } = req.body;
      
      if (!accountNumber || !ifscCode || !accountHolderName || !bankName) {
        return res.status(400).json({
          success: false,
          message: 'All bank details are required'
        });
      }
      
      const user = await User.findById(userId);
      
      if (!user || !user.roles.includes('host')) {
        return res.status(403).json({
          success: false,
          message: 'Only hosts can update bank details'
        });
      }
      
      // Update bank details
      user.hostProfile.bankDetails = {
        accountNumber,
        ifscCode,
        accountHolderName,
        bankName,
        branchName: branchName || '',
        verificationStatus: 'pending',
        updatedAt: new Date()
      };
      
      await user.save();
      
      logger.info('Bank details updated', {
        userId,
        bankName,
        ifscCode
      });
      
      res.json({
        success: true,
        message: 'Bank details updated successfully',
        data: {
          bankDetails: user.hostProfile.bankDetails
        }
      });
      
    } catch (error) {
      logger.error('Update bank details failed', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update bank details',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = PayoutController;
