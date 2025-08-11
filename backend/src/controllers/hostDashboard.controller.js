const mongoose = require('mongoose');
const User = require('../models/user.model');
const Listing = require('../models/listing.model');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Payout = require('../models/payout.model');
const Reservation = require('../models/reservation.model');
const logger = require('../utils/logger');

/**
 * Host Dashboard Controller for P2P Marketplace
 * Provides comprehensive analytics and management for hosts
 */
class HostDashboardController {
  /**
   * Get comprehensive dashboard overview for host
   */
  static async getDashboardOverview(req, res) {
    try {
      const hostId = req.user.id;
      const { period = '30' } = req.query; // days
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      const endDate = new Date();
      
      // Get basic counts and stats in parallel
      const [
        totalListings,
        activeListings,
        totalOrders,
        recentOrders,
        earningsStats,
        payoutStats,
        listingPerformance,
        upcomingReservations
      ] = await Promise.all([
        // Total listings count
        Listing.countDocuments({ ownerId: hostId }),
        
        // Active listings count
        Listing.countDocuments({ 
          ownerId: hostId, 
          status: 'active',
          'availability.available': true 
        }),
        
        // Total orders count
        Order.countDocuments({ hostId }),
        
        // Recent orders (last 30 days)
        Order.countDocuments({ 
          hostId, 
          createdAt: { $gte: startDate, $lte: endDate } 
        }),
        
        // Earnings statistics
        Order.aggregate([
          {
            $match: {
              hostId: mongoose.Types.ObjectId(hostId),
              status: { $in: ['confirmed', 'in_progress', 'completed'] },
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$pricing.totalAmount' },
              hostEarnings: { 
                $sum: { $subtract: ['$pricing.totalAmount', '$pricing.platformFee'] }
              },
              platformFees: { $sum: '$pricing.platformFee' },
              avgOrderValue: { $avg: '$pricing.totalAmount' },
              orderCount: { $sum: 1 }
            }
          }
        ]),
        
        // Payout statistics
        Payout.aggregate([
          {
            $match: {
              hostId: mongoose.Types.ObjectId(hostId),
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' }
            }
          }
        ]),
        
        // Top performing listings
        Order.aggregate([
          {
            $match: {
              hostId: mongoose.Types.ObjectId(hostId),
              status: { $in: ['confirmed', 'in_progress', 'completed'] },
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          { $unwind: '$lineItems' },
          {
            $group: {
              _id: '$lineItems.listingId',
              orderCount: { $sum: 1 },
              totalRevenue: { $sum: '$lineItems.totalPrice' },
              avgRating: { $avg: '$reviews.rating' }
            }
          },
          {
            $lookup: {
              from: 'listings',
              localField: '_id',
              foreignField: '_id',
              as: 'listing'
            }
          },
          { $unwind: '$listing' },
          {
            $project: {
              _id: 1,
              title: '$listing.title',
              category: '$listing.category',
              orderCount: 1,
              totalRevenue: 1,
              avgRating: 1
            }
          },
          { $sort: { totalRevenue: -1 } },
          { $limit: 5 }
        ]),
        
        // Upcoming reservations
        Reservation.find({
          hostId,
          status: { $in: ['confirmed', 'in_progress'] },
          startDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        })
        .populate('listingId', 'title category images')
        .populate('customerId', 'name email')
        .sort({ startDate: 1 })
        .limit(10)
        .lean()
      ]);
      
      // Calculate pending earnings from completed orders
      const pendingEarnings = await Order.aggregate([
        {
          $match: {
            hostId: mongoose.Types.ObjectId(hostId),
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
            orderCount: { $sum: 1 }
          }
        }
      ]);
      
      // Format response
      const earnings = earningsStats[0] || {
        totalRevenue: 0,
        hostEarnings: 0,
        platformFees: 0,
        avgOrderValue: 0,
        orderCount: 0
      };
      
      const payouts = payoutStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          amount: stat.totalAmount
        };
        return acc;
      }, {});
      
      const pending = pendingEarnings[0] || { pendingAmount: 0, orderCount: 0 };
      
      // Get recent activity (orders, reviews, etc.)
      const recentActivity = await Order.find({
        hostId,
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
      .populate('customerId', 'name')
      .populate('lineItems.listingId', 'title')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();
      
      const dashboard = {
        overview: {
          totalListings,
          activeListings,
          totalOrders,
          recentOrders,
          listingUtilization: totalListings > 0 ? (activeListings / totalListings) * 100 : 0
        },
        earnings: {
          ...earnings,
          pendingEarnings: pending.pendingAmount,
          pendingOrdersCount: pending.orderCount
        },
        payouts: {
          pending: payouts.pending || { count: 0, amount: 0 },
          approved: payouts.approved || { count: 0, amount: 0 },
          processed: payouts.processed || { count: 0, amount: 0 },
          rejected: payouts.rejected || { count: 0, amount: 0 }
        },
        topListings: listingPerformance,
        upcomingReservations,
        recentActivity: recentActivity.map(order => ({
          id: order._id,
          type: 'order',
          status: order.status,
          customer: order.customerId.name,
          amount: order.pricing.totalAmount,
          date: order.updatedAt,
          listings: order.lineItems.map(item => item.listingId.title)
        }))
      };
      
      logger.info('Dashboard overview generated', {
        hostId,
        period,
        totalListings,
        totalOrders: earnings.orderCount
      });
      
      res.json({
        success: true,
        data: dashboard
      });
      
    } catch (error) {
      logger.error('Get dashboard overview failed', {
        error: error.message,
        stack: error.stack,
        hostId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard overview',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get earnings analytics with breakdown
   */
  static async getEarningsAnalytics(req, res) {
    try {
      const hostId = req.user.id;
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
      
      const [earningsTimeline, categoryBreakdown, paymentMethodBreakdown] = await Promise.all([
        // Earnings timeline
        Order.aggregate([
          {
            $match: {
              hostId: mongoose.Types.ObjectId(hostId),
              status: { $in: ['confirmed', 'in_progress', 'completed'] },
              createdAt: { $gte: startDate, $lte: new Date() }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
              totalRevenue: { $sum: '$pricing.totalAmount' },
              hostEarnings: { 
                $sum: { $subtract: ['$pricing.totalAmount', '$pricing.platformFee'] }
              },
              platformFees: { $sum: '$pricing.platformFee' },
              orderCount: { $sum: 1 },
              avgOrderValue: { $avg: '$pricing.totalAmount' }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        
        // Category-wise earnings
        Order.aggregate([
          {
            $match: {
              hostId: mongoose.Types.ObjectId(hostId),
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
              avgOrderValue: { $avg: '$lineItems.totalPrice' }
            }
          },
          { $sort: { totalRevenue: -1 } }
        ]),
        
        // Payment method breakdown
        Order.aggregate([
          {
            $match: {
              hostId: mongoose.Types.ObjectId(hostId),
              status: { $in: ['confirmed', 'in_progress', 'completed'] },
              createdAt: { $gte: startDate, $lte: new Date() }
            }
          },
          {
            $group: {
              _id: '$paymentMode',
              totalRevenue: { $sum: '$pricing.totalAmount' },
              orderCount: { $sum: 1 },
              avgOrderValue: { $avg: '$pricing.totalAmount' }
            }
          }
        ])
      ]);
      
      res.json({
        success: true,
        data: {
          timeline: earningsTimeline,
          categoryBreakdown,
          paymentMethodBreakdown,
          period: {
            start: startDate,
            end: new Date(),
            groupBy
          }
        }
      });
      
    } catch (error) {
      logger.error('Get earnings analytics failed', {
        error: error.message,
        hostId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch earnings analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get listing performance analytics
   */
  static async getListingAnalytics(req, res) {
    try {
      const hostId = req.user.id;
      const { period = '30', sortBy = 'revenue', limit = 20 } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      
      // Determine sort field
      let sortField;
      switch (sortBy) {
        case 'orders':
          sortField = { orderCount: -1 };
          break;
        case 'rating':
          sortField = { avgRating: -1 };
          break;
        case 'views':
          sortField = { viewCount: -1 };
          break;
        default:
          sortField = { totalRevenue: -1 };
      }
      
      const listingStats = await Order.aggregate([
        {
          $match: {
            hostId: mongoose.Types.ObjectId(hostId),
            createdAt: { $gte: startDate, $lte: new Date() }
          }
        },
        { $unwind: '$lineItems' },
        {
          $group: {
            _id: '$lineItems.listingId',
            orderCount: { $sum: 1 },
            totalRevenue: { $sum: '$lineItems.totalPrice' },
            avgOrderValue: { $avg: '$lineItems.totalPrice' },
            totalQuantity: { $sum: '$lineItems.quantity' },
            avgRating: { $avg: '$reviews.rating' },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: 'listings',
            localField: '_id',
            foreignField: '_id',
            as: 'listing'
          }
        },
        { $unwind: '$listing' },
        {
          $project: {
            _id: 1,
            title: '$listing.title',
            category: '$listing.category',
            status: '$listing.status',
            basePrice: '$listing.pricing.basePrice',
            images: '$listing.images',
            orderCount: 1,
            totalRevenue: 1,
            avgOrderValue: 1,
            totalQuantity: 1,
            avgRating: { $ifNull: ['$avgRating', 0] },
            completedOrders: 1,
            cancelledOrders: 1,
            conversionRate: {
              $cond: [
                { $gt: ['$orderCount', 0] },
                { $divide: ['$completedOrders', '$orderCount'] },
                0
              ]
            },
            viewCount: '$listing.analytics.viewCount'
          }
        },
        { $sort: sortField },
        { $limit: parseInt(limit) }
      ]);
      
      // Get underperforming listings (no orders in period)
      const allListings = await Listing.find({ ownerId: hostId }).select('_id title category status').lean();
      const listingsWithOrders = new Set(listingStats.map(stat => stat._id.toString()));
      const underperforming = allListings.filter(listing => 
        !listingsWithOrders.has(listing._id.toString())
      );
      
      res.json({
        success: true,
        data: {
          topPerforming: listingStats,
          underperforming,
          summary: {
            totalListings: allListings.length,
            performingListings: listingStats.length,
            underperformingListings: underperforming.length,
            avgOrdersPerListing: listingStats.length > 0 
              ? listingStats.reduce((sum, stat) => sum + stat.orderCount, 0) / listingStats.length 
              : 0
          }
        }
      });
      
    } catch (error) {
      logger.error('Get listing analytics failed', {
        error: error.message,
        hostId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch listing analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get customer analytics
   */
  static async getCustomerAnalytics(req, res) {
    try {
      const hostId = req.user.id;
      const { period = '30' } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      
      const [customerStats, repeatCustomers, topCustomers] = await Promise.all([
        // Overall customer statistics
        Order.aggregate([
          {
            $match: {
              hostId: mongoose.Types.ObjectId(hostId),
              createdAt: { $gte: startDate, $lte: new Date() }
            }
          },
          {
            $group: {
              _id: null,
              uniqueCustomers: { $addToSet: '$customerId' },
              totalOrders: { $sum: 1 },
              avgOrderValue: { $avg: '$pricing.totalAmount' }
            }
          },
          {
            $project: {
              uniqueCustomers: { $size: '$uniqueCustomers' },
              totalOrders: 1,
              avgOrderValue: 1,
              avgOrdersPerCustomer: { $divide: ['$totalOrders', { $size: '$uniqueCustomers' }] }
            }
          }
        ]),
        
        // Repeat customers
        Order.aggregate([
          {
            $match: {
              hostId: mongoose.Types.ObjectId(hostId),
              createdAt: { $gte: startDate, $lte: new Date() }
            }
          },
          {
            $group: {
              _id: '$customerId',
              orderCount: { $sum: 1 },
              totalSpent: { $sum: '$pricing.totalAmount' },
              firstOrder: { $min: '$createdAt' },
              lastOrder: { $max: '$createdAt' }
            }
          },
          {
            $match: { orderCount: { $gt: 1 } }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'customer'
            }
          },
          { $unwind: '$customer' },
          {
            $project: {
              name: '$customer.name',
              email: '$customer.email',
              orderCount: 1,
              totalSpent: 1,
              avgOrderValue: { $divide: ['$totalSpent', '$orderCount'] },
              daysBetweenOrders: {
                $divide: [
                  { $subtract: ['$lastOrder', '$firstOrder'] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          },
          { $sort: { orderCount: -1 } }
        ]),
        
        // Top customers by spending
        Order.aggregate([
          {
            $match: {
              hostId: mongoose.Types.ObjectId(hostId),
              createdAt: { $gte: startDate, $lte: new Date() }
            }
          },
          {
            $group: {
              _id: '$customerId',
              orderCount: { $sum: 1 },
              totalSpent: { $sum: '$pricing.totalAmount' },
              avgRating: { $avg: '$reviews.rating' }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'customer'
            }
          },
          { $unwind: '$customer' },
          {
            $project: {
              name: '$customer.name',
              email: '$customer.email',
              orderCount: 1,
              totalSpent: 1,
              avgOrderValue: { $divide: ['$totalSpent', '$orderCount'] },
              avgRating: { $ifNull: ['$avgRating', 0] }
            }
          },
          { $sort: { totalSpent: -1 } },
          { $limit: 10 }
        ])
      ]);
      
      const stats = customerStats[0] || {
        uniqueCustomers: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        avgOrdersPerCustomer: 0
      };
      
      res.json({
        success: true,
        data: {
          overview: stats,
          repeatCustomers,
          topCustomers,
          metrics: {
            customerRetentionRate: repeatCustomers.length > 0 
              ? (repeatCustomers.length / stats.uniqueCustomers) * 100 
              : 0,
            newCustomersInPeriod: stats.uniqueCustomers - repeatCustomers.length
          }
        }
      });
      
    } catch (error) {
      logger.error('Get customer analytics failed', {
        error: error.message,
        hostId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get upcoming events and reminders
   */
  static async getUpcomingEvents(req, res) {
    try {
      const hostId = req.user.id;
      const { days = '7' } = req.query;
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(days));
      
      const [upcomingPickups, upcomingReturns, expiringSoonListings, pendingPayouts] = await Promise.all([
        // Upcoming pickups
        Reservation.find({
          hostId,
          status: 'confirmed',
          startDate: { $gte: new Date(), $lte: endDate }
        })
        .populate('listingId', 'title category images')
        .populate('customerId', 'name email phone')
        .sort({ startDate: 1 })
        .lean(),
        
        // Upcoming returns
        Reservation.find({
          hostId,
          status: 'in_progress',
          endDate: { $gte: new Date(), $lte: endDate }
        })
        .populate('listingId', 'title category images')
        .populate('customerId', 'name email phone')
        .sort({ endDate: 1 })
        .lean(),
        
        // Listings that need renewal/update
        Listing.find({
          ownerId: hostId,
          status: 'active',
          updatedAt: { $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
        .select('title category updatedAt pricing.basePrice')
        .sort({ updatedAt: 1 })
        .limit(10)
        .lean(),
        
        // Pending payouts that can be requested
        Order.aggregate([
          {
            $match: {
              hostId: mongoose.Types.ObjectId(hostId),
              status: 'completed',
              'payout.status': { $in: ['pending', null] },
              createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: null,
              orderCount: { $sum: 1 },
              totalEarnings: {
                $sum: { $subtract: ['$pricing.totalAmount', '$pricing.platformFee'] }
              }
            }
          }
        ])
      ]);
      
      const events = {
        pickups: upcomingPickups.map(reservation => ({
          id: reservation._id,
          type: 'pickup',
          date: reservation.startDate,
          listing: reservation.listingId,
          customer: reservation.customerId,
          priority: 'high'
        })),
        
        returns: upcomingReturns.map(reservation => ({
          id: reservation._id,
          type: 'return',
          date: reservation.endDate,
          listing: reservation.listingId,
          customer: reservation.customerId,
          priority: 'medium'
        })),
        
        reminders: [
          ...expiringSoonListings.map(listing => ({
            id: listing._id,
            type: 'listing_update',
            message: `Update listing: ${listing.title}`,
            date: listing.updatedAt,
            priority: 'low'
          })),
          
          ...(pendingPayouts[0] && pendingPayouts[0].totalEarnings > 0 ? [{
            id: 'pending_payouts',
            type: 'payout_available',
            message: `₹${pendingPayouts[0].totalEarnings} available for payout`,
            count: pendingPayouts[0].orderCount,
            priority: 'medium'
          }] : [])
        ]
      };
      
      // Sort all events by date and priority
      const allEvents = [
        ...events.pickups,
        ...events.returns,
        ...events.reminders.filter(r => r.date)
      ].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });
      
      res.json({
        success: true,
        data: {
          ...events,
          timeline: allEvents.slice(0, 20), // Most urgent 20 events
          summary: {
            totalEvents: allEvents.length,
            highPriorityCount: allEvents.filter(e => e.priority === 'high').length,
            upcomingPickupsCount: events.pickups.length,
            upcomingReturnsCount: events.returns.length
          }
        }
      });
      
    } catch (error) {
      logger.error('Get upcoming events failed', {
        error: error.message,
        hostId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming events',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = HostDashboardController;
