const Product = require('../models/product.model');
const RentalOrder = require('../models/rentalOrder.model');
const { asyncHandler, AppError, ERROR_TYPES } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

// Product cache for better performance
const productListCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

/**
 * Get all products with advanced filtering and caching
 */
const getProducts = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { 
    page = 1, 
    limit = 20, 
    search,
    category,
    minStock = 0,
    available = false,
    sort = '-createdAt'
  } = req.query;

  logger.info('Products list requested', { 
    page, 
    limit, 
    search, 
    category,
    minStock,
    available,
    requestId 
  });

  logger.startTimer('products-fetch', requestId);

  // Build cache key
  const cacheKey = JSON.stringify({ page, limit, search, category, minStock, available, sort });
  const cached = productListCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    logger.debug('Products cache hit', { requestId });
    logger.endTimer('products-fetch', requestId, { result: 'cached' });
    
    return res.status(200).json({
      ...cached.data,
      requestId
    });
  }

  // Build query
  let query = {};
  
  // Text search
  if (search) {
    query.$text = { $search: search };
  }
  
  // Category filter (if categories are added to schema later)
  if (category) {
    query.category = category;
  }
  
  // Stock filter
  if (minStock > 0) {
    query.stock = { $gte: parseInt(minStock) };
  }
  
  // Available filter (products with stock > 0)
  if (available === 'true') {
    query.stock = { $gt: 0 };
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Execute queries in parallel
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(limitNum)
      .skip(skip)
      .lean(), // Use lean for better performance
    
    Product.countDocuments(query)
  ]);

  // Add availability status for each product (if needed)
  const enrichedProducts = await Promise.all(
    products.map(async (product) => {
      // Get current active bookings count
      const activeBookings = await RentalOrder.countDocuments({
        product: product._id,
        status: { $in: ['confirmed', 'picked_up'] },
        endTime: { $gt: new Date() }
      });
      
      return {
        ...product,
        availableStock: Math.max(0, product.stock - activeBookings),
        isAvailable: (product.stock - activeBookings) > 0
      };
    })
  );

  const responseData = {
    error: false,
    data: enrichedProducts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1
    },
    filters: {
      search,
      category,
      minStock: parseInt(minStock),
      available: available === 'true'
    }
  };

  // Cache the result
  productListCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });

  // Clean up expired cache entries
  setTimeout(() => {
    if (productListCache.has(cacheKey)) {
      const entry = productListCache.get(cacheKey);
      if (Date.now() - entry.timestamp >= CACHE_DURATION) {
        productListCache.delete(cacheKey);
      }
    }
  }, CACHE_DURATION);

  logger.endTimer('products-fetch', requestId, { 
    count: products.length,
    totalPages: Math.ceil(total / limitNum)
  });

  res.status(200).json({
    ...responseData,
    requestId
  });
});

/**
 * Get single product with detailed information
 */
const getProduct = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { id } = req.params;

  logger.info('Product detail requested', { productId: id, requestId });

  logger.startTimer('product-detail-fetch', requestId);

  const product = await Product.findById(id)
    .populate('createdBy', 'name email')
    .lean();
  
  if (!product) {
    logger.endTimer('product-detail-fetch', requestId, { result: 'not-found' });
    throw new AppError('Product not found', 404, ERROR_TYPES.NOT_FOUND);
  }

  // Get availability information
  const [activeBookings, totalBookings, recentBookings] = await Promise.all([
    RentalOrder.countDocuments({
      product: id,
      status: { $in: ['confirmed', 'picked_up'] },
      endTime: { $gt: new Date() }
    }),
    
    RentalOrder.countDocuments({
      product: id,
      status: { $ne: 'cancelled' }
    }),
    
    RentalOrder.find({
      product: id,
      status: { $ne: 'cancelled' }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('customer', 'name')
    .lean()
  ]);

  const enrichedProduct = {
    ...product,
    availableStock: Math.max(0, product.stock - activeBookings),
    isAvailable: (product.stock - activeBookings) > 0,
    stats: {
      totalBookings,
      activeBookings,
      utilizationRate: product.stock > 0 ? 
        Math.round((activeBookings / product.stock) * 100) : 0
    },
    recentBookings: recentBookings.map(booking => ({
      id: booking._id,
      customer: booking.customer?.name,
      status: booking.status,
      startTime: booking.startTime,
      endTime: booking.endTime
    }))
  };

  logger.endTimer('product-detail-fetch', requestId, { result: 'success' });

  res.status(200).json({
    error: false,
    data: enrichedProduct,
    requestId
  });
});

/**
 * Create new product (Admin only)
 */
const createProduct = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { name, description, stock, pricing, images } = req.body;

  logger.info('Product creation started', { 
    name, 
    stock,
    adminId: req.user._id,
    requestId 
  });

  logger.startTimer('product-creation', requestId);

  const product = new Product({
    name: name.trim(),
    description: description?.trim(),
    stock: parseInt(stock),
    pricing,
    images: images || [],
    createdBy: req.user._id
  });

  await product.save();
  await product.populate('createdBy', 'name email');

  // Clear product list cache
  productListCache.clear();

  logger.info('Product created successfully', { 
    productId: product._id, 
    name,
    adminId: req.user._id,
    requestId 
  });

  logger.endTimer('product-creation', requestId, { result: 'success' });

  res.status(201).json({
    error: false,
    message: 'Product created successfully',
    data: product,
    requestId
  });
});

/**
 * Update product (Admin only)
 */
const updateProduct = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { id } = req.params;
  const { name, description, stock, pricing, images } = req.body;

  logger.info('Product update started', { 
    productId: id,
    adminId: req.user._id,
    requestId 
  });

  logger.startTimer('product-update', requestId);

  const product = await Product.findById(id);
  
  if (!product) {
    logger.endTimer('product-update', requestId, { result: 'not-found' });
    throw new AppError('Product not found', 404, ERROR_TYPES.NOT_FOUND);
  }

  // Check if reducing stock would conflict with active bookings
  if (stock !== undefined && stock < product.stock) {
    const activeBookings = await RentalOrder.countDocuments({
      product: id,
      status: { $in: ['confirmed', 'picked_up'] },
      endTime: { $gt: new Date() }
    });

    if (stock < activeBookings) {
      logger.warn('Stock reduction blocked - Active bookings conflict', {
        productId: id,
        currentStock: product.stock,
        requestedStock: stock,
        activeBookings,
        requestId
      });
      
      logger.endTimer('product-update', requestId, { result: 'stock-conflict' });
      throw new AppError(
        `Cannot reduce stock below ${activeBookings}. There are ${activeBookings} active bookings`,
        400,
        ERROR_TYPES.CONFLICT,
        {
          currentStock: product.stock,
          requestedStock: stock,
          activeBookings,
          minimumStock: activeBookings
        }
      );
    }
  }

  // Update fields
  if (name !== undefined) product.name = name.trim();
  if (description !== undefined) product.description = description?.trim();
  if (stock !== undefined) product.stock = parseInt(stock);
  if (pricing !== undefined) product.pricing = pricing;
  if (images !== undefined) product.images = images;

  await product.save();
  await product.populate('createdBy', 'name email');

  // Clear product list cache
  productListCache.clear();

  logger.info('Product updated successfully', { 
    productId: id,
    adminId: req.user._id,
    requestId 
  });

  logger.endTimer('product-update', requestId, { result: 'success' });

  res.status(200).json({
    error: false,
    message: 'Product updated successfully',
    data: product,
    requestId
  });
});

/**
 * Delete product (Admin only)
 */
const deleteProduct = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();
  const { id } = req.params;

  logger.info('Product deletion started', { 
    productId: id,
    adminId: req.user._id,
    requestId 
  });

  logger.startTimer('product-deletion', requestId);

  const product = await Product.findById(id);
  
  if (!product) {
    logger.endTimer('product-deletion', requestId, { result: 'not-found' });
    throw new AppError('Product not found', 404, ERROR_TYPES.NOT_FOUND);
  }

  // Check for active bookings
  const activeBookings = await RentalOrder.countDocuments({
    product: id,
    status: { $in: ['confirmed', 'picked_up'] }
  });

  if (activeBookings > 0) {
    logger.warn('Product deletion blocked - Active bookings exist', {
      productId: id,
      activeBookings,
      requestId
    });
    
    logger.endTimer('product-deletion', requestId, { result: 'active-bookings' });
    throw new AppError(
      `Cannot delete product with ${activeBookings} active bookings`,
      400,
      ERROR_TYPES.CONFLICT,
      { activeBookings }
    );
  }

  await Product.findByIdAndDelete(id);

  // Clear product list cache
  productListCache.clear();

  logger.info('Product deleted successfully', { 
    productId: id,
    name: product.name,
    adminId: req.user._id,
    requestId 
  });

  logger.endTimer('product-deletion', requestId, { result: 'success' });

  res.status(200).json({
    error: false,
    message: 'Product deleted successfully',
    requestId
  });
});

/**
 * Get product statistics (Admin only)
 */
const getProductStats = asyncHandler(async (req, res, next) => {
  const requestId = req.requestId || logger.generateRequestId();

  logger.startTimer('product-stats', requestId);

  const [
    totalProducts,
    availableProducts,
    outOfStockProducts,
    mostBookedProducts,
    revenueByProduct
  ] = await Promise.all([
    Product.countDocuments(),
    
    Product.countDocuments({ stock: { $gt: 0 } }),
    
    Product.countDocuments({ stock: 0 }),
    
    RentalOrder.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { 
        $group: { 
          _id: '$product',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { totalBookings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          totalBookings: 1,
          totalRevenue: 1
        }
      }
    ]),
    
    RentalOrder.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { 
        $group: { 
          _id: '$product',
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          totalRevenue: 1
        }
      }
    ])
  ]);

  const stats = {
    totalProducts,
    availableProducts,
    outOfStockProducts,
    utilizationRate: totalProducts > 0 ? 
      Math.round(((totalProducts - outOfStockProducts) / totalProducts) * 100) : 0,
    mostBookedProducts,
    topRevenueProducts: revenueByProduct.slice(0, 5)
  };

  logger.endTimer('product-stats', requestId);

  res.status(200).json({
    error: false,
    data: stats,
    requestId
  });
});

/**
 * Clear product cache (for testing/manual refresh)
 */
const clearProductCache = () => {
  productListCache.clear();
  logger.info('Product cache cleared');
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  clearProductCache
};