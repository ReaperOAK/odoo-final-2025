const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup test database
beforeAll(async () => {
  // Use in-memory MongoDB for testing
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up between tests
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Global test utilities
global.createTestUser = async (userData = {}) => {
  const User = require('../src/models/user.model');
  return await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPass123!',
    role: 'customer',
    ...userData
  });
};

global.createTestProduct = async (productData = {}) => {
  const Product = require('../src/models/product.model');
  return await Product.create({
    name: 'Test Product',
    description: 'Test Description',
    stock: 10,
    pricing: [
      { unit: 'hour', rate: 50 },
      { unit: 'day', rate: 400 }
    ],
    ...productData
  });
};

global.createTestRental = async (rentalData = {}) => {
  const RentalOrder = require('../src/models/rentalOrder.model');
  return await RentalOrder.create({
    startTime: new Date('2025-08-15T10:00:00Z'),
    endTime: new Date('2025-08-15T14:00:00Z'),
    totalPrice: 200,
    status: 'confirmed',
    ...rentalData
  });
};
