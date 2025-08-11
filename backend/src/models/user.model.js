const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'host', 'admin'], default: 'customer' },
  isHost: { type: Boolean, default: false },
  hostProfile: {
    displayName: { type: String },
    verified: { type: Boolean, default: false },
    phone: { type: String },
    address: { type: String },
    govtIdUrl: { type: String },
    businessDescription: { type: String },
    verificationDate: { type: Date },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    responseTime: { type: Number, default: 24 }, // hours
    completedBookings: { type: Number, default: 0 }
  },
  walletBalance: { type: Number, default: 0, min: 0 },
  totalEarnings: { type: Number, default: 0, min: 0 },
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

// Update host profile method
UserSchema.methods.updateHostProfile = function(profileData) {
  if (!this.isHost) {
    throw new Error('User is not a host');
  }
  
  Object.keys(profileData).forEach(key => {
    if (this.hostProfile[key] !== undefined) {
      this.hostProfile[key] = profileData[key];
    }
  });
  
  return this.save();
};

// Calculate host rating
UserSchema.methods.updateHostRating = function(newRating) {
  if (!this.isHost) {
    throw new Error('User is not a host');
  }
  
  const currentTotal = this.hostProfile.rating * this.hostProfile.totalRatings;
  this.hostProfile.totalRatings += 1;
  this.hostProfile.rating = (currentTotal + newRating) / this.hostProfile.totalRatings;
  
  return this.save();
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
UserSchema.index({ isHost: 1 });
UserSchema.index({ 'hostProfile.verified': 1 });
UserSchema.index({ 'hostProfile.rating': -1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', UserSchema);
