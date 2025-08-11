# Rental System Backend

A Node.js/Express backend for a rental management system with MongoDB.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Seed database:**
   ```bash
   npm run seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:5000`

## Demo Accounts

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
