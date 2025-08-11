const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateRegister, validateLogin } = require('../middleware/validate.middleware');
const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword,
  logout 
} = require('../controllers/auth.controller');

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', 
  validateRegister,
  register
);

// POST /api/auth/login - Login user
router.post('/login', 
  validateLogin,
  login
);

// GET /api/auth/profile - Get current user profile (authenticated)
router.get('/profile',
  authMiddleware,
  getProfile
);

// PUT /api/auth/profile - Update user profile (authenticated)
router.put('/profile',
  authMiddleware,
  updateProfile
);

// POST /api/auth/change-password - Change password (authenticated)
router.post('/change-password',
  authMiddleware,
  changePassword
);

// POST /api/auth/logout - Logout user (authenticated)
router.post('/logout',
  authMiddleware,
  logout
);

module.exports = router;
