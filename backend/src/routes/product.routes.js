const express = require('express');
const { authMiddleware, isAdmin, optionalAuth } = require('../middleware/auth.middleware');
const { validateProduct, validatePagination } = require('../middleware/validate.middleware');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/product.controller');

const router = express.Router();

// GET /api/products - Get all products with filtering (public with optional auth)
router.get('/', 
  validatePagination,
  optionalAuth,
  getProducts
);

// GET /api/products/stats - Get product statistics (admin only)
router.get('/stats',
  authMiddleware,
  isAdmin,
  getProductStats
);

// GET /api/products/:id - Get single product with details (public with optional auth)
router.get('/:id', 
  optionalAuth,
  getProduct
);

// POST /api/products - Create new product (admin only)
router.post('/', 
  authMiddleware,
  isAdmin,
  validateProduct,
  createProduct
);

// PATCH /api/products/:id - Update product (admin only)
router.patch('/:id', 
  authMiddleware,
  isAdmin,
  validateProduct,
  updateProduct
);

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', 
  authMiddleware,
  isAdmin,
  deleteProduct
);

module.exports = router;
