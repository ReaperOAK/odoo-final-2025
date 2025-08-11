const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

describe('Rental Controller', () => {
  let testUser, testAdmin, testProduct, authToken, adminToken;

  beforeEach(async () => {
    // Create test users
    testUser = await global.createTestUser({
      email: 'user@example.com',
      role: 'customer'
    });

    testAdmin = await global.createTestUser({
      email: 'admin@example.com',
      role: 'admin'
    });

    // Create test product
    testProduct = await global.createTestProduct({
      name: 'Test Equipment',
      stock: 5,
      pricing: [
        { unit: 'hour', rate: 50 },
        { unit: 'day', rate: 400 }
      ]
    });

    // Generate auth tokens
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: testAdmin._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/rentals/check-availability', () => {
    it('should check availability successfully', async () => {
      const availabilityData = {
        productId: testProduct._id,
        startTime: '2025-08-15T10:00:00Z',
        endTime: '2025-08-15T14:00:00Z',
        qty: 1
      };

      const response = await request(app)
        .post('/api/rentals/check-availability')
        .send(availabilityData)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.data.isAvailable).toBe(true);
      expect(response.body.data.availableStock).toBe(5);
    });

    it('should reject invalid date range', async () => {
      const availabilityData = {
        productId: testProduct._id,
        startTime: '2025-08-15T14:00:00Z',
        endTime: '2025-08-15T10:00:00Z', // End before start
        qty: 1
      };

      const response = await request(app)
        .post('/api/rentals/check-availability')
        .send(availabilityData)
        .expect(400);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return false for non-existent product', async () => {
      const availabilityData = {
        productId: '507f1f77bcf86cd799439011', // Valid ObjectId but non-existent
        startTime: '2025-08-15T10:00:00Z',
        endTime: '2025-08-15T14:00:00Z',
        qty: 1
      };

      const response = await request(app)
        .post('/api/rentals/check-availability')
        .send(availabilityData)
        .expect(404);

      expect(response.body.error).toBe(true);
    });
  });

  describe('POST /api/rentals/calculate-price', () => {
    it('should calculate price correctly for hourly rental', async () => {
      const priceData = {
        productId: testProduct._id,
        startTime: '2025-08-15T10:00:00Z',
        endTime: '2025-08-15T14:00:00Z' // 4 hours
      };

      const response = await request(app)
        .post('/api/rentals/calculate-price')
        .send(priceData)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.data.totalPrice).toBe(200); // 4 hours × 50
      expect(response.body.data.bestPricing.unit).toBe('hour');
      expect(response.body.data.bestPricing.quantity).toBe(4);
    });

    it('should calculate price correctly for daily rental', async () => {
      const priceData = {
        productId: testProduct._id,
        startTime: '2025-08-15T10:00:00Z',
        endTime: '2025-08-17T10:00:00Z' // 2 days
      };

      const response = await request(app)
        .post('/api/rentals/calculate-price')
        .send(priceData)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.data.totalPrice).toBe(800); // 2 days × 400
      expect(response.body.data.bestPricing.unit).toBe('day');
    });
  });

  describe('POST /api/rentals/create', () => {
    it('should create booking successfully', async () => {
      const bookingData = {
        productId: testProduct._id,
        startTime: '2025-08-15T10:00:00Z',
        endTime: '2025-08-15T14:00:00Z',
        qty: 1
      };

      const response = await request(app)
        .post('/api/rentals/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData)
        .expect(201);

      expect(response.body.error).toBe(false);
      expect(response.body.data.customer._id).toBe(testUser._id.toString());
      expect(response.body.data.product._id).toBe(testProduct._id.toString());
      expect(response.body.data.status).toBe('confirmed');
      expect(response.body.data.totalPrice).toBeDefined();
    });

    it('should reject booking without authentication', async () => {
      const bookingData = {
        productId: testProduct._id,
        startTime: '2025-08-15T10:00:00Z',
        endTime: '2025-08-15T14:00:00Z',
        qty: 1
      };

      const response = await request(app)
        .post('/api/rentals/create')
        .send(bookingData)
        .expect(401);

      expect(response.body.error).toBe(true);
    });

    it('should prevent overbooking', async () => {
      // Create first booking that uses all stock
      const bookingData = {
        productId: testProduct._id,
        startTime: '2025-08-15T10:00:00Z',
        endTime: '2025-08-15T14:00:00Z',
        qty: 5 // All available stock
      };

      await request(app)
        .post('/api/rentals/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData)
        .expect(201);

      // Try to create overlapping booking
      const conflictingBooking = {
        productId: testProduct._id,
        startTime: '2025-08-15T12:00:00Z', // Overlaps with previous booking
        endTime: '2025-08-15T16:00:00Z',
        qty: 1
      };

      const response = await request(app)
        .post('/api/rentals/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conflictingBooking)
        .expect(409);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('not available');
    });
  });

  describe('GET /api/rentals', () => {
    beforeEach(async () => {
      // Create test rental orders
      await global.createTestRental({
        customer: testUser._id,
        product: testProduct._id,
        status: 'confirmed'
      });

      await global.createTestRental({
        customer: testUser._id,
        product: testProduct._id,
        status: 'picked_up'
      });
    });

    it('should get user rentals successfully', async () => {
      const response = await request(app)
        .get('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should get all rentals for admin', async () => {
      const response = await request(app)
        .get('/api/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter rentals by status', async () => {
      const response = await request(app)
        .get('/api/rentals?status=confirmed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('confirmed');
    });

    it('should paginate rentals correctly', async () => {
      const response = await request(app)
        .get('/api/rentals?limit=1&page=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.page).toBe(1);
    });
  });
});
