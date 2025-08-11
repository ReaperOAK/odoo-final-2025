const express = require('express');
const { authMiddleware, isAdmin } = require('../middleware/auth.middleware');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/product.controller');

const router = express.Router();

// GET /api/products - Get all products (public)
router.get('/', getProducts);

// GET /api/products/:id - Get single product (public)
router.get('/:id', getProduct);

// POST /api/products - Create product (admin only)
router.post('/', authMiddleware, isAdmin, createProduct);

// PATCH /api/products/:id - Update product (admin only)
router.patch('/:id', authMiddleware, isAdmin, updateProduct);

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', authMiddleware, isAdmin, deleteProduct);

module.exports = router;
