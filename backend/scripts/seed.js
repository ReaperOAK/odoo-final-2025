require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');
const RentalOrder = require('../src/models/rentalOrder.model');
const Listing = require('../src/models/listing.model');
const Order = require('../src/models/order.model');
const Reservation = require('../src/models/reservation.model');
const Payment = require('../src/models/payment.model');
const Payout = require('../src/models/payout.model');

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
      User.deleteMany({}),
      Listing.deleteMany({}),
      Order.deleteMany({}),
      Reservation.deleteMany({}),
      Payment.deleteMany({}),
      Payout.deleteMany({})
    ]);

    log('✅ Existing data cleared', 'green');
  } catch (error) {
    log(`❌ Error clearing data: ${error.message}`, 'red');
    throw error;
  }
};

/**
 * Create demo users for P2P marketplace
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
        role: 'admin',
        isVerified: true,
        phone: '+91-9876543210',
        address: {
          street: '123 Admin Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          zipCode: '400001'
        }
      },
      {
        name: 'Sarah Admin',
        email: 'sarah.admin@demo.com',
        password: 'p@ssw0rd',
        role: 'admin',
        isVerified: true,
        phone: '+91-9876543211',
        address: {
          street: '456 Central Avenue',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          zipCode: '110001'
        }
      },

      // P2P Users - Everyone can lend and borrow
      {
        name: 'Raj Singh',
        email: 'raj@demo.com',
        password: 'p@ssw0rd',
        role: 'user',
        profile: {
          displayName: 'Raj\'s Camera Equipment',
          phone: '+91-9876543212',
          address: '789 Photography Street, Bangalore, Karnataka, India, 560001',
          bio: 'Professional photography equipment for rent. High-quality cameras, lenses, and accessories.',
          verified: true
        },
        lenderStats: {
          rating: 4.8,
          totalRatings: 27,
          completedRentals: 127,
          totalListings: 6,
          activeListings: 4,
          totalEarnings: 85000
        },
        walletBalance: 5000
      },
      {
        name: 'Priya Sharma',
        email: 'priya@demo.com',
        password: 'p@ssw0rd',
        role: 'user',
        profile: {
          displayName: 'Priya\'s Event Equipment',
          phone: '+91-9876543213',
          address: '321 Events Plaza, Pune, Maharashtra, India, 411001',
          bio: 'Complete event equipment rental - sound systems, projectors, lighting, and party supplies.',
          verified: true
        },
        lenderStats: {
          rating: 4.9,
          totalRatings: 35,
          completedRentals: 89,
          totalListings: 8,
          activeListings: 6,
          totalEarnings: 120000
        },
        walletBalance: 7500
      },
      {
        name: 'Arjun Patel',
        email: 'arjun@demo.com',
        password: 'p@ssw0rd',
        role: 'user',
        profile: {
          displayName: 'Arjun\'s Sports Gear',
          phone: '+91-9876543214',
          address: '654 Sports Complex, Ahmedabad, Gujarat, India, 380001',
          bio: 'Sports equipment for all outdoor activities - bikes, camping gear, sports equipment.',
          verified: true
        },
        lenderStats: {
          rating: 4.7,
          totalRatings: 22,
          completedRentals: 156,
          totalListings: 5,
          activeListings: 3,
          totalEarnings: 65000
        },
        walletBalance: 3200
      },

      // Regular P2P users (can become lenders when they create listings)
      {
        name: 'John Wilson',
        email: 'user@demo.com',
        password: 'p@ssw0rd',
        role: 'user',
        profile: {
          phone: '+91-9876543215',
          address: '111 Wilson Lane, Chennai, Tamil Nadu, India, 600001',
          verified: true
        },
        borrowerStats: {
          rating: 4.5,
          totalRatings: 8,
          completedRentals: 12,
          trustScore: 95,
          totalSpent: 15000
        },
        walletBalance: 1500
      },
      {
        name: 'Emma Johnson',
        email: 'emma@demo.com',
        password: 'p@ssw0rd',
        role: 'user',
        profile: {
          phone: '+91-9876543216',
          address: '222 Johnson Street, Hyderabad, Telangana, India, 500001',
          verified: true
        },
        borrowerStats: {
          rating: 4.6,
          totalRatings: 5,
          completedRentals: 7,
          trustScore: 98,
          totalSpent: 8500
        },
        walletBalance: 2000
      },
      {
        name: 'Michael Davis',
        email: 'michael@demo.com',
        password: 'p@ssw0rd',
        role: 'user',
        profile: {
          phone: '+91-9876543217',
          address: '333 Davis Avenue, Kolkata, West Bengal, India, 700001',
          verified: true
        },
        borrowerStats: {
          rating: 4.8,
          totalRatings: 3,
          completedRentals: 5,
          trustScore: 100,
          totalSpent: 12000
        },
        walletBalance: 800
      },
      {
        name: 'Lisa Kumar',
        email: 'lisa@demo.com',
        password: 'p@ssw0rd',
        role: 'user',
        profile: {
          phone: '+91-9876543218',
          address: '444 Kumar Road, Jaipur, Rajasthan, India, 302001',
          verified: true
        },
        borrowerStats: {
          rating: 4.7,
          totalRatings: 6,
          completedRentals: 9,
          trustScore: 92,
          totalSpent: 18500
        },
        walletBalance: 1200
      }
    ];

    // Don't hash passwords manually - let the User model's pre-save hook handle it
    // for (let user of users) {
    //   user.password = await bcrypt.hash(user.password, 12);
    // }

    const createdUsers = await User.create(users);
    log(`✅ Created ${createdUsers.length} users`, 'green');

    return createdUsers;
  } catch (error) {
    log(`❌ Error creating users: ${error.message}`, 'red');
    throw error;
  }
};

/**
 * Create demo listings for P2P marketplace
 */
const createListings = async (users) => {
  try {
    log('🏪 Creating demo listings...', 'blue');

    // Get lender users (users with active lending stats)
    const lenders = users.filter(u => u.lenderStats && u.lenderStats.totalListings > 0);
    
    log(`📊 Debug: Found ${lenders.length} lenders out of ${users.length} total users`, 'yellow');
    if (lenders.length === 0) {
      log('⚠️  No established lenders found, using users with lender stats for listings', 'yellow');
      // Fallback to users who have lenderStats (even if they haven't created listings yet)
      const usersWithLenderStats = users.filter(u => u.lenderStats);
      if (usersWithLenderStats.length >= 3) {
        lenders.push(...usersWithLenderStats.slice(0, 3));
      }
    }

    const listings = [
      // Raj's Camera Equipment
      {
        ownerId: lenders[0]._id, // Raj Singh
        title: 'Canon EOS R5 Professional Camera Kit',
        description: 'Complete professional photography kit including Canon EOS R5 body, 24-70mm f/2.8L lens, 70-200mm f/2.8L lens, professional tripod, studio lighting kit, and camera bag. Perfect for weddings, events, and professional shoots.',
        category: 'photography',
        unitType: 'day',
        basePrice: 2500,
        depositType: 'percent',
        depositValue: 25,
        totalQuantity: 2,
        location: {
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          pincode: '560001'
        },
        status: 'published',
        images: [
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd.jpg',
          'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a.jpg',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32.jpg'
        ],
        specifications: {
          brand: 'Canon',
          model: 'EOS R5',
          condition: 'excellent',
          year: 2023
        },
        policies: {
          cancellationPolicy: 'flexible',
          pickupInstructions: 'Available for pickup from 9 AM to 8 PM',
          damagePolicy: 'Security deposit will be used for repairs if damaged'
        },
        ratings: {
          average: 4.9,
          count: 15
        },
        bookingCount: 18,
        viewCount: 245
      },
      {
        ownerId: lenders[0]._id, // Raj Singh
        title: 'Sony A7S III Video Camera Setup',
        description: 'Professional video production kit with Sony A7S III, Rode microphones, DJI Ronin gimbal, LED lighting panels, and 4K monitor. Ideal for video production, documentaries, and content creation.',
        category: 'photography',
        unitType: 'day',
        basePrice: 3200,
        depositType: 'percent',
        depositValue: 30,
        totalQuantity: 1,
        location: {
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          pincode: '560001'
        },
        status: 'published',
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32.jpg',
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4.jpg'
        ],
        specifications: {
          brand: 'Sony',
          model: 'A7S III',
          condition: 'excellent',
          year: 2023
        },
        policies: {
          cancellationPolicy: 'moderate'
        },
        ratings: {
          average: 4.8,
          count: 9
        },
        bookingCount: 12,
        viewCount: 189
      },

      // Priya's Event Equipment
      {
        ownerId: lenders[1]._id, // Priya Sharma
        title: 'Professional Sound System - 1000W',
        description: 'High-quality sound system perfect for weddings, parties, and corporate events. Includes main speakers, subwoofer, mixer, wireless microphones, and all cables. Can accommodate up to 300 people.',
        category: 'music',
        unitType: 'day',
        basePrice: 1800,
        depositType: 'percent',
        depositValue: 20,
        totalQuantity: 3,
        location: {
          city: 'Pune',
          state: 'Maharashtra',
          country: 'India',
          pincode: '411001'
        },
        status: 'published',
        images: [
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1.jpg',
          'https://images.unsplash.com/photo-1545454675-3531b543be5d.jpg'
        ],
        specifications: {
          condition: 'excellent'
        },
        policies: {
          cancellationPolicy: 'moderate'
        },
        ratings: {
          average: 4.9,
          count: 24
        },
        bookingCount: 28,
        viewCount: 356
      },
      {
        ownerId: lenders[1]._id, // Priya Sharma
        title: '4K Projector with 120" Screen',
        description: 'Professional 4K projector with 120-inch portable screen, perfect for presentations, movies, and events. Includes HDMI cables, wireless connectivity, and remote control.',
        category: 'electronics',
        unitType: 'day',
        basePrice: 1200,
        depositType: 'flat',
        depositValue: 5000,
        totalQuantity: 2,
        location: {
          city: 'Pune',
          state: 'Maharashtra',
          country: 'India',
          pincode: '411001'
        },
        status: 'published',
        images: [
          'https://images.unsplash.com/photo-1478720568477-152d9b164e26.jpg',
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f.jpg'
        ],
        specifications: {
          condition: 'excellent'
        },
        policies: {
          cancellationPolicy: 'strict'
        },
        ratings: {
          average: 4.7,
          count: 18
        },
        bookingCount: 22,
        viewCount: 278
      },
      {
        ownerId: lenders[1]._id, // Priya Sharma
        title: 'LED Stage Lighting Kit',
        description: 'Professional LED stage lighting setup with colorful spotlights, moving heads, strobe lights, and DMX controller. Perfect for parties, concerts, and special events.',
        category: 'electronics',
        unitType: 'day',
        basePrice: 2000,
        depositType: 'percent',
        depositValue: 25,
        totalQuantity: 2,
        location: {
          city: 'Pune',
          state: 'Maharashtra',
          country: 'India',
          pincode: '411001'
        },
        status: 'published',
        images: [
          'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e.jpg',
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f.jpg'
        ],
        specifications: {
          condition: 'excellent'
        },
        policies: {
          cancellationPolicy: 'moderate'
        },
        ratings: {
          average: 4.8,
          count: 12
        },
        bookingCount: 15,
        viewCount: 198
      },

      // Arjun's Sports Equipment
      {
        ownerId: lenders[2]._id, // Arjun Patel
        title: 'Trek Mountain Bike - Full Suspension',
        description: 'High-end Trek mountain bike with full suspension, perfect for trails and adventure sports. Includes safety gear (helmet, knee pads), bike lock, and maintenance kit.',
        category: 'sports',
        unitType: 'day',
        basePrice: 800,
        depositType: 'percent',
        depositValue: 30,
        totalQuantity: 5,
        location: {
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          pincode: '380001'
        },
        status: 'published',
        images: [
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13.jpg',
          'https://images.unsplash.com/photo-1502744688674-c619d1586c9e.jpg'
        ],
        specifications: {
          brand: 'Trek',
          condition: 'excellent'
        },
        policies: {
          cancellationPolicy: 'flexible'
        },
        ratings: {
          average: 4.9,
          count: 52
        },
        bookingCount: 67,
        viewCount: 445
      },
      {
        ownerId: lenders[2]._id, // Arjun Patel
        title: 'Complete Camping Gear Set',
        description: 'Everything you need for camping: 4-person tent, sleeping bags, portable stove, camping chairs, lanterns, cooler, and outdoor cooking utensils. Perfect for weekend getaways.',
        category: 'outdoor',
        unitType: 'day',
        basePrice: 1500,
        depositType: 'percent',
        depositValue: 20,
        totalQuantity: 3,
        location: {
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          pincode: '380001'
        },
        status: 'published',
        images: [
          'https://images.unsplash.com/photo-1504851149312-7a075b496cc7.jpg',
          'https://images.unsplash.com/photo-1510312305653-8ed496efaed8.jpg'
        ],
        specifications: {
          condition: 'good'
        },
        policies: {
          cancellationPolicy: 'moderate'
        },
        ratings: {
          average: 4.7,
          count: 28
        },
        bookingCount: 34,
        viewCount: 523
      },
      {
        ownerId: lenders[2]._id, // Arjun Patel
        title: 'Power Tools Professional Set',
        description: 'Complete power tools collection including cordless drill, circular saw, angle grinder, impact driver, and tool bag. Perfect for DIY projects and professional work.',
        category: 'tools',
        unitType: 'day',
        basePrice: 900,
        depositType: 'flat',
        depositValue: 3000,
        totalQuantity: 4,
        location: {
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          pincode: '380001'
        },
        status: 'published',
        images: [
          'https://images.unsplash.com/photo-1530124566582-a618bc2615dc.jpg',
          'https://images.unsplash.com/photo-1504148455328-fc74d5d6b0b2.jpg'
        ],
        specifications: {
          brand: 'Bosch Professional',
          condition: 'excellent'
        },
        policies: {
          cancellationPolicy: 'strict'
        },
        ratings: {
          average: 4.6,
          count: 16
        },
        bookingCount: 19,
        viewCount: 234
      }
    ];

    const createdListings = await Listing.create(listings);
    log(`✅ Created ${createdListings.length} listings`, 'green');

    return createdListings;
  } catch (error) {
    log(`❌ Error creating listings: ${error.message}`, 'red');
    throw error;
  }
};

/**
 * Create demo orders and reservations
 */
const createOrdersAndReservations = async (users, listings) => {
  try {
    log('📋 Creating demo orders and reservations...', 'blue');

    // Safely filter borrowers and lenders
    const borrowers = users.filter(u => u.role === 'user' && u.borrowerStats);
    const lenders = users.filter(u => u.lenderStats);

    log(`📊 Found ${borrowers.length} borrowers and ${lenders.length} lenders`, 'blue');

    if (borrowers.length === 0 || lenders.length === 0) {
      log('⚠️  Warning: Insufficient borrowers or lenders found, creating minimal demo data', 'yellow');
      return { orders: [], reservations: [], payments: [] };
    }
    const now = new Date();

    const orders = [];
    const reservations = [];
    const payments = [];

    // Create various order scenarios
    const orderScenarios = [
      // Future confirmed bookings
      {
        customerId: borrowers[0]._id,
        lenderId: lenders[0]._id,
        listingId: listings[0]._id, // Canon Camera Kit
        quantity: 1,
        startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        status: 'confirmed',
        paymentStatus: 'completed'
      },
      {
        customerId: borrowers[1] ? borrowers[1]._id : borrowers[0]._id,
        lenderId: lenders[1] ? lenders[1]._id : lenders[0]._id,
        listingId: listings[2] ? listings[2]._id : listings[0]._id, // Sound System
        quantity: 1,
        startDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'confirmed',
        paymentStatus: 'completed'
      },

      // Currently active rentals (using future dates but marking as in_progress)
      {
        customerId: borrowers[2] ? borrowers[2]._id : borrowers[0]._id,
        lenderId: lenders[2] ? lenders[2]._id : lenders[0]._id,
        listingId: listings[5] ? listings[5]._id : listings[0]._id, // Mountain Bike
        quantity: 2,
        startDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'in_progress',
        paymentStatus: 'completed'
      },
      {
        customerId: borrowers[3] ? borrowers[3]._id : borrowers[0]._id,
        lenderId: lenders[1] ? lenders[1]._id : lenders[0]._id,
        listingId: listings[3] ? listings[3]._id : listings[0]._id, // 4K Projector
        quantity: 1,
        startDate: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000), // 11 days from now
        endDate: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000), // 13 days from now
        status: 'in_progress',
        paymentStatus: 'completed'
      },

      // Completed orders (using recent past dates as examples, will be marked completed)
      {
        customerId: borrowers[0]._id,
        lenderId: lenders[2] ? lenders[2]._id : lenders[0]._id,
        listingId: listings[6] ? listings[6]._id : listings[0]._id, // Camping Gear
        quantity: 1,
        startDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        endDate: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
        status: 'completed',
        paymentStatus: 'completed'
      },
      {
        customerId: borrowers[1] ? borrowers[1]._id : borrowers[0]._id,
        lenderId: lenders[1] ? lenders[1]._id : lenders[0]._id,
        listingId: listings[4] ? listings[4]._id : listings[0]._id, // LED Lighting
        quantity: 1,
        startDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        status: 'completed',
        paymentStatus: 'completed'
      },

      // Pending payment orders
      {
        customerId: borrowers[2] ? borrowers[2]._id : borrowers[0]._id,
        lenderId: lenders[0]._id,
        listingId: listings[1] ? listings[1]._id : listings[0]._id, // Sony Video Kit
        quantity: 1,
        startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
        paymentStatus: 'pending'
      },

      // Cancelled orders
      {
        customerId: borrowers[3] ? borrowers[3]._id : borrowers[0]._id,
        lenderId: lenders[2] ? lenders[2]._id : lenders[0]._id,
        listingId: listings[7] ? listings[7]._id : listings[0]._id, // Power Tools
        quantity: 1,
        startDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
        endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        status: 'cancelled',
        paymentStatus: 'refunded'
      }
    ];

    // Create orders, reservations, and payments
    for (const scenario of orderScenarios) {
      try {
        const listing = listings.find(l => l._id.equals(scenario.listingId));
        const customer = users.find(u => u._id.equals(scenario.customerId));
        const lender = users.find(u => u._id.equals(scenario.lenderId));

        if (!listing || !customer || !lender) {
          log(`⚠️  Warning: Skipping order - missing data (listing: ${!!listing}, customer: ${!!customer}, lender: ${!!lender})`, 'yellow');
          continue;
        }

        // Calculate pricing
        const days = Math.ceil((scenario.endDate - scenario.startDate) / (1000 * 60 * 60 * 24));
        const baseAmount = listing.basePrice * days * scenario.quantity;
        const platformFee = Math.round(baseAmount * 0.05); // 5% platform fee
        const depositAmount = listing.depositType === 'percent'
          ? Math.round(baseAmount * listing.depositValue / 100)
          : listing.depositValue;
        const totalAmount = baseAmount + platformFee;
        const lenderEarnings = baseAmount - Math.round(baseAmount * 0.05); // Lender gets 95%

        // Create order
        const order = {
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
          customerId: scenario.customerId,
          lenderId: scenario.lenderId,
          lineItems: [{
            listingId: scenario.listingId,
            quantity: scenario.quantity,
            startDate: scenario.startDate,
            endDate: scenario.endDate,
            unitPrice: listing.basePrice,
            duration: days,
            subtotal: baseAmount,
            depositAmount: depositAmount
          }],
          pricing: {
            subtotal: baseAmount,
            totalDeposit: depositAmount,
            platformFee: platformFee,
            totalAmount: totalAmount,
            platformCommission: Math.round(baseAmount * 0.05),
            lenderEarnings: lenderEarnings
          },
          status: scenario.status,
          payment: {
            status: scenario.paymentStatus,
            method: 'razorpay',
            razorpayOrderId: `mock_order_${Date.now()}_${Math.random().toString(36).substring(7)}`
          },
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.profile?.phone || '',
            address: {
              street: '123 Demo Street',
              city: 'Demo City', 
              state: 'Demo State',
              pincode: '123456',
              country: 'India'
            }
          },
          lender: {
            name: lender.name,
            email: lender.email,
            phone: lender.profile?.phone || '',
            businessName: lender.profile?.displayName || lender.name
          },
          timeline: {
            createdAt: new Date(scenario.startDate.getTime() - 3 * 24 * 60 * 60 * 1000)
          }
        };

        orders.push(order);

        // Create reservation
        const reservation = {
          listingId: scenario.listingId,
          customerId: scenario.customerId,
          hostId: scenario.lenderId, // Map lenderId to hostId for backward compatibility
          quantity: scenario.quantity,
          startDate: scenario.startDate,
          endDate: scenario.endDate,
          status: scenario.status === 'in_progress' ? 'in_progress' :
            scenario.status === 'completed' ? 'completed' :
              scenario.status === 'cancelled' ? 'cancelled' :
                scenario.status === 'confirmed' ? 'confirmed' : 'pending',
          pricing: {
            unitPrice: listing.basePrice,
            totalDays: days,
            subtotal: baseAmount,
            depositAmount: depositAmount,
            totalAmount: baseAmount,
            hostEarnings: lenderEarnings // Map lenderEarnings to hostEarnings for backward compatibility
          },
          timeline: {
            reservedAt: new Date(scenario.startDate.getTime() - 3 * 24 * 60 * 60 * 1000),
            expectedReturnAt: scenario.endDate
          }
        };

        reservations.push(reservation);

        // Create payment if paid
        if (scenario.paymentStatus === 'completed' || scenario.paymentStatus === 'refunded') {
          const payment = {
            customerId: customer._id,
            hostId: lender._id, // Map lender to host for backward compatibility
            amount: totalAmount,
            currency: 'INR',
            method: 'razorpay',
            status: 'completed',
            customer: {
              name: customer.name,
              email: customer.email,
              phone: customer.profile?.phone || ''
            },
            security: {
              ipAddress: '192.168.1.100',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              fingerprint: `fp_${Math.random().toString(36).substring(7)}`,
              riskScore: 25
            },
            breakdown: {
              subtotal: totalAmount * 0.85, // Assuming 85% is subtotal
              platformFee: totalAmount * 0.05,
              gstAmount: totalAmount * 0.10,
              totalAmount: totalAmount
            },
            gateway: {
              razorpayOrderId: order.payment.razorpayOrderId,
              razorpayPaymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              razorpaySignature: 'mock_signature'
            },
            gatewayResponse: {
              transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              authCode: '123456',
              rrn: `${Date.now()}`
            }
          };

          payments.push(payment);
        }
      } catch (error) {
        log(`⚠️  Warning: Skipping order creation due to error: ${error.message}`, 'yellow');
        continue;
      }
    }

    // Create orders first, then link them to reservations
    const createdOrders = await Order.create(orders);

    // Update reservations with order IDs
    for (let i = 0; i < reservations.length; i++) {
      if (createdOrders[i]) {
        reservations[i].orderId = createdOrders[i]._id;
      }
    }

    // Update payments with order IDs
    for (let i = 0; i < payments.length; i++) {
      if (payments[i] && createdOrders[i]) {
        payments[i].orderId = createdOrders[i]._id;
      }
    }

    const createdReservations = await Reservation.create(reservations);
    const createdPayments = payments.length > 0 ? await Payment.create(payments.filter(p => p)) : [];

    log(`✅ Created ${createdOrders.length} orders`, 'green');
    log(`✅ Created ${createdReservations.length} reservations`, 'green');
    log(`✅ Created ${createdPayments.length} payments`, 'green');

    return { orders: createdOrders, reservations: createdReservations, payments: createdPayments };
  } catch (error) {
    log(`❌ Error creating orders and reservations: ${error.message}`, 'red');
    throw error;
  }
};

/**
 * Create demo payouts for lenders
 */
const createPayouts = async (users, orders) => {
  try {
    log('💰 Creating demo payouts...', 'blue');

    const lenders = users.filter(u => u.lenderStats);
    const payouts = [];

    for (const lender of lenders) {
      try {
        // Calculate completed orders for this lender
        const lenderOrders = orders.filter(o =>
          o.lenderId.equals(lender._id) && o.status === 'completed'
        );

        if (lenderOrders.length > 0) {
          const totalEarnings = lenderOrders.reduce((sum, order) =>
            sum + (order.pricing.subtotal - Math.round(order.pricing.subtotal * 0.05)), 0
          ); // Subtract 5% platform commission

          const payout = {
            hostId: lender._id, // Map lender to host for backward compatibility
            amount: totalEarnings,
            status: Math.random() > 0.5 ? 'completed' : 'pending', // Random status for demo
            method: 'bank_transfer',
            host: { // Map lender details to host for backward compatibility
              name: lender.name,
              email: lender.email,
              phone: lender.profile?.phone || ''
            },
            breakdown: {
              grossAmount: lenderOrders.reduce((sum, order) => sum + order.pricing.subtotal, 0),
              platformCommission: lenderOrders.reduce((sum, order) => sum + Math.round(order.pricing.subtotal * 0.05), 0),
              processingFee: 10, // Fixed processing fee
              netAmount: totalEarnings
            },
            sourceOrders: lenderOrders.map(o => ({
              orderId: o._id,
              orderNumber: `ORD-${Math.random().toString(36).substring(7).toUpperCase()}`,
              earnings: o.pricing.subtotal - Math.round(o.pricing.subtotal * 0.05),
              completedAt: new Date()
            })),
            bankDetails: {
              accountNumber: `****${Math.random().toString().substring(2, 6)}`,
              accountHolderName: lender.name,
              bankName: 'State Bank of India',
              ifscCode: 'SBIN0001234',
              branchName: 'Main Branch',
              accountType: 'savings',
              verified: true,
              verifiedAt: new Date()
            }
          };

          payouts.push(payout);
        }
      } catch (error) {
        log(`⚠️  Warning: Skipping payout for lender ${lender.name}: ${error.message}`, 'yellow');
        continue;
      }
    }

    const createdPayouts = payouts.length > 0 ? await Payout.create(payouts) : [];
    log(`✅ Created ${createdPayouts.length} payouts`, 'green');

    return createdPayouts;
  } catch (error) {
    log(`❌ Error creating payouts: ${error.message}`, 'red');
    throw error;
  }
};

/**
 * Display comprehensive seed summary for P2P marketplace
 */
const displaySummary = async (users, listings, orders, reservations, payments, payouts) => {
  log('\n📊 P2P MARKETPLACE SEED SUMMARY', 'cyan');
  log('===================================', 'cyan');

  const adminUsers = users.filter(u => u.role === 'admin');
  const lenderUsers = users.filter(u => u.lenderStats);
  const borrowerUsers = users.filter(u => u.borrowerStats);

  log(`👥 Users: ${users.length} total`, 'blue');
  log(`   - Admins: ${adminUsers.length}`, 'blue');
  log(`   - Lenders: ${lenderUsers.length}`, 'blue');
  log(`   - Borrowers: ${borrowerUsers.length}`, 'blue');

  log(`\n🏪 Listings: ${listings.length} total`, 'blue');
  const categoryCount = listings.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + 1;
    return acc;
  }, {});
  Object.entries(categoryCount).forEach(([category, count]) => {
    log(`   - ${category}: ${count}`, 'blue');
  });

  log(`\n📋 Orders: ${orders.length} total`, 'blue');
  const orderStatusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  Object.entries(orderStatusCounts).forEach(([status, count]) => {
    log(`   - ${status}: ${count}`, 'blue');
  });

  log(`\n🎫 Reservations: ${reservations.length} total`, 'blue');
  log(`💳 Payments: ${payments.length} total`, 'blue');
  log(`💰 Payouts: ${payouts.length} total`, 'blue');

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.pricing.totalAmount, 0);
  log(`\n💰 Total Revenue: ₹${totalRevenue.toLocaleString()}`, 'blue');

  const totalPlatformFees = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.pricing.platformFee, 0);
  log(`📈 Platform Fees: ₹${totalPlatformFees.toLocaleString()}`, 'blue');

  log('\n🔑 DEMO ACCOUNTS', 'cyan');
  log('==================', 'cyan');
  log('Admin Account:', 'green');
  log('  Email: admin@demo.com', 'green');
  log('  Password: p@ssw0rd', 'green');

  log('\nLender Accounts:', 'green');
  log('  Email: raj@demo.com (Camera Equipment)', 'green');
  log('  Email: priya@demo.com (Event Equipment)', 'green');
  log('  Email: arjun@demo.com (Sports Equipment)', 'green');
  log('  Password: p@ssw0rd', 'green');

  log('\nBorrower Account:', 'green');
  log('  Email: user@demo.com', 'green');
  log('  Password: p@ssw0rd', 'green');

  log('\n🚀 P2P MARKETPLACE FEATURES', 'cyan');
  log('==============================', 'cyan');
  log('✅ Peer-to-peer lending for all users', 'yellow');
  log('✅ User onboarding with verification', 'yellow');
  log('✅ Atomic reservation system with conflicts prevention', 'yellow');
  log('✅ Payment processing with Razorpay integration', 'yellow');
  log('✅ Lender earnings and payout management', 'yellow');
  log('✅ Order lifecycle: pending → confirmed → active → completed', 'yellow');
  log('✅ Admin dashboard with platform analytics', 'yellow');
  log('✅ Lender dashboard with earnings tracking', 'yellow');

  log('\n🧪 TESTING SCENARIOS', 'cyan');
  log('=====================', 'cyan');
  log('🎯 Try booking Canon Camera Kit (conflicts with existing bookings)', 'yellow');
  log('🎯 Test lender dashboard analytics and earnings', 'yellow');
  log('🎯 Create new listings as any user', 'yellow');
  log('🎯 Process payouts as admin', 'yellow');
  log('🎯 Test payment flow with mock Razorpay', 'yellow');
  log('🎯 Check availability across different dates', 'yellow');
  log('🎯 Test concurrent booking conflicts', 'yellow');

  log('\n💡 API ENDPOINTS AVAILABLE', 'cyan');
  log('===========================', 'cyan');
  log('📍 GET /api/listings - Browse all listings', 'yellow');
  log('📍 POST /api/listings - Create listing (host only)', 'yellow');
  log('📍 POST /api/orders - Create booking order', 'yellow');
  log('📍 GET /api/host/dashboard - Host analytics', 'yellow');
  log('📍 GET /api/admin/overview - Platform analytics', 'yellow');
  log('📍 POST /api/payments/webhook - Razorpay webhooks', 'yellow');
  log('📍 GET /api/payouts - Host payouts management', 'yellow');
};

/**
 * Main seed function for P2P marketplace
 */
const seedDatabase = async () => {
  try {
    log('🌱 Starting P2P Marketplace database seeding...', 'cyan');
    log('=================================================', 'cyan');

    await connectDB();
    await clearData();

    const users = await createUsers();
    const listings = await createListings(users);
    const { orders, reservations, payments } = await createOrdersAndReservations(users, listings);
    const payouts = await createPayouts(users, orders);

    await displaySummary(users, listings, orders, reservations, payments, payouts);

    log('\n✅ P2P Marketplace database seeding completed successfully!', 'green');
    log('🎉 Ready for multi-host marketplace demo and testing!', 'green');

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
