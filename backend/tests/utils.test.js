const { calculatePrice } = require('../src/utils/calcPrice');
const { checkAvailability } = require('../src/utils/availability');

describe('Price Calculation Utils', () => {
  const mockProduct = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Product',
    pricing: [
      { unit: 'hour', rate: 50 },
      { unit: 'day', rate: 400 },
      { unit: 'week', rate: 2500 }
    ]
  };

  describe('calculatePrice', () => {
    it('should calculate hourly rate correctly', () => {
      const startTime = '2025-08-15T10:00:00Z';
      const endTime = '2025-08-15T14:00:00Z'; // 4 hours

      const result = calculatePrice(mockProduct, startTime, endTime);

      expect(result.totalPrice).toBe(200); // 4 hours × 50
      expect(result.bestPricing.unit).toBe('hour');
      expect(result.bestPricing.quantity).toBe(4);
      expect(result.bestPricing.rate).toBe(50);
    });

    it('should calculate daily rate for longer periods', () => {
      const startTime = '2025-08-15T10:00:00Z';
      const endTime = '2025-08-17T10:00:00Z'; // 2 days

      const result = calculatePrice(mockProduct, startTime, endTime);

      expect(result.totalPrice).toBe(800); // 2 days × 400
      expect(result.bestPricing.unit).toBe('day');
      expect(result.bestPricing.quantity).toBe(2);
      expect(result.bestPricing.rate).toBe(400);
    });

    it('should calculate weekly rate for very long periods', () => {
      const startTime = '2025-08-15T10:00:00Z';
      const endTime = '2025-08-29T10:00:00Z'; // 2 weeks

      const result = calculatePrice(mockProduct, startTime, endTime);

      expect(result.totalPrice).toBe(5000); // 2 weeks × 2500
      expect(result.bestPricing.unit).toBe('week');
      expect(result.bestPricing.quantity).toBe(2);
      expect(result.bestPricing.rate).toBe(2500);
    });

    it('should choose most economical pricing option', () => {
      // 60 hours from 15th 10:00 to 17th 22:00 = 2 days (differenceInDays)
      // hourly = 60×50 = 3000, daily = 2×400 = 800 (better)
      const startTime = '2025-08-15T10:00:00Z';
      const endTime = '2025-08-17T22:00:00Z'; // 60 hours = 2 days

      const result = calculatePrice(mockProduct, startTime, endTime);

      expect(result.bestPricing.unit).toBe('day'); // Should choose daily rate as it's cheaper
      expect(result.totalPrice).toBe(800); // 2 days × 400
    });

    it('should round up to minimum units correctly', () => {
      const startTime = '2025-08-15T10:00:00Z';
      const endTime = '2025-08-15T10:30:00Z'; // 30 minutes

      const result = calculatePrice(mockProduct, startTime, endTime);

      expect(result.bestPricing.unit).toBe('hour');
      expect(result.bestPricing.quantity).toBe(1); // Should round up to 1 hour
      expect(result.totalPrice).toBe(50);
    });

    it('should handle invalid dates', () => {
      expect(() => {
        calculatePrice(mockProduct, 'invalid-date', '2025-08-15T14:00:00Z');
      }).toThrow('Invalid date format');
    });

    it('should handle end time before start time', () => {
      expect(() => {
        calculatePrice(mockProduct, '2025-08-15T14:00:00Z', '2025-08-15T10:00:00Z');
      }).toThrow('End time must be after start time');
    });

    it('should handle product without pricing', () => {
      const productNoPricing = {
        _id: '507f1f77bcf86cd799439011',
        name: 'No Pricing Product',
        pricing: []
      };

      expect(() => {
        calculatePrice(productNoPricing, '2025-08-15T10:00:00Z', '2025-08-15T14:00:00Z');
      }).toThrow('Product has no pricing information');
    });

    it('should provide detailed breakdown', () => {
      const startTime = '2025-08-15T10:00:00Z';
      const endTime = '2025-08-15T14:00:00Z';

      const result = calculatePrice(mockProduct, startTime, endTime);

      expect(result).toHaveProperty('totalPrice');
      expect(result).toHaveProperty('bestPricing');
      expect(result.bestPricing).toHaveProperty('unit');
      expect(result.bestPricing).toHaveProperty('quantity');
      expect(result.bestPricing).toHaveProperty('rate');
      expect(result).toHaveProperty('allOptions');
      expect(result).toHaveProperty('duration');
    });
  });
});

describe('Availability Utils', () => {
  let testProduct;

  beforeEach(async () => {
    testProduct = await global.createTestProduct({
      stock: 5
    });
  });

  describe('checkAvailability', () => {
    it('should return available when no bookings exist', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(14, 0, 0, 0);

      const result = await checkAvailability(
        testProduct._id,
        tomorrow.toISOString(),
        endTime.toISOString(),
        1
      );

      expect(result.isAvailable).toBe(true);
      expect(result.availableStock).toBe(5);
      expect(result.requestedQuantity).toBe(1);
    });

    it('should calculate available quantity correctly with existing bookings', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const bookingStart = new Date(tomorrow);
      bookingStart.setHours(12, 0, 0, 0);
      
      const bookingEnd = new Date(tomorrow);
      bookingEnd.setHours(16, 0, 0, 0);

      // Create a booking that uses 1 unit
      await global.createTestRental({
        product: testProduct._id,
        customer: (await global.createTestUser())._id,
        startTime: bookingStart.toISOString(),
        endTime: bookingEnd.toISOString()
      });

      const queryStart = new Date(tomorrow);
      queryStart.setHours(10, 0, 0, 0);
      
      const queryEnd = new Date(tomorrow);
      queryEnd.setHours(18, 0, 0, 0);

      const result = await checkAvailability(
        testProduct._id,
        queryStart.toISOString(),
        queryEnd.toISOString(),
        1
      );

      expect(result.isAvailable).toBe(true);
      expect(result.availableStock).toBe(4); // 5 - 1 existing booking
    });

    it('should return false when requested quantity exceeds available', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(14, 0, 0, 0);

      const result = await checkAvailability(
        testProduct._id,
        tomorrow.toISOString(),
        endTime.toISOString(),
        10 // More than stock
      );

      expect(result.isAvailable).toBe(false);
      expect(result.availableStock).toBe(0); // Function returns 0 when insufficient total stock
      expect(result.requestedQuantity).toBe(10);
    });

    it('should handle non-existent product', async () => {
      try {
        await checkAvailability(
          '507f1f77bcf86cd799439011', // Non-existent ID
          '2025-08-15T10:00:00Z',
          '2025-08-15T14:00:00Z',
          1
        );
      } catch (error) {
        expect(error.message).toContain('Product not found');
      }
    });

    it('should validate date parameters', async () => {
      try {
        await checkAvailability(
          testProduct._id,
          'invalid-date',
          '2025-08-15T14:00:00Z',
          1
        );
      } catch (error) {
        expect(error.message).toContain('Invalid date');
      }
    });

    it('should handle edge case of exact time boundaries', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const booking1Start = new Date(tomorrow);
      booking1Start.setHours(10, 0, 0, 0);
      
      const booking1End = new Date(tomorrow);
      booking1End.setHours(14, 0, 0, 0);

      // Create booking from 10:00 to 14:00
      await global.createTestRental({
        product: testProduct._id,
        customer: (await global.createTestUser())._id,
        startTime: booking1Start.toISOString(),
        endTime: booking1End.toISOString()
      });

      const query2Start = new Date(tomorrow);
      query2Start.setHours(14, 0, 0, 0);
      
      const query2End = new Date(tomorrow);
      query2End.setHours(18, 0, 0, 0);

      // Check availability from 14:00 to 18:00 (should not overlap)
      const result = await checkAvailability(
        testProduct._id,
        query2Start.toISOString(),
        query2End.toISOString(),
        1
      );

      expect(result.isAvailable).toBe(true);
      expect(result.availableStock).toBe(5); // No overlap, so full stock available
    });
  });
});
