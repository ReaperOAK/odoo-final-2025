const mongoose = require('mongoose');
const User = require('../models/user.model');
const Listing = require('../models/listing.model');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Payout = require('../models/payout.model');
const Reservation = require('../models/reservation.model');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Admin Controller for P2P Marketplace
 * Provides comprehensive platform management and analytics
 */
class AdminController {
  /**
   * Get platform overview dashboard
   */
  static async getPlatformOverview(req, res) {
    try {
      const { period = '30' } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      const endDate = new Date();
      
      const [
        userStats,
        listingStats,
        orderStats,
        revenueStats,
        payoutStats,
        disputeStats,
        topHosts,
        topCategories
      ] = await Promise.all([
        // User statistics
        User.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              byRole: [
                { $unwind: '$roles' },
                { $group: { _id: '$roles', count: { $sum: 1 } } }
              ],
              recent: [
                { $match: { createdAt: { $gte: startDate } } },
                { $count: 'count' }
              ],
              verified: [
                { $match: { isVerified: true } },
                { $count: 'count' }
              ]
            }
          }
        ]),
        
        // Listing statistics
        Listing.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              byStatus: [
                { $group: { _id: '$status', count: { $sum: 1 } } }
              ],
              byCategory: [
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
              ],
              recent: [
                { $match: { createdAt: { $gte: startDate } } },
                { $count: 'count' }
              ]
            }
          }
        ]),
        
        // Order statistics
        Order.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              byStatus: [
                { $group: { _id: '$status', count: { $sum: 1 } } }
              ],
              recent: [
                { $match: { createdAt: { $gte: startDate } } },
                { $count: 'count' }
              ],
              recentValue: [
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: null, totalValue: { $sum: '$pricing.totalAmount' } } }
              ]
            }
          }
        ]),
        
        // Revenue statistics
        Order.aggregate([
          {
            $match: {
              status: { $in: ['confirmed', 'in_progress', 'completed'] },
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$pricing.totalAmount' },
              platformRevenue: { $sum: '$pricing.platformFee' },
              hostRevenue: {
                $sum: { $subtract: ['$pricing.totalAmount', '$pricing.platformFee'] }
              },
              avgOrderValue: { $avg: '$pricing.totalAmount' },
              orderCount: { $sum: 1 }
            }
          }
        ]),
        
        // Payout statistics
        Payout.aggregate([
          {
            $facet: {
              byStatus: [
                { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
              ],
              recent: [
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
              ]
            }
          }
        ]),
        
        // Dispute statistics
        Order.aggregate([
          {
            $match: { status: 'disputed' }
          },
          {
            $facet: {
              total: [{ $count: 'count' }],
              recent: [
                { $match: { updatedAt: { $gte: startDate } } },
                { $count: 'count' }
              ]
            }
          }
        ]),
        
        // Top hosts by revenue
        Order.aggregate([
          {
            $match: {
              status: { $in: ['confirmed', 'in_progress', 'completed'] },
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$hostId',
              totalRevenue: { $sum: '$pricing.totalAmount' },
              orderCount: { $sum: 1 },
              avgOrderValue: { $avg: '$pricing.totalAmount' }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'host'
            }
          },
          { $unwind: '$host' },
          {
            $project: {
              name: '$host.name',
              email: '$host.email',
              businessName: '$host.hostProfile.displayName',
              totalRevenue: 1,
              orderCount: 1,
              avgOrderValue: 1
            }
          },
          { $sort: { totalRevenue: -1 } },
          { $limit: 10 }
        ]),
        
        // Top categories by performance
        Order.aggregate([
          {
            $match: {
              status: { $in: ['confirmed', 'in_progress', 'completed'] },
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          { $unwind: '$lineItems' },
          {
            $lookup: {
              from: 'listings',
              localField: 'lineItems.listingId',
              foreignField: '_id',
              as: 'listing'
            }
          },
          { $unwind: '$listing' },
          {
            $group: {
              _id: '$listing.category',
              totalRevenue: { $sum: '$lineItems.totalPrice' },
              orderCount: { $sum: 1 },
              avgOrderValue: { $avg: '$lineItems.totalPrice' }
            }
          },
          { $sort: { totalRevenue: -1 } },
          { $limit: 10 }
        ])
      ]);
      
      // Format response
      const formatStats = (stats) => {
        return {
          total: stats.total[0]?.count || 0,
          byRole: stats.byRole || [],
          byStatus: stats.byStatus || [],
          byCategory: stats.byCategory || [],
          recent: stats.recent[0]?.count || 0,
          verified: stats.verified?.[0]?.count || 0,
          recentValue: stats.recentValue?.[0]?.totalValue || 0
        };
      };
      
      const overview = {
        users: formatStats(userStats[0]),
        listings: formatStats(listingStats[0]),
        orders: formatStats(orderStats[0]),
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          platformRevenue: 0,
          hostRevenue: 0,
          avgOrderValue: 0,
          orderCount: 0
        },
        payouts: {
          byStatus: payoutStats[0].byStatus || [],
          recent: payoutStats[0].recent[0] || { count: 0, amount: 0 }
        },
        disputes: {
          total: disputeStats[0].total[0]?.count || 0,
          recent: disputeStats[0].recent[0]?.count || 0
        },
        topHosts,
        topCategories,
        summary: {
          totalUsers: userStats[0].total[0]?.count || 0,
          totalListings: listingStats[0].total[0]?.count || 0,
          totalOrders: orderStats[0].total[0]?.count || 0,
          platformGrowth: {
            newUsers: userStats[0].recent[0]?.count || 0,
            newListings: listingStats[0].recent[0]?.count || 0,
            newOrders: orderStats[0].recent[0]?.count || 0
          }
        }
      };
      
      logger.info('Platform overview generated', {
        adminId: req.user.id,
        period,
        totalUsers: overview.summary.totalUsers,
        totalOrders: overview.summary.totalOrders
      });
      
      res.json({
        success: true,
        data: overview
      });
      
    } catch (error) {
      logger.error('Get platform overview failed', {
        error: error.message,
        stack: error.stack,
        adminId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch platform overview',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get all users with filtering and search
   */
  static async getUsers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        role, 
        status, 
        search, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = req.query;
      
      const skip = (page - 1) * limit;
      let query = {};
      
      // Apply filters
      if (role && role !== 'all') {
        query.roles = role;
      }
      
      if (status === 'verified') {
        query.isVerified = true;
      } else if (status === 'unverified') {
        query.isVerified = false;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'hostProfile.displayName': { $regex: search, $options: 'i' } }
        ];
      }
      
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const [users, totalCount] = await Promise.all([
        User.find(query)
          .select('-password -resetPasswordToken -emailVerificationToken')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        User.countDocuments(query)
      ]);
      
      // Get additional stats for each user
      for (const user of users) {
        if (user.roles.includes('host')) {
          const hostStats = await Order.aggregate([
            { $match: { hostId: user._id } },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$pricing.totalAmount' },
                completedOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                }
              }
            }
          ]);
          
          user.hostStats = hostStats[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            completedOrders: 0
          };
        }
        
        if (user.roles.includes('customer')) {
          const customerStats = await Order.aggregate([
            { $match: { customerId: user._id } },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$pricing.totalAmount' }
              }
            }
          ]);
          
          user.customerStats = customerStats[0] || {
            totalOrders: 0,
            totalSpent: 0
          };
        }
      }
      
      const totalPages = Math.ceil(totalCount / limit);
      
      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalUsers: totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
      
    } catch (error) {
      logger.error('Get users failed', {
        error: error.message,
        adminId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Update user status/verification
   */
  static async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { action, reason = '' } = req.body; // verify, suspend, activate, promote_to_host
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      let updateData = {};
      let message = '';
      
      switch (action) {
        case 'verify':
          updateData.isVerified = true;
          updateData.emailVerifiedAt = new Date();
          message = 'User verified successfully';
          break;
          
        case 'suspend':
          updateData.status = 'suspended';
          updateData.suspendedAt = new Date();
          updateData.suspensionReason = reason;
          message = 'User suspended successfully';
          break;
          
        case 'activate':
          updateData.status = 'active';
          updateData.$unset = { suspendedAt: 1, suspensionReason: 1 };
          message = 'User activated successfully';
          break;
          
        case 'promote_to_host':
          if (!user.roles.includes('host')) {
            updateData.$addToSet = { roles: 'host' };
            updateData.hostProfile = {
              displayName: user.name,
              bio: '',
              location: {
                city: '',
                state: '',
                country: 'India'
              },
              verification: {
                status: 'pending',
                documents: [],
                verifiedAt: null
              },
              settings: {
                autoApprove: false,
                instantBooking: false,
                minBookingHours: 24
              },
              walletBalance: 0,
              totalEarnings: 0,
              rating: {
                average: 0,
                count: 0
              }
            };
          }
          message = 'User promoted to host successfully';
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action'
          });
      }
      
      await User.findByIdAndUpdate(id, updateData);
      
      logger.info('User status updated by admin', {
        adminId: req.user.id,
        userId: id,
        action,
        reason
      });
      
      res.json({
        success: true,
        message,
        data: await User.findById(id).select('-password -resetPasswordToken -emailVerificationToken')
      });
      
    } catch (error) {
      logger.error('Update user status failed', {
        error: error.message,
        userId: req.params.id,
        adminId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get all listings with admin controls
   */
  static async getListings(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        category, 
        search,
        hostId,
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = req.query;
      
      const skip = (page - 1) * limit;
      let query = {};
      
      // Apply filters
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (category && category !== 'all') {
        query.category = category;
      }
      
      if (hostId) {
        if (!mongoose.Types.ObjectId.isValid(hostId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid host ID'
          });
        }
        query.ownerId = mongoose.Types.ObjectId(hostId);
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const [listings, totalCount] = await Promise.all([
        Listing.find(query)
          .populate('ownerId', 'name email hostProfile.displayName')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Listing.countDocuments(query)
      ]);
      
      // Add booking stats for each listing
      for (const listing of listings) {
        const bookingStats = await Order.aggregate([
          { $unwind: '$lineItems' },
          { $match: { 'lineItems.listingId': listing._id } },
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              totalRevenue: { $sum: '$lineItems.totalPrice' }
            }
          }
        ]);
        
        listing.bookingStats = bookingStats[0] || {
          totalBookings: 0,
          totalRevenue: 0
        };
      }
      
      const totalPages = Math.ceil(totalCount / limit);
      
      res.json({
        success: true,
        data: {
          listings,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalListings: totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
      
    } catch (error) {
      logger.error('Get listings failed', {
        error: error.message,
        adminId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch listings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Update listing status (approve, reject, suspend)
   */
  static async updateListingStatus(req, res) {
    try {
      const { id } = req.params;
      const { action, reason = '' } = req.body; // approve, reject, suspend, activate
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid listing ID'
        });
      }
      
      const listing = await Listing.findById(id);
      
      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Listing not found'
        });
      }
      
      let updateData = {};
      let message = '';
      
      switch (action) {
        case 'approve':
          updateData.status = 'active';
          updateData.approvedBy = req.user.id;
          updateData.approvedAt = new Date();
          message = 'Listing approved successfully';
          break;
          
        case 'reject':
          updateData.status = 'rejected';
          updateData.rejectedBy = req.user.id;
          updateData.rejectedAt = new Date();
          updateData.rejectionReason = reason;
          message = 'Listing rejected successfully';
          break;
          
        case 'suspend':
          updateData.status = 'suspended';
          updateData.suspendedBy = req.user.id;
          updateData.suspendedAt = new Date();
          updateData.suspensionReason = reason;
          message = 'Listing suspended successfully';
          break;
          
        case 'activate':
          updateData.status = 'active';
          updateData.$unset = { 
            suspendedBy: 1, 
            suspendedAt: 1, 
            suspensionReason: 1,
            rejectedBy: 1,
            rejectedAt: 1,
            rejectionReason: 1
          };
          message = 'Listing activated successfully';
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action'
          });
      }
      
      await Listing.findByIdAndUpdate(id, updateData);
      
      logger.info('Listing status updated by admin', {
        adminId: req.user.id,
        listingId: id,
        action,
        reason
      });
      
      res.json({
        success: true,
        message,
        data: await Listing.findById(id).populate('ownerId', 'name email')
      });
      
    } catch (error) {
      logger.error('Update listing status failed', {
        error: error.message,
        listingId: req.params.id,
        adminId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update listing status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get platform analytics
   */
  static async getAnalytics(req, res) {
    try {
      const { period = '30', groupBy = 'day' } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      
      // Determine grouping format
      let groupFormat;
      switch (groupBy) {
        case 'hour':
          groupFormat = '%Y-%m-%d-%H';
          break;
        case 'day':
          groupFormat = '%Y-%m-%d';
          break;
        case 'week':
          groupFormat = '%Y-w%U';
          break;
        case 'month':
          groupFormat = '%Y-%m';
          break;
        default:
          groupFormat = '%Y-%m-%d';
      }
      
      const [
        revenueTimeline,
        userGrowth,
        listingGrowth,
        orderGrowth,
        categoryPerformance,
        geographicDistribution
      ] = await Promise.all([
        // Revenue timeline
        Order.aggregate([
          {
            $match: {
              status: { $in: ['confirmed', 'in_progress', 'completed'] },
              createdAt: { $gte: startDate, $lte: new Date() }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
              totalRevenue: { $sum: '$pricing.totalAmount' },
              platformRevenue: { $sum: '$pricing.platformFee' },
              orderCount: { $sum: 1 },
              avgOrderValue: { $avg: '$pricing.totalAmount' }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        
        // User growth
        User.aggregate([
          {
            $match: { createdAt: { $gte: startDate, $lte: new Date() } }
          },
          {
            $group: {
              _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
              newUsers: { $sum: 1 },
              newHosts: {
                $sum: { $cond: [{ $in: ['host', '$roles'] }, 1, 0] }
              },
              newCustomers: {
                $sum: { $cond: [{ $in: ['customer', '$roles'] }, 1, 0] }
              }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        
        // Listing growth
        Listing.aggregate([
          {
            $match: { createdAt: { $gte: startDate, $lte: new Date() } }
          },
          {
            $group: {
              _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
              newListings: { $sum: 1 },
              approvedListings: {
                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
              }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        
        // Order growth
        Order.aggregate([
          {
            $match: { createdAt: { $gte: startDate, $lte: new Date() } }
          },
          {
            $group: {
              _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
              newOrders: { $sum: 1 },
              completedOrders: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              cancelledOrders: {
                $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
              }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        
        // Category performance
        Order.aggregate([
          {
            $match: {
              status: { $in: ['confirmed', 'in_progress', 'completed'] },
              createdAt: { $gte: startDate, $lte: new Date() }
            }
          },
          { $unwind: '$lineItems' },
          {
            $lookup: {
              from: 'listings',
              localField: 'lineItems.listingId',
              foreignField: '_id',
              as: 'listing'
            }
          },
          { $unwind: '$listing' },
          {
            $group: {
              _id: '$listing.category',
              totalRevenue: { $sum: '$lineItems.totalPrice' },
              orderCount: { $sum: 1 },
              avgOrderValue: { $avg: '$lineItems.totalPrice' },
              uniqueListings: { $addToSet: '$lineItems.listingId' }
            }
          },
          {
            $project: {
              totalRevenue: 1,
              orderCount: 1,
              avgOrderValue: 1,
              uniqueListings: { $size: '$uniqueListings' }
            }
          },
          { $sort: { totalRevenue: -1 } }
        ]),
        
        // Geographic distribution
        User.aggregate([
          {
            $match: { 
              roles: 'host',
              'hostProfile.location.city': { $exists: true, $ne: '' }
            }
          },
          {
            $group: {
              _id: {
                city: '$hostProfile.location.city',
                state: '$hostProfile.location.state'
              },
              hostCount: { $sum: 1 }
            }
          },
          { $sort: { hostCount: -1 } },
          { $limit: 20 }
        ])
      ]);
      
      res.json({
        success: true,
        data: {
          revenueTimeline,
          userGrowth,
          listingGrowth,
          orderGrowth,
          categoryPerformance,
          geographicDistribution,
          period: {
            start: startDate,
            end: new Date(),
            groupBy
          }
        }
      });
      
    } catch (error) {
      logger.error('Get analytics failed', {
        error: error.message,
        adminId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = AdminController;
