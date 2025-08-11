const Product = require('../models/product.model');
const logger = require('../utils/logger');

// Get all products
const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let query = {};
    if (search) {
      query = { $text: { $search: search } };
    }

    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      error: false,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single product
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!product) {
      return res.status(404).json({
        error: true,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      error: false,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Create new product (Admin only)
const createProduct = async (req, res, next) => {
  try {
    const { name, description, stock, pricing, images } = req.body;

    // Basic validation
    if (!name || stock === undefined || !pricing || pricing.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Name, stock, and pricing are required'
      });
    }

    const product = new Product({
      name,
      description,
      stock,
      pricing,
      images: images || [],
      createdBy: req.user._id
    });

    await product.save();
    await product.populate('createdBy', 'name email');

    logger.info('Product created successfully', { productId: product._id, name });

    res.status(201).json({
      error: false,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Update product (Admin only)
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, stock, pricing, images } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: true,
        message: 'Product not found'
      });
    }

    // Update fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (stock !== undefined) product.stock = stock;
    if (pricing !== undefined) product.pricing = pricing;
    if (images !== undefined) product.images = images;

    await product.save();
    await product.populate('createdBy', 'name email');

    logger.info('Product updated successfully', { productId: product._id });

    res.status(200).json({
      error: false,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Delete product (Admin only)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: true,
        message: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    logger.info('Product deleted successfully', { productId: req.params.id });

    res.status(200).json({
      error: false,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
