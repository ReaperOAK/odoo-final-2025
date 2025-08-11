
# Backend Engineer TODOs (Detailed)

## Phase A — Setup & Core Backend (Hours 0–6)

### 1. Project Setup
- [ ] Create `/backend` folder structure as per plan (controllers, models, routes, middleware, utils, scripts)
- [ ] Initialize git, create branches: `main`, `dev`, `demo`
- [ ] Run `npm init -y` in `/backend`
- [ ] Install dependencies: `express`, `mongoose`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `date-fns`, `cors`, `helmet`, `morgan`
- [ ] Install dev dependencies: `nodemon`, `eslint`, `prettier`, `jest` (optional)
- [ ] Create `.env.example` and add all required environment variables
- [ ] Create `README.md` with setup and start instructions

### 2. Models & Schemas
- [ ] Implement `user.model.js` (fields: name, email, password, role; indexes as per plan)
- [ ] Implement `product.model.js` (fields: name, description, stock, pricing, images, createdBy; indexes)
- [ ] Implement `rentalOrder.model.js` (fields: customer, product, startTime, endTime, totalPrice, status, lateFee, createdAt; compound index)
- [ ] Export models and ensure all indexes are created

### 3. Auth & Middleware
- [ ] Implement `auth.controller.js` (register, login endpoints)
- [ ] Hash passwords with `bcryptjs` on register
- [ ] Generate JWT on login/register
- [ ] Implement `auth.middleware.js` (JWT verification, attach user to req)
- [ ] Implement `isAdmin` role guard middleware
- [ ] Add input validation for auth endpoints (manual or `express-validator`)

### 4. Product CRUD (Admin)
- [ ] Implement `product.controller.js` (CRUD: create, read, update, delete)
- [ ] Implement `product.routes.js` (admin protected)
- [ ] Add validation for product fields (name, stock, pricing)
- [ ] Implement error handling for not found, validation errors

## Phase B — Availability Engine & Booking (Hours 6–12)

### 5. Availability & Price Endpoints
- [ ] Implement `/api/rentals/check-availability` endpoint in `rental.controller.js`
	- [ ] Use provided overlap query and logic
	- [ ] Validate input (productId, startTime, endTime, qty)
- [ ] Implement `/api/rentals/calculate-price` endpoint
	- [ ] Use `calcPrice.js` utility for price calculation
	- [ ] Validate input

### 6. Booking Creation (Atomic)
- [ ] Implement `/api/rentals/create` endpoint
	- [ ] Use MongoDB session transaction and retry logic as per plan
	- [ ] Re-check availability inside transaction
	- [ ] Return order on success, error on failure

### 7. Admin Rental Management
- [ ] Implement `/api/rentals` endpoint (admin: all, user: mine)
	- [ ] Support filtering by status, pagination (`?limit=20&page=1`)
- [ ] Implement `/api/rentals/:id/status` endpoint (PATCH)
	- [ ] Allow status change (confirmed, picked_up, returned, cancelled)
	- [ ] Calculate late fee if returned late

### 8. Seed Script
- [ ] Create `scripts/seed.js` to populate DB with:
	- [ ] 2 admins, 3 customers, 5 products (vary stock/pricing)
	- [ ] Multiple overlapping orders to demo non-availability
	- [ ] Demo accounts: `admin@demo.com / p@ssw0rd`, `user@demo.com / p@ssw0rd`

### 9. Core Middleware & Security
- [ ] Implement `error.middleware.js` (central error handler, returns `{ error: true, message }`)
- [ ] Add `morgan` logging with request IDs
- [ ] Add `helmet` for security headers
- [ ] Enable CORS for allowed origins only

## Phase D — Polish, Testing & Demo (Hours 18–20)

### 10. Polish & UX
- [ ] Add status color chips in API responses (for frontend display)
- [ ] Add helpful error messages and microcopy for edge cases
- [ ] Ensure all endpoints return consistent error format

### 11. Testing & Validation
- [ ] Write manual and/or Jest tests for all endpoints
- [ ] Run concurrent booking test script (simulate 20 parallel bookings)
- [ ] Fix any race conditions or overbooking issues

### 12. Deployment & Demo
- [ ] Prepare for deployment: update `.env`, check CORS, security
- [ ] Deploy backend to Render, Railway, or Heroku (free tier)
- [ ] Final demo rehearsal: golden path, edge cases, stress test

## Best Practices & Checklist

- [ ] Keep secrets out of repo (`.env` only, use `.env.example`)
- [ ] Strict input validation everywhere (manual or `express-validator`)
- [ ] Store and operate on UTC for all times
- [ ] Ensure DB indexes on all query fields
- [ ] Use central error handling middleware
- [ ] Use `morgan` + custom logger for all requests
- [ ] Paginate admin rentals, use projection to limit payload
- [ ] Use transactions for booking creation (as per plan)
- [ ] Seed demo accounts and products for testing/demo
- [ ] Document all start commands and API usage in README
- [ ] No sensitive data in logs or responses
- [ ] Use ESLint and Prettier for code style
- [ ] Keep code modular, DRY, and well-commented
- [ ] Update docs and README after code changes

---

### Deliverables
- [ ] Fully functional backend with all endpoints and logic
- [ ] Seed script and concurrent test script
- [ ] README with setup, usage, and demo script
