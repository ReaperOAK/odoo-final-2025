# Rental Management System - AI Coding Guide

## Architecture Overview

This is a **P2P rental marketplace** where hosts list equipment/items and customers rent them. The platform handles payments in escrow and processes payouts to hosts.

### Core Components
- **Backend**: Express.js with MongoDB, JWT auth, Razorpay payments
- **Frontend**: React 18 + Vite, TailwindCSS, React Router
- **Database**: MongoDB with Mongoose ODM

### Key Business Logic
- **Dual user roles**: Users can be both customers AND hosts (`isHost` flag)
- **Inventory ownership**: Each listing belongs to one host (not shared inventory)
- **Payment flow**: Customer → Platform (escrow) → Host (payout)
- **Booking lifecycle**: confirmed → picked_up → returned → payout_processed

## Development Workflow

### Quick Start Commands
```bash
npm run install:all    # Install all dependencies
npm run seed:dev       # Seed with demo data
npm run dev            # Start both frontend (3000) & backend (5000)
```

### Demo Accounts (always available after seeding)
- **Admin**: `admin@demo.com` / `p@ssw0rd`
- **User**: `user@demo.com` / `p@ssw0rd`

### Testing
- **Backend tests**: `cd backend && npm test` (Jest with MongoDB Memory Server)
- **Test utilities**: Global `createTestUser()` helper in `/backend/tests/setup.js`

## Code Patterns & Conventions

### Backend Patterns

#### Model Structure
- **User model** (`/backend/src/models/user.model.js`): Dual customer/host roles with `hostProfile` object
- **RentalOrder model**: Core booking entity with status enum progression
- **Compound indexes**: Always include for availability queries (`product + startTime + endTime`)

#### API Response Format (CRITICAL)
```javascript
// Always use this exact structure
{
  success: true,
  message: "Operation successful",
  data: { /* actual data */ }
}
```

#### Authentication Middleware
- Uses user caching (5min) for performance (`/backend/src/middleware/auth.middleware.js`)
- Rate limiting per IP for auth attempts
- JWT with Bearer token pattern

#### Service Layer Pattern
- **PricingService** (`/backend/src/services/pricing.service.js`): Complex pricing calculations with duration-based logic
- **ReservationService**: Atomic booking operations with conflict detection
- **RazorpayService**: Payment processing with webhook handling

### Frontend Patterns

#### State Management
- **AuthContext** (`/frontend/src/context/AuthContext.jsx`): Global user state, localStorage persistence
- **API structure**: Centralized axios instance with interceptors (`/frontend/src/api/api.js`)

#### Component Architecture
- **Lazy loading**: Non-critical pages are lazy-loaded for performance
- **ProtectedRoute**: Role-based route protection (customer/host/admin)
- **API integration**: Always use try/catch with toast notifications

#### Styling Conventions
- **TailwindCSS**: Primary styling framework
- **Responsive design**: Mobile-first approach
- **Toast notifications**: react-hot-toast for user feedback

## Critical Integration Points

### Availability Checking
- **Backend**: `/backend/src/utils/availability.js` - Complex time-based conflict detection
- **Frontend**: Real-time availability checking with DateRangePicker component
- **Pattern**: Always validate availability server-side before confirming bookings

### Payment Flow
- **Integration**: Razorpay for payments, webhooks for confirmation
- **Escrow pattern**: Platform holds funds until order completion
- **Key files**: `/backend/src/services/razorpay.service.js`, `/frontend/src/components/RazorpayCheckout.jsx`

### Dynamic Pricing
- **Service**: `/backend/src/services/pricing.service.js`
- **Calculation factors**: Duration, seasonality, demand, discounts
- **Unit types**: hourly, daily, weekly pricing models

## Security & Performance Features

### Backend Security
- **Helmet**: Content Security Policy configured
- **Rate limiting**: Express-rate-limit with IP-based throttling
- **Input sanitization**: express-mongo-sanitize, hpp for pollution
- **Password security**: bcrypt with salt rounds = 12

### Performance Optimizations
- **Compression**: gzip with 1KB threshold
- **Database**: Lean queries, strategic indexing
- **Caching**: User data cached in auth middleware
- **Frontend**: Code splitting with lazy imports

## Development Tips

### When adding new features:
1. **Models**: Add compound indexes for query patterns
2. **API routes**: Follow the standard response format
3. **Frontend**: Add lazy loading for new pages
4. **Authentication**: Use `requireAuth` middleware consistently

### Common gotchas:
- **Dual roles**: Users can be both customer AND host - check context carefully
- **Date handling**: Always validate timezone in availability calculations  
- **Payment states**: Handle async webhook confirmations properly
- **Test environment**: Uses MongoDB Memory Server, not real DB

### File naming patterns:
- **Backend**: `*.controller.js`, `*.service.js`, `*.middleware.js`, `*.model.js`
- **Frontend**: PascalCase for components, camelCase for utilities
- **Tests**: `*.test.js` in `/backend/tests/`

## Environment Setup
- **Node.js**: >=18.0.0 required
- **Environment variables**: Copy from `.env.example` files
- **Database**: MongoDB connection string in backend `.env`
- **Ports**: Frontend (3000), Backend (5000) - configured in package.json scripts
