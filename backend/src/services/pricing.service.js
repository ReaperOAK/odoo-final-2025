const mongoose = require('mongoose');
const Listing = require('../models/listing.model');
const logger = require('../utils/logger');

class PricingService {
  /**
   * Calculate total price for a rental period
   */
  static async calculateRentalPrice(listingId, startDate, endDate, quantity = 1, options = {}) {
    try {
      const listing = await Listing.findById(listingId);
      
      if (!listing) {
        throw new Error('Listing not found');
      }
      
      if (!listing.isAvailable) {
        throw new Error('Listing is not available for booking');
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        throw new Error('End date must be after start date');
      }
      
      if (start < new Date()) {
        throw new Error('Start date cannot be in the past');
      }
      
      // Calculate duration based on unit type
      const duration = this.calculateDuration(start, end, listing.unitType);
      const basePrice = listing.effectivePrice;
      
      // Apply quantity multiplier
      let subtotal = basePrice * duration.value * quantity;
      
      // Apply dynamic pricing adjustments
      subtotal = this.applyDynamicPricing(subtotal, {
        listing,
        startDate: start,
        endDate: end,
        duration: duration.value,
        quantity,
        ...options
      });
      
      // Apply discounts
      const discounts = this.calculateDiscounts(subtotal, {
        listing,
        duration: duration.value,
        quantity,
        ...options
      });
      
      const discountedSubtotal = subtotal - discounts.totalDiscount;
      
      // Calculate deposit
      const depositAmount = this.calculateDeposit(listing, quantity);
      
      // Calculate fees and taxes
      const fees = this.calculateFees(discountedSubtotal, {
        listing,
        duration: duration.value,
        quantity,
        ...options
      });
      
      // Calculate total
      const totalAmount = discountedSubtotal + fees.totalFees;
      
      // Calculate host earnings (after platform commission)
      const platformCommission = discountedSubtotal * (options.platformCommissionRate || 0.05);
      const hostEarnings = discountedSubtotal - platformCommission;
      
      const breakdown = {
        // Base pricing
        basePrice,
        quantity,
        duration: {
          value: duration.value,
          unit: duration.unit,
          display: duration.display
        },
        subtotal,
        
        // Discounts
        discounts: discounts.breakdown,
        totalDiscount: discounts.totalDiscount,
        discountedSubtotal,
        
        // Deposit
        depositAmount,
        depositType: listing.depositType,
        depositValue: listing.depositValue,
        
        // Fees and taxes
        fees: fees.breakdown,
        totalFees: fees.totalFees,
        
        // Final amounts
        totalAmount,
        platformCommission,
        hostEarnings,
        
        // Payment breakdown
        dueNow: options.paymentType === 'full' ? totalAmount : depositAmount,
        dueOnCompletion: options.paymentType === 'full' ? 0 : totalAmount - depositAmount,
        
        // Additional info
        currency: 'INR',
        validUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        terms: this.getPricingTerms(listing),
        
        // Metadata
        calculatedAt: new Date(),
        priceVersion: '2.0'
      };
      
      return {
        success: true,
        breakdown,
        listingTitle: listing.title,
        listingId: listing._id,
        ownerId: listing.ownerId
      };
      
    } catch (error) {
      logger.error('Price calculation failed', {
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
   * Calculate duration based on unit type
   */
  static calculateDuration(startDate, endDate, unitType) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    
    switch (unitType) {
      case 'hour':
        const hours = Math.ceil(diffMs / (1000 * 60 * 60));
        return {
          value: hours,
          unit: 'hour',
          display: `${hours} hour${hours > 1 ? 's' : ''}`
        };
        
      case 'day':
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
          value: days,
          unit: 'day',
          display: `${days} day${days > 1 ? 's' : ''}`
        };
        
      case 'week':
        const weeks = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
        return {
          value: weeks,
          unit: 'week',
          display: `${weeks} week${weeks > 1 ? 's' : ''}`
        };
        
      case 'month':
        const months = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));
        return {
          value: months,
          unit: 'month',
          display: `${months} month${months > 1 ? 's' : ''}`
        };
        
      default:
        throw new Error(`Invalid unit type: ${unitType}`);
    }
  }
  
  /**
   * Apply dynamic pricing based on demand, season, etc.
   */
  static applyDynamicPricing(baseAmount, options) {
    let adjustedAmount = baseAmount;
    const { listing, startDate, endDate, duration, quantity } = options;
    
    // Weekend pricing (Friday-Sunday)
    const hasWeekend = this.includesWeekend(startDate, endDate);
    if (hasWeekend) {
      adjustedAmount *= 1.2; // 20% weekend surcharge
    }
    
    // Long-term discount
    if (duration >= 7) {
      adjustedAmount *= 0.9; // 10% discount for weekly+ rentals
    } else if (duration >= 30) {
      adjustedAmount *= 0.8; // 20% discount for monthly+ rentals
    }
    
    // High-demand period surcharge
    if (this.isHighDemandPeriod(startDate)) {
      adjustedAmount *= 1.3; // 30% surcharge for high-demand periods
    }
    
    // Bulk quantity discount
    if (quantity >= 5) {
      adjustedAmount *= 0.95; // 5% bulk discount
    } else if (quantity >= 10) {
      adjustedAmount *= 0.9; // 10% bulk discount
    }
    
    // Early bird discount (booking far in advance)
    const daysInAdvance = (startDate - new Date()) / (1000 * 60 * 60 * 24);
    if (daysInAdvance >= 30) {
      adjustedAmount *= 0.95; // 5% early bird discount
    }
    
    // Popular listing surcharge
    if (listing.ratings.average >= 4.5 && listing.ratings.count >= 10) {
      adjustedAmount *= 1.1; // 10% surcharge for highly rated items
    }
    
    return Math.round(adjustedAmount * 100) / 100; // Round to 2 decimal places
  }
  
  /**
   * Calculate applicable discounts
   */
  static calculateDiscounts(amount, options) {
    const discounts = {
      breakdown: [],
      totalDiscount: 0
    };
    
    const { listing, duration, quantity, couponCode, userType } = options;
    
    // First-time user discount
    if (userType === 'new') {
      const discount = amount * 0.1; // 10% first-time discount
      discounts.breakdown.push({
        type: 'first_time_user',
        description: 'First-time user discount',
        amount: discount,
        percentage: 10
      });
      discounts.totalDiscount += discount;
    }
    
    // Loyalty discount for returning customers
    if (userType === 'returning' && options.completedBookings >= 5) {
      const discount = amount * 0.05; // 5% loyalty discount
      discounts.breakdown.push({
        type: 'loyalty',
        description: 'Loyalty discount',
        amount: discount,
        percentage: 5
      });
      discounts.totalDiscount += discount;
    }
    
    // Host-specific discounts
    if (listing.discountedPrice && listing.discountedPrice < listing.basePrice) {
      const discount = (listing.basePrice - listing.discountedPrice) * duration * quantity;
      discounts.breakdown.push({
        type: 'host_discount',
        description: 'Special offer',
        amount: discount,
        percentage: Math.round(((listing.basePrice - listing.discountedPrice) / listing.basePrice) * 100)
      });
      discounts.totalDiscount += discount;
    }
    
    // Coupon code discounts
    if (couponCode) {
      const couponDiscount = this.applyCouponCode(couponCode, amount, options);
      if (couponDiscount.valid) {
        discounts.breakdown.push(couponDiscount);
        discounts.totalDiscount += couponDiscount.amount;
      }
    }
    
    return discounts;
  }
  
  /**
   * Calculate deposit amount
   */
  static calculateDeposit(listing, quantity) {
    if (listing.depositType === 'flat') {
      return listing.depositValue * quantity;
    } else {
      // Percentage of base price
      return (listing.effectivePrice * listing.depositValue / 100) * quantity;
    }
  }
  
  /**
   * Calculate platform fees and taxes
   */
  static calculateFees(amount, options) {
    const fees = {
      breakdown: [],
      totalFees: 0
    };
    
    // Platform service fee
    const serviceFee = amount * 0.03; // 3% service fee
    fees.breakdown.push({
      type: 'service_fee',
      description: 'Platform service fee',
      amount: serviceFee,
      percentage: 3
    });
    fees.totalFees += serviceFee;
    
    // Payment processing fee
    const processingFee = amount * 0.02; // 2% payment processing
    fees.breakdown.push({
      type: 'processing_fee',
      description: 'Payment processing fee',
      amount: processingFee,
      percentage: 2
    });
    fees.totalFees += processingFee;
    
    // GST (Goods and Services Tax)
    const gstRate = 0.18; // 18% GST
    const gstAmount = (amount + fees.totalFees) * gstRate;
    fees.breakdown.push({
      type: 'gst',
      description: 'GST (18%)',
      amount: gstAmount,
      percentage: 18
    });
    fees.totalFees += gstAmount;
    
    // Convenience fee for online booking
    if (options.paymentMethod === 'online') {
      const convenienceFee = 25; // Flat ₹25 convenience fee
      fees.breakdown.push({
        type: 'convenience_fee',
        description: 'Online booking convenience fee',
        amount: convenienceFee,
        isFlat: true
      });
      fees.totalFees += convenienceFee;
    }
    
    return fees;
  }
  
  /**
   * Apply coupon code discount
   */
  static applyCouponCode(couponCode, amount, options) {
    // Mock coupon system - in production, this would query a coupons database
    const coupons = {
      'WELCOME10': {
        type: 'percentage',
        value: 10,
        minAmount: 1000,
        maxDiscount: 500,
        description: 'Welcome offer - 10% off'
      },
      'SAVE20': {
        type: 'percentage',
        value: 20,
        minAmount: 2000,
        maxDiscount: 1000,
        description: 'Save 20% on bookings above ₹2000'
      },
      'FLAT100': {
        type: 'flat',
        value: 100,
        minAmount: 500,
        description: 'Flat ₹100 off'
      }
    };
    
    const coupon = coupons[couponCode.toUpperCase()];
    
    if (!coupon) {
      return {
        valid: false,
        error: 'Invalid coupon code'
      };
    }
    
    if (amount < coupon.minAmount) {
      return {
        valid: false,
        error: `Minimum order amount of ₹${coupon.minAmount} required`
      };
    }
    
    let discountAmount;
    
    if (coupon.type === 'percentage') {
      discountAmount = (amount * coupon.value) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }
    
    return {
      valid: true,
      type: 'coupon',
      code: couponCode.toUpperCase(),
      description: coupon.description,
      amount: discountAmount,
      percentage: coupon.type === 'percentage' ? coupon.value : null
    };
  }
  
  /**
   * Check if date range includes weekend
   */
  static includesWeekend(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if date is in high-demand period
   */
  static isHighDemandPeriod(date) {
    const d = new Date(date);
    const month = d.getMonth() + 1; // 1-12
    const day = d.getDate();
    
    // Festival seasons and holidays
    const highDemandPeriods = [
      { start: { month: 10, day: 15 }, end: { month: 11, day: 15 } }, // Diwali season
      { start: { month: 12, day: 20 }, end: { month: 1, day: 5 } },   // Christmas/New Year
      { start: { month: 3, day: 1 }, end: { month: 3, day: 31 } },    // Holi season
      { start: { month: 8, day: 15 }, end: { month: 8, day: 31 } }     // Independence Day
    ];
    
    return highDemandPeriods.some(period => {
      if (period.start.month <= period.end.month) {
        return (month > period.start.month || (month === period.start.month && day >= period.start.day)) &&
               (month < period.end.month || (month === period.end.month && day <= period.end.day));
      } else {
        // Period crosses year boundary
        return (month > period.start.month || (month === period.start.month && day >= period.start.day)) ||
               (month < period.end.month || (month === period.end.month && day <= period.end.day));
      }
    });
  }
  
  /**
   * Get pricing terms and conditions
   */
  static getPricingTerms(listing) {
    return [
      'Prices are inclusive of all taxes and fees',
      'Deposit is refundable upon successful return',
      'Late return charges may apply as per host policy',
      'Cancellation charges apply as per cancellation policy',
      'Damage charges will be deducted from deposit if applicable'
    ];
  }
  
  /**
   * Calculate bulk pricing for multiple items
   */
  static async calculateBulkPricing(items, options = {}) {
    try {
      const results = [];
      let totalAmount = 0;
      let totalDeposit = 0;
      
      for (const item of items) {
        const pricing = await this.calculateRentalPrice(
          item.listingId,
          item.startDate,
          item.endDate,
          item.quantity,
          {
            ...options,
            skipValidation: true // Skip availability validation for bulk calculation
          }
        );
        
        results.push({
          listingId: item.listingId,
          ...pricing
        });
        
        totalAmount += pricing.breakdown.totalAmount;
        totalDeposit += pricing.breakdown.depositAmount;
      }
      
      // Apply bulk discount if applicable
      if (items.length >= 3) {
        const bulkDiscount = totalAmount * 0.05; // 5% bulk discount
        totalAmount -= bulkDiscount;
        
        results.forEach(result => {
          result.breakdown.bulkDiscount = bulkDiscount / items.length;
          result.breakdown.totalAmount -= result.breakdown.bulkDiscount;
        });
      }
      
      return {
        success: true,
        items: results,
        summary: {
          totalItems: items.length,
          totalAmount,
          totalDeposit,
          avgItemPrice: totalAmount / items.length,
          currency: 'INR'
        }
      };
    } catch (error) {
      logger.error('Bulk pricing calculation failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get historical pricing data for analytics
   */
  static async getPricingAnalytics(listingId, days = 30) {
    try {
      // This would typically query historical booking data
      // For now, returning mock analytics
      
      const analytics = {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        demandScore: 0,
        competitorPrices: [],
        recommendedPrice: 0,
        priceHistory: [],
        bookingRate: 0
      };
      
      return analytics;
    } catch (error) {
      logger.error('Pricing analytics failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Calculate platform revenue from a booking
   */
  static calculatePlatformRevenue(pricing) {
    const revenue = {
      commission: pricing.platformCommission || 0,
      serviceFee: 0,
      processingFee: 0,
      gst: 0,
      total: 0
    };
    
    if (pricing.fees && pricing.fees.breakdown) {
      pricing.fees.breakdown.forEach(fee => {
        switch (fee.type) {
          case 'service_fee':
            revenue.serviceFee = fee.amount;
            break;
          case 'processing_fee':
            revenue.processingFee = fee.amount;
            break;
          case 'gst':
            revenue.gst = fee.amount;
            break;
        }
      });
    }
    
    revenue.total = revenue.commission + revenue.serviceFee + revenue.processingFee + revenue.gst;
    
    return revenue;
  }
}

module.exports = PricingService;
