const mongoose = require('mongoose');
const Listing = require('../models/listing.model');
const User = require('../models/user.model');
const Reservation = require('../models/reservation.model');
const ReservationService = require('../services/reservation.service');
const PricingService = require('../services/pricing.service');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Listing Controller for P2P Marketplace
 * Handles all listing-related operations for hosts
 */
class ListingController {
  /**
   * Create a new listing (host only)
   */
  static async createListing(req, res) {
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
      const user = await User.findById(userId);
      
      if (!user.isHost) {
        return res.status(403).json({
          success: false,
          message: 'Only hosts can create listings'
        });
      }
      
      const listingData = {
        ...req.body,
        ownerId: userId
      };
      
      // Process images if provided
      if (req.body.images && Array.isArray(req.body.images)) {
        listingData.images = req.body.images.filter(img => 
          /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(img)
        );
      }
      
      // Set default location if not provided
      if (!listingData.location) {
        listingData.location = {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India'
        };
      }
      
      // Create listing
      const listing = new Listing(listingData);
      await listing.save();
      
      // Populate owner details
      await listing.populate('ownerId', 'name email hostProfile');
      
      logger.info('Listing created successfully', {
        listingId: listing._id,
        ownerId: userId,
        title: listing.title,
        category: listing.category
      });
      
      res.status(201).json({
        success: true,
        message: 'Listing created successfully',
        data: listing
      });
      
    } catch (error) {
      logger.error('Create listing failed', {
        error: error.message,
        userId: req.user?.id,
        body: JSON.stringify(req.body)
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create listing',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get all listings with filters and pagination
   */
  static async getListings(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        city,
        minPrice,
        maxPrice,
        startDate,
        endDate,
        quantity = 1,
        search,
        sortBy = 'relevance',
        hostId,
        status = 'published'
      } = req.query;
      
      const skip = (page - 1) * limit;
      const query = {
        status: status === 'all' ? { $ne: 'draft' } : status,
        isActive: true
      };
      
      // Apply filters
      if (category && category !== 'all') {
        query.category = category;
      }
      
      if (city) {
        query['location.city'] = new RegExp(city, 'i');
      }
      
      if (minPrice || maxPrice) {
        query.basePrice = {};
        if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
        if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
      }
      
      if (hostId) {
        query.ownerId = mongoose.Types.ObjectId(hostId);
      }
      
      // Handle search
      if (search) {
        query.$or = [
          { title: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { searchKeywords: { $in: [new RegExp(search, 'i')] } },
          { category: new RegExp(search, 'i') }
        ];
      }
      
      // Check availability if dates provided
      if (startDate && endDate) {
        const availableListingIds = await this.getAvailableListings(
          startDate, endDate, parseInt(quantity)
        );
        
        if (availableListingIds.length > 0) {
          query._id = { $in: availableListingIds };
        } else {
          // No available listings
          return res.json({
            success: true,
            data: {
              listings: [],
              pagination: {
                currentPage: parseInt(page),
                totalPages: 0,
                totalListings: 0,
                hasNext: false,
                hasPrev: false
              },
              filters: { category, city, minPrice, maxPrice, startDate, endDate }
            }
          });
        }
      }
      
      // Build sort criteria
      let sortCriteria = {};
      switch (sortBy) {
        case 'price_low':
          sortCriteria = { basePrice: 1 };
          break;
        case 'price_high':
          sortCriteria = { basePrice: -1 };
          break;
        case 'rating':
          sortCriteria = { 'ratings.average': -1, 'ratings.count': -1 };
          break;
        case 'newest':
          sortCriteria = { createdAt: -1 };
          break;
        case 'popular':
          sortCriteria = { bookingCount: -1, 'ratings.average': -1 };
          break;
        default: // relevance
          sortCriteria = { 
            isPromoted: -1, 
            'ratings.average': -1, 
            bookingCount: -1,
            createdAt: -1 
          };
      }
      
      // Execute query with aggregation for better performance
      const aggregationPipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'ownerId',
            foreignField: '_id',
            as: 'owner',
            pipeline: [
              {
                $project: {
                  name: 1,
                  'hostProfile.displayName': 1,
                  'hostProfile.rating': 1,
                  'hostProfile.verified': 1,
                  'hostProfile.responseTime': 1
                }
              }
            ]
          }
        },
        { $unwind: '$owner' },
        {
          $addFields: {
            effectivePrice: {
              $ifNull: ['$discountedPrice', '$basePrice']
            },
            isCurrentlyPromoted: {
              $and: [
                '$isPromoted',
                { $gt: ['$promotedUntil', new Date()] }
              ]
            }
          }
        },
        { $sort: sortCriteria },
        {
          $facet: {
            listings: [
              { $skip: skip },
              { $limit: parseInt(limit) }
            ],
            totalCount: [
              { $count: 'count' }
            ]
          }
        }
      ];
      
      const [result] = await Listing.aggregate(aggregationPipeline);
      const listings = result.listings;
      const totalListings = result.totalCount[0]?.count || 0;
      const totalPages = Math.ceil(totalListings / limit);
      
      // Add pricing information if dates provided
      if (startDate && endDate && listings.length > 0) {
        for (const listing of listings) {
          try {
            const pricing = await PricingService.calculateRentalPrice(
              listing._id,
              startDate,
              endDate,
              parseInt(quantity),
              { skipValidation: true }
            );
            listing.calculatedPricing = pricing.breakdown;
          } catch (error) {
            logger.warn('Pricing calculation failed for listing', {
              listingId: listing._id,
              error: error.message
            });
          }
        }
      }
      
      res.json({
        success: true,
        data: {
          listings,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalListings,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            perPage: parseInt(limit)
          },
          filters: {
            category,
            city,
            minPrice,
            maxPrice,
            startDate,
            endDate,
            quantity,
            search,
            sortBy
          }
        }
      });
      
    } catch (error) {
      logger.error('Get listings failed', {
        error: error.message,
        query: JSON.stringify(req.query)
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch listings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get single listing by ID
   */
  static async getListingById(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, quantity = 1 } = req.query;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid listing ID'
        });
      }
      
      const listing = await Listing.findById(id)
        .populate('ownerId', 'name email hostProfile createdAt');
      
      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Listing not found'
        });
      }
      
      // Increment view count (fire and forget)
      listing.incrementView().catch(err => 
        logger.warn('Failed to increment view count', { listingId: id, error: err.message })
      );
      
      // Check availability if dates provided
      let availabilityInfo = null;
      if (startDate && endDate) {
        try {
          availabilityInfo = await ReservationService.checkAtomicAvailability(
            id, new Date(startDate), new Date(endDate), parseInt(quantity)
          );
        } catch (error) {
          logger.warn('Availability check failed', {
            listingId: id,
            error: error.message
          });
        }
      }
      
      // Calculate pricing if dates provided
      let pricingInfo = null;
      if (startDate && endDate && availabilityInfo?.available) {
        try {
          pricingInfo = await PricingService.calculateRentalPrice(
            id,
            startDate,
            endDate,
            parseInt(quantity)
          );
        } catch (error) {
          logger.warn('Pricing calculation failed', {
            listingId: id,
            error: error.message
          });
        }
      }
      
      // Get similar listings
      const similarListings = await this.getSimilarListings(listing, 4);
      
      // Get recent reviews (if we had a review system)
      const recentReviews = []; // Placeholder for review system
      
      res.json({
        success: true,
        data: {
          listing,
          availability: availabilityInfo,
          pricing: pricingInfo?.breakdown,
          similarListings,
          recentReviews
        }
      });
      
    } catch (error) {
      logger.error('Get listing by ID failed', {
        error: error.message,
        listingId: req.params.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch listing',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Update listing (owner only)
   */
  static async updateListing(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      const userId = req.user.id;
      
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
      
      // Check ownership
      if (listing.ownerId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this listing'
        });
      }
      
      // Update fields
      const updateData = { ...req.body };
      delete updateData.ownerId; // Prevent ownership change
      delete updateData.bookingCount; // Prevent manipulation
      delete updateData.ratings; // Prevent rating manipulation
      
      // Process images if provided
      if (updateData.images && Array.isArray(updateData.images)) {
        updateData.images = updateData.images.filter(img => 
          /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(img)
        );
      }
      
      Object.assign(listing, updateData);
      await listing.save();
      
      await listing.populate('ownerId', 'name email hostProfile');
      
      logger.info('Listing updated successfully', {
        listingId: id,
        ownerId: userId,
        updatedFields: Object.keys(updateData)
      });
      
      res.json({
        success: true,
        message: 'Listing updated successfully',
        data: listing
      });
      
    } catch (error) {
      logger.error('Update listing failed', {
        error: error.message,
        listingId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update listing',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Delete listing (owner only)
   */
  static async deleteListing(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
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
      
      // Check ownership
      if (listing.ownerId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this listing'
        });
      }
      
      // Check for active reservations
      const activeReservations = await Reservation.countDocuments({
        listingId: id,
        status: { $in: ['confirmed', 'picked_up', 'in_progress'] }
      });
      
      if (activeReservations > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete listing with active reservations'
        });
      }
      
      // Soft delete - set status to disabled
      listing.status = 'disabled';
      listing.isActive = false;
      await listing.save();
      
      logger.info('Listing deleted successfully', {
        listingId: id,
        ownerId: userId
      });
      
      res.json({
        success: true,
        message: 'Listing deleted successfully'
      });
      
    } catch (error) {
      logger.error('Delete listing failed', {
        error: error.message,
        listingId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete listing',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Check availability for a listing
   */
  static async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, quantity = 1 } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid listing ID'
        });
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
      
      if (start < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Start date cannot be in the past'
        });
      }
      
      const availability = await ReservationService.checkAtomicAvailability(
        id, start, end, parseInt(quantity)
      );
      
      // Get conflicting reservations for more details
      let conflicts = [];
      if (!availability.available) {
        conflicts = await ReservationService.getReservationConflicts(
          id, start, end
        );
      }
      
      res.json({
        success: true,
        data: {
          ...availability,
          conflicts: conflicts.map(conflict => ({
            id: conflict._id,
            startDate: conflict.startDate,
            endDate: conflict.endDate,
            quantity: conflict.quantity,
            status: conflict.status
          }))
        }
      });
      
    } catch (error) {
      logger.error('Availability check failed', {
        error: error.message,
        listingId: req.params.id,
        query: JSON.stringify(req.query)
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to check availability',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Calculate pricing for a listing
   */
  static async calculatePricing(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, quantity = 1, paymentType = 'deposit' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid listing ID'
        });
      }
      
      const pricing = await PricingService.calculateRentalPrice(
        id,
        startDate,
        endDate,
        parseInt(quantity),
        {
          paymentType,
          userType: req.user ? 'returning' : 'new',
          completedBookings: req.user?.completedBookings || 0
        }
      );
      
      res.json({
        success: true,
        data: pricing
      });
      
    } catch (error) {
      logger.error('Pricing calculation failed', {
        error: error.message,
        listingId: req.params.id,
        query: JSON.stringify(req.query)
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to calculate pricing',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get host's listings
   */
  static async getHostListings(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status, search } = req.query;
      
      const skip = (page - 1) * limit;
      const query = { ownerId: mongoose.Types.ObjectId(userId) };
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (search) {
        query.$or = [
          { title: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ];
      }
      
      const [listings, totalCount] = await Promise.all([
        Listing.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Listing.countDocuments(query)
      ]);
      
      // Add analytics for each listing
      for (const listing of listings) {
        const analytics = await ReservationService.getReservationAnalytics(
          userId,
          { listingId: listing._id }
        );
        listing.analytics = analytics;
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
      logger.error('Get host listings failed', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch host listings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get listing categories with counts
   */
  static async getCategories(req, res) {
    try {
      const categories = await Listing.aggregate([
        {
          $match: {
            status: 'published',
            isActive: true
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: '$basePrice' },
            minPrice: { $min: '$basePrice' },
            maxPrice: { $max: '$basePrice' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      res.json({
        success: true,
        data: categories
      });
      
    } catch (error) {
      logger.error('Get categories failed', { error: error.message });
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Helper method to get available listings for date range
   */
  static async getAvailableListings(startDate, endDate, quantity) {
    try {
      const availableListings = await Reservation.aggregate([
        {
          $match: {
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
            _id: '$listingId',
            totalReserved: { $sum: '$quantity' }
          }
        }
      ]);
      
      const reservedMap = {};
      availableListings.forEach(item => {
        reservedMap[item._id.toString()] = item.totalReserved;
      });
      
      const allListings = await Listing.find({
        status: 'published',
        isActive: true
      }, '_id totalQuantity').lean();
      
      return allListings
        .filter(listing => {
          const reserved = reservedMap[listing._id.toString()] || 0;
          return listing.totalQuantity - reserved >= quantity;
        })
        .map(listing => listing._id);
        
    } catch (error) {
      logger.error('Get available listings failed', { error: error.message });
      return [];
    }
  }
  
  /**
   * Helper method to get similar listings
   */
  static async getSimilarListings(listing, limit = 4) {
    try {
      const similarListings = await Listing.find({
        _id: { $ne: listing._id },
        category: listing.category,
        status: 'published',
        isActive: true,
        'location.city': listing.location.city
      })
      .populate('ownerId', 'name hostProfile.displayName hostProfile.rating')
      .sort({ 'ratings.average': -1, bookingCount: -1 })
      .limit(limit)
      .lean();
      
      return similarListings;
    } catch (error) {
      logger.error('Get similar listings failed', { error: error.message });
      return [];
    }
  }
}

module.exports = ListingController;
