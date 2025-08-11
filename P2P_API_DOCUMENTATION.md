# P2P Rental Marketplace API Documentation

## Overview
This document describes the REST API endpoints for the P2P Rental Marketplace platform. The API supports multi-host rental operations, atomic booking transactions, payment processing, and comprehensive analytics.

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/register`
Register a new user
- **Access**: Public
- **Body**: `{ name, email, password, role? }`
- **Response**: User object with JWT token

#### POST `/api/auth/login`
Login user
- **Access**: Public
- **Body**: `{ email, password }`
- **Response**: User object with JWT token

#### POST `/api/auth/logout`
Logout user
- **Access**: Private
- **Response**: Success message

#### GET `/api/auth/profile`
Get current user profile
- **Access**: Private
- **Response**: User profile

#### PUT `/api/auth/profile`
Update user profile
- **Access**: Private
- **Body**: User profile data
- **Response**: Updated user profile

---

### Listings (`/api/listings`)

#### POST `/api/listings`
Create a new listing
- **Access**: Private (Host)
- **Body**: Listing data with title, description, category, pricing, location, images
- **Response**: Created listing

#### GET `/api/listings`
Get all listings with search and filters
- **Access**: Public
- **Query Params**: 
  - `page`, `limit` - Pagination
  - `search` - Search term
  - `category` - Filter by category
  - `city` - Filter by city
  - `minPrice`, `maxPrice` - Price range
  - `condition` - Item condition
  - `available` - Availability status
  - `sortBy` - Sort field (price, rating, distance, newest, popular)
  - `sortOrder` - Sort order (asc, desc)
  - `latitude`, `longitude`, `radius` - Location-based search
- **Response**: Paginated listings with filters

#### GET `/api/listings/:id`
Get listing by ID
- **Access**: Public
- **Response**: Listing details

#### PUT `/api/listings/:id`
Update listing
- **Access**: Private (Host - Owner only)
- **Body**: Updated listing data
- **Response**: Updated listing

#### DELETE `/api/listings/:id`
Delete listing
- **Access**: Private (Host - Owner only)
- **Response**: Success message

#### GET `/api/listings/:id/availability`
Check listing availability
- **Access**: Public
- **Query Params**: `startDate`, `endDate`, `quantity?`
- **Response**: Availability status and details

#### GET `/api/listings/:id/pricing`
Calculate pricing for listing
- **Access**: Public
- **Query Params**: `startDate`, `endDate`, `quantity?`, `couponCode?`
- **Response**: Detailed pricing breakdown

#### GET `/api/listings/categories`
Get all categories with counts
- **Access**: Public
- **Response**: Categories list with item counts

#### GET `/api/listings/host`
Get listings for current host
- **Access**: Private (Host)
- **Query Params**: `page`, `limit`, `status`
- **Response**: Host's listings

---

### Orders (`/api/orders`)

#### POST `/api/orders`
Create a new order with reservations
- **Access**: Private (Customer)
- **Body**: 
  ```json
  {
    "lineItems": [
      {
        "listingId": "id",
        "quantity": 1,
        "startDate": "ISO date",
        "endDate": "ISO date"
      }
    ],
    "paymentMode": "razorpay|cash",
    "customer": { "name", "email", "phone" }
  }
  ```
- **Response**: Created order with payment details

#### POST `/api/orders/:id/payment`
Process payment for an order
- **Access**: Private (Customer)
- **Body**: Razorpay payment verification data
- **Response**: Payment confirmation

#### GET `/api/orders/:id`
Get order by ID
- **Access**: Private (Customer/Host/Admin)
- **Response**: Order details

#### GET `/api/orders`
Get orders for current user
- **Access**: Private (Customer/Host)
- **Query Params**: `page`, `limit`, `status`, `type` (customer|host|all)
- **Response**: User's orders

#### PUT `/api/orders/:id/status`
Update order status
- **Access**: Private (Host/Admin)
- **Body**: `{ status, notes? }`
- **Response**: Updated order

#### POST `/api/orders/:id/cancel`
Cancel order
- **Access**: Private (Customer/Host/Admin)
- **Body**: `{ reason? }`
- **Response**: Cancelled order with refund details

#### POST `/api/orders/:id/review`
Add review to order
- **Access**: Private (Customer/Host)
- **Body**: `{ rating, review? }`
- **Response**: Order with review

#### GET `/api/orders/stats/summary`
Get order statistics
- **Access**: Private (Host/Admin)
- **Query Params**: `period` (days)
- **Response**: Order analytics

---

### Payments (`/api/payments`)

#### POST `/api/payments/webhook`
Handle Razorpay webhooks
- **Access**: Public (Webhook)
- **Body**: Razorpay webhook payload
- **Response**: Webhook acknowledgment

#### POST `/api/payments/verify`
Verify payment signature
- **Access**: Private
- **Body**: Razorpay payment verification data
- **Response**: Verification result

#### GET `/api/payments/:id`
Get payment by ID
- **Access**: Private (Customer/Host/Admin)
- **Response**: Payment details

#### GET `/api/payments`
Get payments for current user
- **Access**: Private (Customer/Host)
- **Query Params**: `page`, `limit`, `status`, `type`
- **Response**: User's payments

#### POST `/api/payments/:id/refund`
Create refund for a payment
- **Access**: Private (Host/Admin)
- **Body**: `{ amount?, reason? }`
- **Response**: Refund details

#### GET `/api/payments/stats/summary`
Get payment statistics
- **Access**: Private (Host/Admin)
- **Query Params**: `period`, `type`
- **Response**: Payment analytics

---

### Payouts (`/api/payouts`)

#### POST `/api/payouts`
Create a payout request
- **Access**: Private (Host)
- **Body**: `{ amount?, orderIds?, bankDetails? }`
- **Response**: Created payout request

#### GET `/api/payouts`
Get payouts (host payouts or all for admin)
- **Access**: Private (Host/Admin)
- **Query Params**: `page`, `limit`, `status`, `hostId?` (admin only)
- **Response**: Payouts list

#### GET `/api/payouts/:id`
Get payout by ID
- **Access**: Private (Host/Admin)
- **Response**: Payout details

#### POST `/api/payouts/:id/approve`
Approve payout
- **Access**: Private (Admin)
- **Body**: `{ notes? }`
- **Response**: Approved payout

#### POST `/api/payouts/:id/reject`
Reject payout
- **Access**: Private (Admin)
- **Body**: `{ reason }`
- **Response**: Rejected payout

#### POST `/api/payouts/:id/process`
Mark payout as processed
- **Access**: Private (Admin)
- **Body**: `{ transactionId?, notes? }`
- **Response**: Processed payout

#### GET `/api/payouts/stats/summary`
Get payout statistics
- **Access**: Private (Host/Admin)
- **Query Params**: `period`
- **Response**: Payout analytics

#### PUT `/api/payouts/bank-details`
Update bank details
- **Access**: Private (Host)
- **Body**: Bank account details
- **Response**: Updated bank details

---

### Host Dashboard (`/api/host`)

#### GET `/api/host/dashboard`
Get comprehensive dashboard overview
- **Access**: Private (Host)
- **Query Params**: `period` (days)
- **Response**: Complete dashboard data with overview, earnings, top listings, etc.

#### GET `/api/host/analytics/earnings`
Get earnings analytics with breakdown
- **Access**: Private (Host)
- **Query Params**: `period`, `groupBy` (hour|day|week|month)
- **Response**: Earnings timeline and breakdowns

#### GET `/api/host/analytics/listings`
Get listing performance analytics
- **Access**: Private (Host)
- **Query Params**: `period`, `sortBy`, `limit`
- **Response**: Listing performance metrics

#### GET `/api/host/analytics/customers`
Get customer analytics
- **Access**: Private (Host)
- **Query Params**: `period`
- **Response**: Customer behavior and retention metrics

#### GET `/api/host/events/upcoming`
Get upcoming events and reminders
- **Access**: Private (Host)
- **Query Params**: `days`
- **Response**: Upcoming pickups, returns, and reminders

---

### Admin Panel (`/api/admin`)

#### GET `/api/admin/overview`
Get platform overview dashboard
- **Access**: Private (Admin)
- **Query Params**: `period`
- **Response**: Complete platform analytics

#### GET `/api/admin/users`
Get all users with filtering
- **Access**: Private (Admin)
- **Query Params**: `page`, `limit`, `role`, `status`, `search`, `sortBy`, `sortOrder`
- **Response**: Users list with statistics

#### PUT `/api/admin/users/:id/status`
Update user status/verification
- **Access**: Private (Admin)
- **Body**: `{ action, reason? }` (verify|suspend|activate|promote_to_host)
- **Response**: Updated user

#### GET `/api/admin/listings`
Get all listings with admin controls
- **Access**: Private (Admin)
- **Query Params**: `page`, `limit`, `status`, `category`, `search`, `hostId`, `sortBy`, `sortOrder`
- **Response**: Listings with booking statistics

#### PUT `/api/admin/listings/:id/status`
Update listing status
- **Access**: Private (Admin)
- **Body**: `{ action, reason? }` (approve|reject|suspend|activate)
- **Response**: Updated listing

#### GET `/api/admin/analytics`
Get platform analytics
- **Access**: Private (Admin)
- **Query Params**: `period`, `groupBy`
- **Response**: Comprehensive platform analytics

---

## Data Models

### User
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String",
  "password": "String (hashed)",
  "roles": ["customer", "host", "admin"],
  "isVerified": "Boolean",
  "status": "active|suspended",
  "profile": {
    "phone": "String",
    "avatar": "String",
    "address": "Object"
  },
  "hostProfile": {
    "displayName": "String",
    "bio": "String",
    "location": "Object",
    "verification": "Object",
    "settings": "Object",
    "walletBalance": "Number",
    "totalEarnings": "Number",
    "rating": "Object"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Listing
```json
{
  "_id": "ObjectId",
  "ownerId": "ObjectId",
  "title": "String",
  "description": "String",
  "category": "String",
  "subcategory": "String",
  "pricing": {
    "basePrice": "Number",
    "currency": "INR",
    "pricingModel": "fixed|hourly|daily|weekly|monthly",
    "discounts": "Array"
  },
  "location": {
    "address": "String",
    "city": "String",
    "state": "String",
    "pincode": "String",
    "coordinates": "Array"
  },
  "images": "Array",
  "status": "active|inactive|pending|rejected|suspended",
  "availability": "Object",
  "analytics": "Object",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Order
```json
{
  "_id": "ObjectId",
  "orderNumber": "String",
  "customerId": "ObjectId",
  "hostId": "ObjectId",
  "lineItems": "Array",
  "status": "pending|confirmed|in_progress|completed|cancelled|disputed",
  "pricing": {
    "subtotal": "Number",
    "taxes": "Number",
    "platformFee": "Number",
    "totalAmount": "Number"
  },
  "payment": "Object",
  "customer": "Object",
  "host": "Object",
  "timeline": "Object",
  "reviews": "Array",
  "cancellation": "Object",
  "payout": "Object",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Payment
```json
{
  "_id": "ObjectId",
  "orderId": "ObjectId",
  "customerId": "ObjectId",
  "amount": "Number",
  "currency": "INR",
  "status": "pending|processing|completed|failed|refunded",
  "method": "razorpay|cash|bank_transfer",
  "razorpayOrderId": "String",
  "razorpayPaymentId": "String",
  "capturedAmount": "Number",
  "refundedAmount": "Number",
  "refunds": "Array",
  "metadata": "Object",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Payout
```json
{
  "_id": "ObjectId",
  "payoutNumber": "String",
  "hostId": "ObjectId",
  "amount": "Number",
  "orderIds": "Array",
  "status": "pending|approved|rejected|processed",
  "bankDetails": "Object",
  "approvedBy": "ObjectId",
  "approvedAt": "Date",
  "processedAt": "Date",
  "transactionId": "String",
  "notes": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## Error Responses
All endpoints return errors in the following format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)",
  "errors": ["Validation errors array"]
}
```

## Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **429**: Too Many Requests
- **500**: Internal Server Error

---

## Rate Limiting
- **Auth endpoints**: 5 requests per minute
- **General API**: 100 requests per minute
- **File uploads**: 10 requests per minute

## Testing
Use tools like Postman or curl to test the API endpoints. Example:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Get listings
curl -X GET "http://localhost:5000/api/listings?category=electronics&city=Mumbai" \
  -H "Content-Type: application/json"
```
