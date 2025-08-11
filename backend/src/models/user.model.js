const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Profile for both lending and borrowing
  profile: {
    displayName: { type: String },
    phone: { type: String },
    address: { type: String },
    bio: { type: String, maxlength: 500 },
    profilePicture: { type: String },
    
    // Identity verification (optional for basic usage, required for high-value items)
    verified: { type: Boolean, default: false },
    govtIdUrl: { type: String },
    verificationDate: { type: Date },
    verificationNotes: { type: String },
    
    // Social proof
    socialLinks: {
      facebook: { type: String },
      linkedin: { type: String },
      instagram: { type: String }
    }
  },
  
  // Lending statistics
  lenderStats: {
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    responseTime: { type: Number, default: 24 }, // hours
    completedRentals: { type: Number, default: 0 },
    totalListings: { type: Number, default: 0 },
    activeListings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0, min: 0 }
  },
  
  // Borrowing statistics
  borrowerStats: {
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    completedRentals: { type: Number, default: 0 },
    cancelledRentals: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100, min: 0, max: 100 }, // Based on behavior
    totalSpent: { type: Number, default: 0, min: 0 }
  },
  
  // Wallet and financials
  walletBalance: { type: Number, default: 0, min: 0 },
  
  // Security and preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    privacy: {
      showPhone: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: false },
      showAddress: { type: Boolean, default: false }
    },
    autoAcceptBookings: { type: Boolean, default: false }, // For lenders
    maxLendingValue: { type: Number, default: 10000 }, // Maximum value they're willing to lend
    defaultDepositPercent: { type: Number, default: 20, min: 0, max: 100 }
  },
  
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Increment login attempts
UserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have hit max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

// Update user profile method
UserSchema.methods.updateProfile = function(profileData) {
  Object.keys(profileData).forEach(key => {
    if (this.profile[key] !== undefined) {
      this.profile[key] = profileData[key];
    }
  });
  
  return this.save();
};

// Calculate lender rating
UserSchema.methods.updateLenderRating = function(newRating) {
  const currentTotal = this.lenderStats.rating * this.lenderStats.totalRatings;
  this.lenderStats.totalRatings += 1;
  this.lenderStats.rating = (currentTotal + newRating) / this.lenderStats.totalRatings;
  
  return this.save();
};

// Calculate borrower rating
UserSchema.methods.updateBorrowerRating = function(newRating) {
  const currentTotal = this.borrowerStats.rating * this.borrowerStats.totalRatings;
  this.borrowerStats.totalRatings += 1;
  this.borrowerStats.rating = (currentTotal + newRating) / this.borrowerStats.totalRatings;
  
  return this.save();
};

// Update trust score based on behavior
UserSchema.methods.updateTrustScore = function(action) {
  const trustAdjustments = {
    'completed_rental': 2,
    'cancelled_rental': -5,
    'late_return': -3,
    'damage_report': -10,
    'positive_review': 1,
    'verified_identity': 10
  };
  
  const adjustment = trustAdjustments[action] || 0;
  this.borrowerStats.trustScore = Math.max(0, Math.min(100, this.borrowerStats.trustScore + adjustment));
  
  return this.save();
};

// Check if user can lend items (basic verification)
UserSchema.methods.canLendItems = function() {
  return this.isActive && this.profile.phone; // Minimum requirement: active account and phone
};

// Check if user can borrow high-value items
UserSchema.methods.canBorrowHighValueItems = function(itemValue = 0) {
  const minTrustScore = itemValue > 5000 ? 80 : itemValue > 1000 ? 60 : 40;
  return this.borrowerStats.trustScore >= minTrustScore && this.profile.verified;
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  return userObject;
};

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.verified': 1 });
UserSchema.index({ 'lenderStats.rating': -1 });
UserSchema.index({ 'borrowerStats.rating': -1 });
UserSchema.index({ 'borrowerStats.trustScore': -1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', UserSchema);
