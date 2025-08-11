const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');
const RentalOrder = require('../src/models/rentalOrder.model');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rental-system';

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await RentalOrder.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create demo accounts
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: 'p@ssw0rd',
      role: 'admin'
    });

    const customerUser = await User.create({
      name: 'Demo Customer',
      email: 'user@demo.com',
      password: 'p@ssw0rd',
      role: 'customer'
    });

    console.log('👥 Created demo users');

    // Create sample products
    const products = await Product.create([
      {
        name: 'Professional Camera',
        description: 'High-quality DSLR camera for photography',
        stock: 3,
        pricing: [
          { unit: 'hour', rate: 25 },
          { unit: 'day', rate: 150 },
          { unit: 'week', rate: 900 }
        ],
        images: ['https://via.placeholder.com/400x300?text=Camera'],
        createdBy: adminUser._id
      },
      {
        name: 'Laptop - MacBook Pro',
        description: 'Apple MacBook Pro 16-inch for development work',
        stock: 2,
        pricing: [
          { unit: 'hour', rate: 15 },
          { unit: 'day', rate: 80 },
          { unit: 'week', rate: 500 }
        ],
        images: ['https://via.placeholder.com/400x300?text=MacBook'],
        createdBy: adminUser._id
      },
      {
        name: 'Projector',
        description: 'HD projector for presentations and events',
        stock: 5,
        pricing: [
          { unit: 'hour', rate: 20 },
          { unit: 'day', rate: 100 },
          { unit: 'week', rate: 600 }
        ],
        images: ['https://via.placeholder.com/400x300?text=Projector'],
        createdBy: adminUser._id
      },
      {
        name: 'Sound System',
        description: 'Professional sound system with microphones',
        stock: 2,
        pricing: [
          { unit: 'hour', rate: 30 },
          { unit: 'day', rate: 200 },
          { unit: 'week', rate: 1200 }
        ],
        images: ['https://via.placeholder.com/400x300?text=Sound+System'],
        createdBy: adminUser._id
      },
      {
        name: 'Drone',
        description: '4K camera drone for aerial photography',
        stock: 1,
        pricing: [
          { unit: 'hour', rate: 50 },
          { unit: 'day', rate: 300 },
          { unit: 'week', rate: 1800 }
        ],
        images: ['https://via.placeholder.com/400x300?text=Drone'],
        createdBy: adminUser._id
      }
    ]);

    console.log('🎬 Created sample products');

    // Create some overlapping orders to demo availability
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    await RentalOrder.create([
      {
        customer: customerUser._id,
        product: products[0]._id, // Camera
        startTime: tomorrow,
        endTime: dayAfterTomorrow,
        totalPrice: 150,
        status: 'confirmed'
      },
      {
        customer: customerUser._id,
        product: products[1]._id, // MacBook
        startTime: now,
        endTime: tomorrow,
        totalPrice: 80,
        status: 'picked_up'
      }
    ]);

    console.log('📋 Created sample rental orders');

    console.log('🎉 Seed data created successfully!');
    console.log('Demo accounts:');
    console.log('  Admin: admin@demo.com / p@ssw0rd');
    console.log('  User: user@demo.com / p@ssw0rd');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
