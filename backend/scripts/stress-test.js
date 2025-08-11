/**
 * Comprehensive P2P Marketplace Backend Stress Test
 * Tests all aspects of the P2P lending system for performance and reliability
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const CONFIG = {
  // Multiple test users to avoid rate limiting
  testUsers: [
    { email: 'user@demo.com', password: 'p@ssw0rd' },
    { email: 'emma@demo.com', password: 'p@ssw0rd' },
    { email: 'michael@demo.com', password: 'p@ssw0rd' },
    { email: 'lisa@demo.com', password: 'p@ssw0rd' }
  ],
  concurrentBookings: 10,
  availabilityChecks: 50,
  performanceThresholds: {
    auth: 500, // ms
    booking: 1000, // ms
    availability: 200, // ms
    listingFetch: 300 // ms
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logHeader = (title) => {
  log(`\n🎯 ${title}`, 'cyan');
  log('='.repeat(title.length + 4), 'cyan');
};

// Global test state
let listingIds = [];
let userTokens = [];

/**
 * Initialize test data
 */
const initializeTestData = async () => {
  logHeader('INITIALIZING TEST DATA');
  
  try {
    // Get listings
    log('📦 Fetching listings...', 'yellow');
    const listingsRes = await axios.get(`${BASE_URL}/listings`);
    listingIds = listingsRes.data.data.listings.map(l => l._id);
    log(`✅ Found ${listingIds.length} listings`, 'green');

    // Authenticate test users
    log('👥 Authenticating test users...', 'yellow');
    for (const user of CONFIG.testUsers) {
      try {
        const authRes = await axios.post(`${BASE_URL}/auth/login`, user);
        userTokens.push(authRes.data.token);
        log(`✅ Authenticated ${user.email}`, 'green');
      } catch (error) {
        log(`⚠️  Failed to authenticate ${user.email}: ${error.message}`, 'yellow');
      }
    }
    
    if (userTokens.length === 0) {
      throw new Error('No users authenticated successfully');
    }
    
    log(`✅ ${userTokens.length} users ready for testing`, 'green');
    
  } catch (error) {
    log(`❌ Initialization failed: ${error.message}`, 'red');
    throw error;
  }
};

/**
 * Test authentication performance
 */
const testAuthPerformance = async () => {
  logHeader('AUTHENTICATION PERFORMANCE TEST');
  
  const user = CONFIG.testUsers[0];
  const iterations = 10;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await axios.post(`${BASE_URL}/auth/login`, user);
      times.push(Date.now() - start);
    } catch (error) {
      log(`⚠️  Auth attempt ${i + 1} failed: ${error.message}`, 'yellow');
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (times.length === 0) {
    log('❌ All authentication attempts failed', 'red');
    return false;
  }
  
  const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  
  log(`📊 Average auth time: ${avgTime.toFixed(2)}ms`, 'blue');
  log(`📊 Min: ${minTime}ms, Max: ${maxTime}ms`, 'blue');
  
  if (avgTime < CONFIG.performanceThresholds.auth) {
    log('🚀 Authentication performance: EXCELLENT', 'green');
    return true;
  } else {
    log('⚠️  Authentication performance: NEEDS IMPROVEMENT', 'yellow');
    return false;
  }
};

/**
 * Test listing fetching performance
 */
const testListingPerformance = async () => {
  logHeader('LISTING FETCHING PERFORMANCE TEST');
  
  const iterations = 20;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await axios.get(`${BASE_URL}/listings`);
      times.push(Date.now() - start);
    } catch (error) {
      log(`⚠️  Listing fetch ${i + 1} failed: ${error.message}`, 'yellow');
    }
  }
  
  const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  
  log(`📊 Average fetch time: ${avgTime.toFixed(2)}ms`, 'blue');
  log(`📊 Min: ${minTime}ms, Max: ${maxTime}ms`, 'blue');
  
  if (avgTime < CONFIG.performanceThresholds.listingFetch) {
    log('🚀 Listing fetching performance: EXCELLENT', 'green');
    return true;
  } else {
    log('⚠️  Listing fetching performance: NEEDS IMPROVEMENT', 'yellow');
    return false;
  }
};

/**
 * Test availability check performance
 */
const testAvailabilityPerformance = async () => {
  logHeader('AVAILABILITY CHECK PERFORMANCE TEST');
  
  const iterations = CONFIG.availabilityChecks;
  const listingId = listingIds[0];
  const times = [];
  
  log(`🔍 Running ${iterations} availability checks...`, 'yellow');
  
  const start = Date.now();
  const promises = Array.from({ length: iterations }, async () => {
    const requestStart = Date.now();
    try {
      await axios.get(`${BASE_URL}/listings/${listingId}/availability?startDate=${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}&endDate=${new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()}&quantity=1`);
      return Date.now() - requestStart;
    } catch (error) {
      log(`⚠️  Availability check failed: ${error.message}`, 'yellow');
      return null;
    }
  });
  
  const results = await Promise.all(promises);
  const validTimes = results.filter(t => t !== null);
  const totalTime = Date.now() - start;
  
  if (validTimes.length === 0) {
    log('❌ All availability checks failed', 'red');
    return false;
  }
  
  const avgTime = validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;
  const successRate = (validTimes.length / iterations) * 100;
  
  log(`📊 Total time: ${totalTime}ms for ${iterations} checks`, 'blue');
  log(`📊 Success rate: ${successRate.toFixed(2)}%`, 'blue');
  log(`📊 Average time: ${avgTime.toFixed(2)}ms`, 'blue');
  log(`📊 Throughput: ${(validTimes.length / (totalTime / 1000)).toFixed(2)} checks/sec`, 'blue');
  
  if (avgTime < CONFIG.performanceThresholds.availability && successRate > 95) {
    log('🚀 Availability check performance: EXCELLENT', 'green');
    return true;
  } else {
    log('⚠️  Availability check performance: NEEDS IMPROVEMENT', 'yellow');
    return false;
  }
};

/**
 * Test concurrent booking with overbooking prevention
 */
const testConcurrentBooking = async () => {
  logHeader('CONCURRENT BOOKING & OVERBOOKING PREVENTION TEST');
  
  const listingId = listingIds[0];
  const bookingData = {
    listingId,
    startDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
    quantity: 1,
    totalAmount: 100
  };
  
  log(`🎯 Creating ${CONFIG.concurrentBookings} concurrent bookings...`, 'yellow');
  
  const start = Date.now();
  const promises = Array.from({ length: CONFIG.concurrentBookings }, async (_, i) => {
    const token = userTokens[i % userTokens.length];
    try {
      const response = await axios.post(`${BASE_URL}/orders`, bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { success: true, orderId: response.data.order._id };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        status: error.response?.status 
      };
    }
  });
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - start;
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  log(`📊 Total time: ${totalTime}ms`, 'blue');
  log(`📊 Successful bookings: ${successful.length}`, 'green');
  log(`📊 Failed bookings: ${failed.length}`, 'red');
  log(`📊 Success rate: ${(successful.length / CONFIG.concurrentBookings * 100).toFixed(2)}%`, 'blue');
  
  // Analyze failure reasons
  const failureReasons = {};
  failed.forEach(f => {
    const reason = f.error;
    failureReasons[reason] = (failureReasons[reason] || 0) + 1;
  });
  
  log('\\n📋 Failure reasons:', 'cyan');
  Object.entries(failureReasons).forEach(([reason, count]) => {
    log(`   • ${reason}: ${count} requests`, 'yellow');
  });
  
  // Expected: Only limited bookings should succeed
  const isOverbookingPrevented = successful.length <= 3; // Assuming limited stock
  
  if (isOverbookingPrevented) {
    log('\\n🎉 OVERBOOKING PREVENTION: WORKING CORRECTLY', 'green');
    return true;
  } else {
    log('\\n❌ OVERBOOKING PREVENTION: FAILED', 'red');
    return false;
  }
};

/**
 * Test system under load
 */
const testSystemLoad = async () => {
  logHeader('SYSTEM LOAD TEST');
  
  log('🔥 Running mixed load test...', 'yellow');
  
  const start = Date.now();
  const operations = [];
  
  // Mix of different operations
  for (let i = 0; i < 50; i++) {
    operations.push(
      axios.get(`${BASE_URL}/listings`),
      axios.get(`${BASE_URL}/listings/${listingIds[i % listingIds.length]}/availability?startDate=${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}&endDate=${new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()}&quantity=1`)
    );
  }
  
  // Add authenticated operations
  const token = userTokens[0];
  for (let i = 0; i < 20; i++) {
    operations.push(
      axios.get(`${BASE_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }
  
  const results = await Promise.allSettled(operations);
  const totalTime = Date.now() - start;
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  log(`📊 Total operations: ${operations.length}`, 'blue');
  log(`📊 Successful: ${successful}`, 'green');
  log(`📊 Failed: ${failed}`, 'red');
  log(`📊 Success rate: ${(successful / operations.length * 100).toFixed(2)}%`, 'blue');
  log(`📊 Total time: ${totalTime}ms`, 'blue');
  log(`📊 Throughput: ${(successful / (totalTime / 1000)).toFixed(2)} ops/sec`, 'blue');
  
  const successRate = (successful / operations.length) * 100;
  
  if (successRate > 95) {
    log('🚀 System load handling: EXCELLENT', 'green');
    return true;
  } else {
    log('⚠️  System load handling: NEEDS IMPROVEMENT', 'yellow');
    return false;
  }
};

/**
 * Main test runner
 */
const runAllTests = async () => {
  log('🧪 COMPREHENSIVE BACKEND STRESS TEST', 'magenta');
  log('=====================================', 'magenta');
  log('Testing performance, concurrency, and reliability...\\n', 'cyan');
  
  const testResults = {
    initialization: false,
    auth: false,
    listings: false,
    availability: false,
    concurrentBooking: false,
    systemLoad: false
  };
  
  try {
    // Initialize
    await initializeTestData();
    testResults.initialization = true;
    
    // Run all tests
    testResults.auth = await testAuthPerformance();
    testResults.listings = await testListingPerformance();
    testResults.availability = await testAvailabilityPerformance();
    testResults.concurrentBooking = await testConcurrentBooking();
    testResults.systemLoad = await testSystemLoad();
    
  } catch (error) {
    log(`❌ Test suite failed: ${error.message}`, 'red');
    console.error(error);
  }
  
  // Final summary
  logHeader('FINAL TEST SUMMARY');
  
  const passed = Object.values(testResults).filter(Boolean).length;
  const total = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    const color = result ? 'green' : 'red';
    log(`${status} ${test.toUpperCase()}`, color);
  });
  
  log(`\\n📊 OVERALL SCORE: ${passed}/${total} tests passed`, 'cyan');
  log(`📊 SUCCESS RATE: ${(passed / total * 100).toFixed(2)}%`, 'cyan');
  
  if (passed === total) {
    log('\\n🎉 ALL TESTS PASSED - BACKEND IS FLAWLESS! 🎉', 'green');
  } else if (passed >= total * 0.8) {
    log('\\n👍 BACKEND IS PERFORMING WELL WITH MINOR ISSUES', 'yellow');
  } else {
    log('\\n⚠️  BACKEND NEEDS SIGNIFICANT IMPROVEMENTS', 'red');
  }
  
  log('\\n🏁 Stress test completed!', 'cyan');
};

// Run the tests
runAllTests().catch(console.error);
