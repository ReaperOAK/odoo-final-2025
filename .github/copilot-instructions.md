# Copilot Instructions for P2P Rental Marketplace

## Project Architecture

This is a full-stack P2P rental marketplace built with **React/Vite frontend** and **Express.js/MongoDB backend**. The system evolved from a traditional rental system to a peer-to-peer marketplace where any user can list items and rent from others.

### Core Models & Data Flow

- **Users** can be customers, hosts, or admins with role-based permissions
- **Listings** are items created by hosts with availability calendars and pricing
- **Orders** contain line items with atomic reservations using MongoDB transactions
- **Payments** use Razorpay integration with escrow and deposit handling
- **Payouts** manage host earnings with admin approval workflow

### Key Services

- `ReservationService`: Handles atomic order/reservation creation with transactions
- `PricingService`: Calculates dynamic pricing with deposits and platform fees
- `RazorpayService`: Manages payment processing and webhooks

## Development Workflow

### Quick Start Commands

```bash
# Install everything
npm run install:all

# Start full stack in development
npm run dev

# Seed demo data (includes admin@demo.com/p@ssw0rd)
npm run seed:dev
```

### Environment Setup

- Backend needs `.env` from `.env.example` with MongoDB URI and JWT secret
- Frontend optionally uses `VITE_API_URL` (defaults to localhost:5000)
- Demo accounts are seeded: admin@demo.com and user@demo.com (both p@ssw0rd)

## Backend Patterns

### API Structure

- All routes follow `/api/{resource}` pattern with RESTful conventions
- Controllers use `Class.staticMethod` pattern, not instance methods
- Validation uses express-validator with explicit error handling
- All responses follow `{ success, message, data }` format

### Database Patterns

- Use `mongoose.startSession()` for atomic operations in ReservationService
- Models have comprehensive validation and indexes
- Populate referenced data (User in listings, Listing in orders)
- Use `ref` relationships, not embedded documents for core entities

### Security Implementation

- JWT tokens in Authorization header: `Bearer <token>`
- Rate limiting: 100 req/15min general, 5 req/15min auth endpoints
- Input sanitization with mongo-sanitize and hpp
- Role-based access control in auth middleware

## Frontend Patterns

### Component Architecture

- Lazy loading for non-critical pages with React.lazy()
- AuthContext provides global auth state and JWT handling
- ProtectedRoute component for role-based page access
- API layer with axios interceptors for automatic token attachment

### State Management

- Use AuthContext for global auth state
- Local component state with useState for UI state
- No global state manager - keep state close to components
- Store JWT and user data in localStorage (matches backend expectations)

### API Integration

- Centralized API client in `/src/api/api.js` with interceptors
- Resource-specific API modules (auth.js, listings.js, orders.js, etc.)
- Handle 401 responses by clearing auth state and redirecting

### Component Patterns

- Use TailwindCSS classes following existing design system
- Implement loading, error, and empty states for all data components
- Date handling with date-fns library (already imported)
- Form validation should match backend validation patterns

## P2P Marketplace Specifics

### Host Dashboard Features

- Calendar view using FullCalendar for managing availability
- Earnings tracking with payout request functionality
- Listing management with real-time availability updates

### Booking Flow

- Multi-step: Browse → Select dates → Calculate pricing → Create order → Payment
- Atomic reservation creation ensures no double-booking
- Support for deposits (percentage or flat amount per listing)
- Handle payment failures gracefully with retry mechanisms

### Admin Operations

- User verification and suspension controls
- Platform-wide analytics and monitoring
- Payout approval workflow for host earnings

## Key Integration Points

### Payment Processing

- Razorpay integration in production, mock mode for development
- Webhook handling for payment confirmations
- Escrow system: customer pays, platform holds, releases to host after completion

### Real-time Features

- Availability checking with debounced API calls
- Calendar updates reflect in real-time across users
- Order status updates trigger notifications

## Critical Conventions

### Error Handling

- Backend: Always use try-catch with proper HTTP status codes
- Frontend: Show user-friendly error messages, log detailed errors
- Use logger utility in backend for consistent logging format

### Database Operations

- Always use transactions for multi-model operations
- Handle MongoDB connection issues gracefully
- Use proper indexes for query performance (see model definitions)

### File Organization

- Backend: Feature-based folders (models/, controllers/, services/, routes/)
- Frontend: Feature-based pages/, reusable components/, centralized api/
- Keep related files together, avoid deep nesting

When implementing new features, follow the existing patterns for similar functionality and maintain the atomic transaction approach for data consistency.
