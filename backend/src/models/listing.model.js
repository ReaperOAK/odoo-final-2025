const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100,
    index: true 
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 2000 
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  category: { 
    type: String, 
    required: true,
    enum: [
      'electronics', 'vehicles', 'tools', 'sports', 'music', 
      'photography', 'outdoor', 'furniture', 'appliances', 'other'
    ],
    index: true 
  },
  subCategory: { 
    type: String,
    maxlength: 50 
  },
  unitType: { 
    type: String, 
    enum: ['hour', 'day', 'week', 'month'], 
    default: 'day',
    required: true 
  },
  basePrice: { 
    type: Number, 
    required: true,
    min: 0.01,
    validate: {
      validator: Number.isFinite,
      message: 'Base price must be a valid number'
    }
  },
  discountedPrice: {
    type: Number,
    min: 0,
    validate: {
      validator: function(v) {
        return !v || v < this.basePrice;
      },
      message: 'Discounted price must be less than base price'
    }
  },
  depositType: { 
    type: String, 
    enum: ['flat', 'percent'], 
    default: 'percent' 
  },
  depositValue: { 
    type: Number, 
    default: 20,
    min: 0,
    validate: {
      validator: function(v) {
        if (this.depositType === 'percent') {
          return v >= 0 && v <= 100;
        }
        return v >= 0;
      },
      message: 'Invalid deposit value'
    }
  },
  totalQuantity: { 
    type: Number, 
    default: 1,
    min: 1,
    max: 1000,
    required: true 
  },
  availableQuantity: {
    type: Number,
    default: function() { return this.totalQuantity; },
    min: 0
  },
  location: {
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    pincode: { type: String },
    address: { type: String },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 }
    }
  },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'disabled', 'suspended'], 
    default: 'published',
    index: true 
  },
  features: [{
    type: String,
    maxlength: 50
  }],
  specifications: {
    brand: String,
    model: String,
    year: Number,
    condition: { 
      type: String, 
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good' 
    },
    weight: String,
    dimensions: String,
    powerRequirements: String,
    accessories: [String]
  },
  policies: {
    cancellationPolicy: {
      type: String,
      enum: ['flexible', 'moderate', 'strict'],
      default: 'moderate'
    },
    pickupInstructions: String,
    returnInstructions: String,
    damagePolicy: String,
    lateReturnFee: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 }
  },
  bookingCount: { type: Number, default: 0, min: 0 },
  viewCount: { type: Number, default: 0, min: 0 },
  favoriteCount: { type: Number, default: 0, min: 0 },
  isPromoted: { type: Boolean, default: false },
  promotedUntil: { type: Date },
  minimumRentalPeriod: {
    value: { type: Number, default: 1, min: 1 },
    unit: { type: String, enum: ['hour', 'day', 'week'], default: 'day' }
  },
  maximumRentalPeriod: {
    value: { type: Number, default: 30, min: 1 },
    unit: { type: String, enum: ['day', 'week', 'month'], default: 'day' }
  },
  advanceBookingDays: { type: Number, default: 0, min: 0, max: 365 },
  instantBooking: { type: Boolean, default: true },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  searchKeywords: [String],
  isActive: { type: Boolean, default: true },
  lastActivityAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for effective price (discounted or base)
ListingSchema.virtual('effectivePrice').get(function() {
  return this.discountedPrice || this.basePrice;
});

// Virtual for deposit amount calculation
ListingSchema.virtual('depositAmount').get(function() {
  if (this.depositType === 'percent') {
    return (this.effectivePrice * this.depositValue) / 100;
  }
  return this.depositValue;
});

// Virtual for availability status
ListingSchema.virtual('isAvailable').get(function() {
  return this.status === 'published' && 
         this.isActive && 
         this.availableQuantity > 0;
});

// Virtual for promotion status
ListingSchema.virtual('isCurrentlyPromoted').get(function() {
  return this.isPromoted && 
         this.promotedUntil && 
         this.promotedUntil > new Date();
});

// Pre-save middleware
ListingSchema.pre('save', function(next) {
  // Ensure availableQuantity doesn't exceed totalQuantity
  if (this.availableQuantity > this.totalQuantity) {
    this.availableQuantity = this.totalQuantity;
  }
  
  // Update lastActivityAt
  this.lastActivityAt = new Date();
  
  // Generate search keywords
  this.searchKeywords = [
    ...this.title.toLowerCase().split(' '),
    ...this.description.toLowerCase().split(' ').slice(0, 10),
    this.category.toLowerCase(),
    this.location.city.toLowerCase(),
    this.specifications.brand?.toLowerCase(),
    this.specifications.model?.toLowerCase()
  ].filter(Boolean).filter(word => word.length > 2);
  
  next();
});

// Instance methods
ListingSchema.methods.updateRating = function(newRating) {
  const currentTotal = this.ratings.average * this.ratings.count;
  this.ratings.count += 1;
  this.ratings.average = (currentTotal + newRating) / this.ratings.count;
  return this.save();
};

ListingSchema.methods.incrementBooking = function() {
  this.bookingCount += 1;
  this.lastActivityAt = new Date();
  return this.save();
};

ListingSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

ListingSchema.methods.canAccommodateBooking = function(quantity, startDate, endDate) {
  if (quantity > this.availableQuantity) {
    return false;
  }
  
  // Check minimum rental period
  const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const minDays = this.minimumRentalPeriod.unit === 'day' ? 
    this.minimumRentalPeriod.value : 
    this.minimumRentalPeriod.value * 7; // assume week = 7 days
    
  if (duration < minDays) {
    return false;
  }
  
  // Check advance booking requirement
  const daysTilStart = Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24));
  if (daysTilStart < this.advanceBookingDays) {
    return false;
  }
  
  return true;
};

// Static methods
ListingSchema.statics.findAvailable = function(filters = {}) {
  const query = {
    status: 'published',
    isActive: true,
    availableQuantity: { $gt: 0 }
  };
  
  if (filters.category) query.category = filters.category;
  if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
  if (filters.minPrice) query.basePrice = { $gte: filters.minPrice };
  if (filters.maxPrice) query.basePrice = { ...query.basePrice, $lte: filters.maxPrice };
  
  return this.find(query)
    .populate('ownerId', 'name hostProfile.displayName hostProfile.rating hostProfile.verified')
    .sort({ 'isPromoted': -1, 'ratings.average': -1, 'createdAt': -1 });
};

ListingSchema.statics.searchListings = function(searchTerm, filters = {}) {
  const query = {
    status: 'published',
    isActive: true,
    availableQuantity: { $gt: 0 }
  };
  
  if (searchTerm) {
    query.$or = [
      { title: new RegExp(searchTerm, 'i') },
      { description: new RegExp(searchTerm, 'i') },
      { searchKeywords: { $in: [new RegExp(searchTerm, 'i')] } },
      { category: new RegExp(searchTerm, 'i') }
    ];
  }
  
  // Apply additional filters
  Object.assign(query, filters);
  
  return this.find(query)
    .populate('ownerId', 'name hostProfile.displayName hostProfile.rating hostProfile.verified')
    .sort({ 
      score: { $meta: 'textScore' },
      'isPromoted': -1, 
      'ratings.average': -1, 
      'createdAt': -1 
    });
};

// Indexes for performance optimization
ListingSchema.index({ ownerId: 1, status: 1 });
ListingSchema.index({ status: 1, isActive: 1, availableQuantity: 1 });
ListingSchema.index({ category: 1, status: 1 });
ListingSchema.index({ 'location.city': 1, status: 1 });
ListingSchema.index({ basePrice: 1, status: 1 });
ListingSchema.index({ 'ratings.average': -1, status: 1 });
ListingSchema.index({ isPromoted: -1, promotedUntil: 1 });
ListingSchema.index({ createdAt: -1 });
ListingSchema.index({ lastActivityAt: -1 });
ListingSchema.index({ searchKeywords: 1 });

// Text index for search functionality
ListingSchema.index({ 
  title: 'text', 
  description: 'text', 
  searchKeywords: 'text' 
}, {
  weights: {
    title: 10,
    searchKeywords: 5,
    description: 1
  }
});

// Compound indexes for common queries
ListingSchema.index({ status: 1, category: 1, 'location.city': 1 });
ListingSchema.index({ ownerId: 1, createdAt: -1 });
ListingSchema.index({ status: 1, isPromoted: -1, 'ratings.average': -1 });

module.exports = mongoose.model('Listing', ListingSchema);
