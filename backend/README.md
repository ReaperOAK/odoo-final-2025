# 🚀 Rental Management System Backend

**A high-performance, production-ready Express.js backend with comprehensive security, validation, and performance optimizations.**

---

## ⚡ Quick Start

### Prerequisites
- Node.js >= 16.0.0
- MongoDB >= 5.0
- npm >= 8.0.0

### Installation & Demo Setup (60 seconds)
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Seed demo data with test accounts
npm run seed

# Start development server
npm run dev
```

### 🎯 Demo Accounts (Ready to Use)
- **Admin**: `admin@demo.com` / `p@ssw0rd`
- **User**: `user@demo.com` / `p@ssw0rd`

### 🔥 Golden Path Demo (Book → Pick Up → Return)
1. Login as user → Browse products → Book equipment
2. Login as admin → Confirm booking → Mark as picked up  
3. Admin → Mark as returned → Complete cycle

**Backend runs on: `http://localhost:5000`**
---

## 🏗️ Architecture & Performance

### 🎯 Built for Performance
- **10000% Flawless**: Comprehensive validation, atomic transactions, retry logic
- **Absolute Beast Performance**: Caching, connection pooling, lean queries
- **Security Hardened**: Rate limiting, input sanitization, JWT protection
- **Production Ready**: Health checks, graceful shutdown, error handling

### ⚡ Core Features
- **Atomic Booking System**: No overbookings with MongoDB transactions
- **Smart Caching**: Product, user, and price caching with TTL
- **Advanced Validation**: 40+ validation rules with express-validator
- **Performance Monitoring**: Request timing, memory tracking, DB metrics
- **Rate Limiting**: Tiered limits (auth: 10/15min, general: 1000/15min)

### 📊 Tech Stack
- **Framework**: Express.js with compression & security middleware
- **Database**: MongoDB with optimized indexes and connection pooling
- **Security**: Helmet, CORS, express-mongo-sanitize, HPP protection
- **Validation**: express-validator with custom sanitization rules
- **Logging**: Winston with request IDs and performance metrics

After running the seed script:
- **Admin:** admin@demo.com / p@ssw0rd
- **Customer:** user@demo.com / p@ssw0rd

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PATCH /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Rentals
- `POST /api/rentals/check-availability` - Check availability
- `POST /api/rentals/calculate-price` - Calculate rental price
- `POST /api/rentals/create` - Create booking (Auth)
- `GET /api/rentals` - Get rentals (Auth)
- `PATCH /api/rentals/:id/status` - Update status (Admin)

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rental-system
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Populate database with demo data
- `npm test` - Run tests

## Features

- ✅ JWT Authentication
- ✅ Role-based access (Admin/Customer)
- ✅ Product CRUD operations
- ✅ Availability checking with overlap detection
- ✅ Atomic booking creation with transactions
- ✅ Rental management with status updates
- ✅ Comprehensive error handling
- ✅ Request logging
- ✅ Security headers
- ✅ Input validation
