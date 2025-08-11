require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');
const RentalOrder = require('../src/models/rentalOrder.model');
const { calculatePrice } = require('../src/utils/calcPrice');

// Color coding for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    log(`✅ MongoDB Connected: ${conn.connection.host}`, 'green');
  } catch (error) {
    log(`❌ MongoDB Connection Error: ${error.message}`, 'red');
    process.exit(1);
  }
};

/**
 * Clear existing data
 */
const clearData = async () => {
  try {
    log('🧹 Clearing existing data...', 'yellow');
    
    await Promise.all([
      RentalOrder.deleteMany({}),
      Product.deleteMany({}),
      User.deleteMany({})
    ]);
    
    log('✅ Existing data cleared', 'green');
  } catch (error) {
    log(`❌ Error clearing data: ${error.message}`, 'red');
    throw error;
  }
};

/**
 * Create demo users
 */
const createUsers = async () => {
  try {
    log('👥 Creating demo users...', 'blue');
    
    const users = [
      // Demo admin accounts
      {
        name: 'Admin Demo',
        email: 'admin@demo.com',
        password: 'p@ssw0rd',
        role: 'admin'
      },
      {
        name: 'Sarah Admin',
        email: 'sarah.admin@demo.com',
        password: 'p@ssw0rd',
        role: 'admin'
      },
      
      // Demo customer accounts
      {
        name: 'John Customer',
        email: 'user@demo.com',
        password: 'p@ssw0rd',
        role: 'customer'
      },
      {
        name: 'Emma Wilson',
        email: 'emma@demo.com',
        password: 'p@ssw0rd',
        role: 'customer'
      },
      {
        name: 'Michael Johnson',
        email: 'michael@demo.com',
        password: 'p@ssw0rd',
        role: 'customer'
      },
      {
        name: 'Lisa Davis',
        email: 'lisa@demo.com',
        password: 'p@ssw0rd',
        role: 'customer'
      }
    ];

    const createdUsers = await User.create(users);
    log(`✅ Created ${createdUsers.length} users`, 'green');
    
    return createdUsers;
  } catch (error) {
    log(`❌ Error creating users: ${error.message}`, 'red');
    throw error;
  }
};

/**
 * Create demo products with various pricing strategies
 */
const createProducts = async (users) => {
  try {
    log('📦 Creating demo products...', 'blue');
    
    const adminUser = users.find(u => u.role === 'admin');
    
    const products = [
      {
        name: 'Professional Camera Kit',
        description: 'Complete photography kit with DSLR camera, lenses, tripod, and lighting equipment. Perfect for events, portraits, and professional shoots.',
        stock: 3,
        pricing: [
          { unit: 'hour', rate: 25 },
          { unit: 'day', rate: 150 },
          { unit: 'week', rate: 800 }
        ],
        images: [
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500',
          'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500'
        ],
        createdBy: adminUser._id
      },
      {
        name: 'Gaming Laptop - High Performance',
        description: 'Top-tier gaming laptop with RTX 4080, 32GB RAM, and 1TB SSD. Ideal for gaming, streaming, and content creation.',
        stock: 2,
        pricing: [
          { unit: 'hour', rate: 15 },
          { unit: 'day', rate: 80 },
          { unit: 'week', rate: 400 }
        ],
        images: [
          'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500',
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500'
        ],
        createdBy: adminUser._id
      },
      {
        name: 'Electric Scooter',
        description: 'Eco-friendly electric scooter with 50km range. Perfect for city commuting and short trips.',
        stock: 5,
        pricing: [
          { unit: 'hour', rate: 8 },
          { unit: 'day', rate: 35 },
          { unit: 'week', rate: 200 }
        ],
        images: [
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500',
          'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500'
        ],
        createdBy: adminUser._id
      },
      {
        name: 'Power Tools Set',
        description: 'Complete power tools collection including drill, saw, grinder, and accessories. Everything you need for DIY projects.',
        stock: 4,
        pricing: [
          { unit: 'hour', rate: 12 },
          { unit: 'day', rate: 45 },
          { unit: 'week', rate: 250 }
        ],
        images: [
          'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500',
          'https://images.unsplash.com/photo-1504148455328-fc74d5d6b0b2?w=500'
        ],
        createdBy: adminUser._id
      },
      {
        name: 'Projector & Sound System',
        description: '4K projector with premium sound system and 120-inch screen. Perfect for presentations, movies, and events.',
        stock: 2,
        pricing: [
          { unit: 'hour', rate: 30 },
          { unit: 'day', rate: 120 },
          { unit: 'week', rate: 650 }
        ],
        images: [
          'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500',
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500'
        ],
        createdBy: adminUser._id
      },
      {
        name: 'Camping Gear Bundle',
        description: 'Complete camping setup: 4-person tent, sleeping bags, portable stove, lanterns, and outdoor accessories.',
        stock: 3,
        pricing: [
          { unit: 'day', rate: 60 },
          { unit: 'week', rate: 300 }
        ],
        images: [
          'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=500',
          'https://images.unsplash.com/photo-1510312305653-8ed496efaed8?w=500'
        ],
        createdBy: adminUser._id
      },
      {
        name: 'Party Speaker System',
        description: 'High-quality wireless speaker system with subwoofer, microphones, and disco lights. Perfect for parties and events.',
        stock: 4,
        pricing: [
          { unit: 'hour', rate: 20 },
          { unit: 'day', rate: 75 },
          { unit: 'week', rate: 350 }
        ],
        images: [
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500'
        ],
        createdBy: adminUser._id
      }
    ];

    const createdProducts = await Product.create(products);
    log(`✅ Created ${createdProducts.length} products`, 'green');
    
    return createdProducts;
  } catch (error) {
    log(`❌ Error creating products: ${error.message}`, 'red');
    throw error;
  }
};

/**
 * Create demo rental orders with various statuses and scenarios
 */
const createRentals = async (users, products) => {
  try {
    log('📋 Creating demo rental orders...', 'blue');
    
    const customers = users.filter(u => u.role === 'customer');
    const now = new Date();
    
    const rentals = [];
    
    // Create various rental scenarios
    const scenarios = [
      // Active confirmed bookings (future)
      {
        customer: customers[0]._id,
        product: products[0]._id, // Camera Kit
        startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        status: 'confirmed'
      },
      {
        customer: customers[1]._id,
        product: products[1]._id, // Gaming Laptop
        startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'confirmed'
      },
      
      // Currently picked up items
      {
        customer: customers[2]._id,
        product: products[2]._id, // Electric Scooter
        startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        status: 'picked_up'
      },
      {
        customer: customers[3]._id,
        product: products[3]._id, // Power Tools
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
        status: 'picked_up'
      },
      
      // Overdue rentals (for late fee demonstration)
      {
        customer: customers[0]._id,
        product: products[4]._id, // Projector
        startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
        status: 'picked_up'
      },
      
      // Completed rentals
      {
        customer: customers[1]._id,
        product: products[5]._id, // Camping Gear
        startTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        endTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: 'returned',
        lateFee: 0
      },
      {
        customer: customers[2]._id,
        product: products[6]._id, // Speaker System
        startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endTime: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        status: 'returned',
        lateFee: 15 // Late return
      },
      
      // Cancelled booking
      {
        customer: customers[3]._id,
        product: products[0]._id, // Camera Kit
        startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'cancelled'
      },
      
      // Overlapping bookings to test availability (different time slots for same product)
      {
        customer: customers[1]._id,
        product: products[0]._id, // Camera Kit (already booked above)
        startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        status: 'confirmed'
      },
      
      // More future bookings for demonstration
      {
        customer: customers[2]._id,
        product: products[2]._id, // Electric Scooter
        startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endTime: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        status: 'confirmed'
      }
    ];
    
    // Calculate prices and create rentals
    for (const rentalData of scenarios) {
      try {
        const product = products.find(p => p._id.equals(rentalData.product));
        if (product) {
          const priceResult = calculatePrice(product, rentalData.startTime, rentalData.endTime);
          
          const rental = {
            ...rentalData,
            totalPrice: priceResult.totalPrice
          };
          
          rentals.push(rental);
        }
      } catch (error) {
        log(`⚠️  Warning: Could not calculate price for rental: ${error.message}`, 'yellow');
      }
    }
    
    const createdRentals = await RentalOrder.create(rentals);
    log(`✅ Created ${createdRentals.length} rental orders`, 'green');
    
    return createdRentals;
  } catch (error) {
    log(`❌ Error creating rentals: ${error.message}`, 'red');
    throw error;
  }
};

/**
 * Display seed summary
 */
const displaySummary = async (users, products, rentals) => {
  log('\n📊 SEED SUMMARY', 'cyan');
  log('================', 'cyan');
  
  const adminUsers = users.filter(u => u.role === 'admin');
  const customerUsers = users.filter(u => u.role === 'customer');
  
  log(`👥 Users: ${users.length} total`, 'blue');
  log(`   - Admins: ${adminUsers.length}`, 'blue');
  log(`   - Customers: ${customerUsers.length}`, 'blue');
  
  log(`\n📦 Products: ${products.length} total`, 'blue');
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  log(`   - Total stock units: ${totalStock}`, 'blue');
  
  log(`\n📋 Rentals: ${rentals.length} total`, 'blue');
  const statusCounts = rentals.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    log(`   - ${status}: ${count}`, 'blue');
  });
  
  const totalRevenue = rentals
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.totalPrice, 0);
  log(`   - Total revenue: $${totalRevenue.toFixed(2)}`, 'blue');
  
  log('\n🔑 DEMO ACCOUNTS', 'cyan');
  log('================', 'cyan');
  log('Admin Account:', 'green');
  log('  Email: admin@demo.com', 'green');
  log('  Password: p@ssw0rd', 'green');
  log('\nCustomer Account:', 'green');
  log('  Email: user@demo.com', 'green');
  log('  Password: p@ssw0rd', 'green');
  
  log('\n🚀 DEMO SCENARIOS', 'cyan');
  log('==================', 'cyan');
  log('✅ Active bookings (confirmed and picked up)', 'yellow');
  log('✅ Overdue rentals (for late fee testing)', 'yellow');
  log('✅ Completed rentals with history', 'yellow');
  log('✅ Cancelled bookings', 'yellow');
  log('✅ Overlapping time slots (availability testing)', 'yellow');
  log('✅ Various pricing models (hour/day/week)', 'yellow');
  
  log('\n💡 TESTING TIPS', 'cyan');
  log('================', 'cyan');
  log('🎯 Try booking Camera Kit for overlapping dates', 'yellow');
  log('🎯 Check availability for Electric Scooter (multiple available)', 'yellow');
  log('🎯 Test admin functions: update rental status', 'yellow');
  log('🎯 View overdue rentals and late fees', 'yellow');
  log('🎯 Test concurrent booking creation', 'yellow');
};

/**
 * Main seed function
 */
const seedDatabase = async () => {
  try {
    log('🌱 Starting database seeding...', 'cyan');
    log('================================', 'cyan');
    
    await connectDB();
    await clearData();
    
    const users = await createUsers();
    const products = await createProducts(users);
    const rentals = await createRentals(users, products);
    
    await displaySummary(users, products, rentals);
    
    log('\n✅ Database seeding completed successfully!', 'green');
    log('🎉 Ready for demo and testing!', 'green');
    
  } catch (error) {
    log(`\n❌ Seeding failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log('\n📴 Database connection closed', 'blue');
  }
};

// Run the seed script
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
