# P2P Rental Marketplace API Documentation

## Overview

This is the comprehensive API documentation for the P2P Rental Marketplace platform. The API supports multi-host rental operations, atomic booking transactions, payment processing, comprehensive analytics, and role-based access control for customers, hosts, and administrators.

**Base URLs:**
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

**Authentication:** JWT Bearer Token  
**Content-Type:** `application/json`

## Table of Contents

1. [Authentication](#authentication)
2. [Listings Management](#listings-management)
3. [Orders & Bookings](#orders--bookings)
4. [Payments](#payments)
5. [Payouts](#payouts)
6. [Host Dashboard](#host-dashboard)
7. [Admin Panel](#admin-panel)
8. [Products (Legacy)](#products-legacy)
9. [Rentals (Legacy)](#rentals-legacy)
10. [Error Handling](#error-handling)
11. [Data Models](#data-models)
12. [Status Codes](#status-codes)
13. [Rate Limiting](#rate-limiting)
14. [Demo Accounts](#demo-accounts)

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### POST `/api/auth/register`
Register a new user account.

**Access:** Public  
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "customer" // optional: "customer", "host", "admin"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789abc123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "isVerified": false,
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST `/api/auth/login`
Authenticate user and receive access token.

**Access:** Public  
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789abc123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### GET `/api/auth/profile`
Get current authenticated user's profile.

**Access:** Private  
**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789abc123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "isVerified": true,
      "profile": {
        "phone": "+91-9876543210",
        "avatar": "https://example.com/avatar.jpg",
        "address": {...}
      },
      "hostProfile": {...}, // Only for hosts
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### PUT `/api/auth/profile`
Update current user's profile information.

**Access:** Private  
**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "profile": {
    "phone": "+91-9876543210",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  }
}
```

### POST `/api/auth/change-password`
Change current user's password.

**Access:** Private  
**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

### POST `/api/auth/logout`
Logout current user (invalidates token).

**Access:** Private

---

## Listings Management

### POST `/api/listings`
Create a new listing.

**Access:** Private (Host)  
**Request Body:**
```json
{
  "title": "Professional DSLR Camera",
  "description": "High-quality Canon DSLR camera perfect for photography events and professional shoots.",
  "category": "electronics",
  "subcategory": "cameras",
  "pricing": {
    "basePrice": 500,
    "currency": "INR",
    "pricingModel": "daily",
    "discounts": [
      {
        "type": "weekly",
        "percentage": 10
      }
    ]
  },
  "location": {
    "address": "123 Photography Street, Bandra West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400050",
    "coordinates": [72.8777, 19.0760]
  },
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "quantity": 2,
  "condition": "like_new",
  "tags": ["photography", "professional", "canon"],
  "availability": {
    "available": true,
    "unavailableDates": []
  }
}
```

### GET `/api/listings`
Get all listings with search and filters.

**Access:** Public  
**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)
- `search` (string): Search in title and description
- `category` (string): Filter by category
- `city` (string): Filter by city
- `minPrice`, `maxPrice` (number): Price range filter
- `condition` (string): Item condition filter
- `available` (boolean): Availability filter
- `sortBy` (string): Sort field (price, rating, distance, newest, popular)
- `sortOrder` (string): Sort order (asc, desc)
- `latitude`, `longitude`, `radius` (number): Location-based search

**Example Request:**
```
GET /api/listings?category=electronics&city=Mumbai&minPrice=100&maxPrice=1000&sortBy=price&sortOrder=asc&page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "_id": "64a1b2c3d4e5f6789abc456",
        "title": "Professional DSLR Camera",
        "description": "High-quality Canon DSLR camera...",
        "category": "electronics",
        "pricing": {
          "basePrice": 500,
          "pricingModel": "daily"
        },
        "location": {
          "city": "Mumbai",
          "state": "Maharashtra"
        },
        "images": ["image1.jpg"],
        "owner": {
          "_id": "64a1b2c3d4e5f6789abc123",
          "name": "John Doe",
          "rating": 4.8
        },
        "analytics": {
          "views": 150,
          "bookings": 25,
          "rating": 4.7
        },
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    },
    "filters": {
      "categories": ["electronics", "furniture", "tools"],
      "cities": ["Mumbai", "Delhi", "Bangalore"],
      "priceRange": {
        "min": 50,
        "max": 5000
      }
    }
  }
}
```

### GET `/api/listings/:id`
Get listing by ID with detailed information.

**Access:** Public

### PUT `/api/listings/:id`
Update listing (owner only).

**Access:** Private (Host - Owner only)

### DELETE `/api/listings/:id`
Delete listing (owner only).

**Access:** Private (Host - Owner only)

### GET `/api/listings/:id/availability`
Check listing availability for specific dates.

**Access:** Public  
**Query Parameters:**
- `startDate` (ISO date): Start date
- `endDate` (ISO date): End date
- `quantity` (number): Required quantity (optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true,
    "availableQuantity": 2,
    "requestedQuantity": 1,
    "conflictingBookings": [],
    "unavailableDates": []
  }
}
```

### GET `/api/listings/:id/pricing`
Calculate pricing for specific dates.

**Access:** Public  
**Query Parameters:**
- `startDate` (ISO date): Start date
- `endDate` (ISO date): End date
- `quantity` (number): Quantity (optional)
- `couponCode` (string): Coupon code (optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "breakdown": {
      "basePrice": 500,
      "days": 3,
      "subtotal": 1500,
      "discounts": 150,
      "platformFee": 75,
      "taxes": 112.5,
      "totalAmount": 1537.5
    },
    "currency": "INR"
  }
}
```

### GET `/api/listings/categories`
Get all categories with item counts.

**Access:** Public

### GET `/api/listings/host`
Get listings for current host.

**Access:** Private (Host)

---

## Orders & Bookings

### POST `/api/orders`
Create a new order with reservations.

**Access:** Private (Customer)  
**Request Body:**
```json
{
  "lineItems": [
    {
      "listingId": "64a1b2c3d4e5f6789abc456",
      "quantity": 1,
      "startDate": "2024-02-15T09:00:00.000Z",
      "endDate": "2024-02-17T18:00:00.000Z"
    }
  ],
  "paymentMode": "razorpay", // "razorpay" | "cash"
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "_id": "64a1b2c3d4e5f6789abc789",
      "orderNumber": "ORD-2024-001",
      "customerId": "64a1b2c3d4e5f6789abc123",
      "hostId": "64a1b2c3d4e5f6789abc456",
      "lineItems": [...],
      "status": "pending",
      "pricing": {
        "subtotal": 1500,
        "taxes": 112.5,
        "platformFee": 75,
        "totalAmount": 1687.5
      },
      "payment": {
        "mode": "razorpay",
        "razorpayOrderId": "order_xyz123",
        "status": "pending"
      },
      "timeline": {
        "created": "2024-01-20T14:30:00.000Z"
      }
    }
  }
}
```

### POST `/api/orders/:id/payment`
Process payment for an order.

**Access:** Private (Customer)  
**Request Body:**
```json
{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_hash"
}
```

### GET `/api/orders/:id`
Get order by ID.

**Access:** Private (Customer/Host/Admin)

### GET `/api/orders`
Get orders for current user.

**Access:** Private (Customer/Host)  
**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status
- `type`: "customer" | "host" | "all"

### PUT `/api/orders/:id/status`
Update order status.

**Access:** Private (Host/Admin)  
**Request Body:**
```json
{
  "status": "confirmed", // "confirmed" | "in_progress" | "completed" | "cancelled"
  "notes": "Order confirmed and ready for pickup"
}
```

### POST `/api/orders/:id/cancel`
Cancel order.

**Access:** Private (Customer/Host/Admin)  
**Request Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

### POST `/api/orders/:id/review`
Add review to order.

**Access:** Private (Customer/Host)  
**Request Body:**
```json
{
  "rating": 5,
  "review": "Excellent service and quality product!"
}
```

### GET `/api/orders/stats/summary`
Get order statistics.

**Access:** Private (Host/Admin)  
**Query Parameters:**
- `period` (number): Days to analyze

---

## Payments

### POST `/api/payments/webhook`
Handle Razorpay webhooks.

**Access:** Public (Webhook)

### POST `/api/payments/verify`
Verify payment signature.

**Access:** Private  
**Request Body:**
```json
{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_hash"
}
```

### GET `/api/payments/:id`
Get payment by ID.

**Access:** Private (Customer/Host/Admin)

### GET `/api/payments`
Get payments for current user.

**Access:** Private (Customer/Host)  
**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status
- `type`: "customer" | "host" | "all"

### POST `/api/payments/:id/refund`
Create refund for a payment.

**Access:** Private (Host/Admin)  
**Request Body:**
```json
{
  "amount": 500, // Optional, defaults to full amount
  "reason": "Customer requested refund"
}
```

### GET `/api/payments/stats/summary`
Get payment statistics.

**Access:** Private (Host/Admin)

---

## Payouts

### POST `/api/payouts`
Create a payout request.

**Access:** Private (Host)  
**Request Body:**
```json
{
  "amount": 2500, // Optional, defaults to available balance
  "orderIds": ["order1", "order2"], // Optional, defaults to all pending
  "bankDetails": {
    "accountNumber": "1234567890",
    "ifscCode": "HDFC0000123",
    "accountHolderName": "John Doe",
    "bankName": "HDFC Bank"
  }
}
```

### GET `/api/payouts`
Get payouts (host payouts or all for admin).

**Access:** Private (Host/Admin)

### GET `/api/payouts/:id`
Get payout by ID.

**Access:** Private (Host/Admin)

### POST `/api/payouts/:id/approve`
Approve payout.

**Access:** Private (Admin)

### POST `/api/payouts/:id/reject`
Reject payout.

**Access:** Private (Admin)

### POST `/api/payouts/:id/process`
Mark payout as processed.

**Access:** Private (Admin)

### GET `/api/payouts/stats/summary`
Get payout statistics.

**Access:** Private (Host/Admin)

### PUT `/api/payouts/bank-details`
Update bank details.

**Access:** Private (Host)

---

## Host Dashboard

### GET `/api/host/dashboard`
Get comprehensive dashboard overview.

**Access:** Private (Host)  
**Query Parameters:**
- `period` (number): Days to analyze (default: 30, max: 365)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalEarnings": 25000,
      "pendingPayouts": 5000,
      "activeListings": 8,
      "totalOrders": 150,
      "completionRate": 95.5,
      "averageRating": 4.8
    },
    "earnings": {
      "thisMonth": 8500,
      "lastMonth": 7200,
      "growth": 18.1,
      "timeline": [...]
    },
    "orders": {
      "pending": 3,
      "confirmed": 12,
      "inProgress": 8,
      "completed": 127
    },
    "topListings": [...],
    "recentActivities": [...],
    "upcomingEvents": [...]
  }
}
```

### GET `/api/host/analytics/earnings`
Get earnings analytics with breakdown.

**Access:** Private (Host)  
**Query Parameters:**
- `period` (number): Days to analyze
- `groupBy` (string): "hour" | "day" | "week" | "month"

### GET `/api/host/analytics/listings`
Get listing performance analytics.

**Access:** Private (Host)

### GET `/api/host/analytics/customers`
Get customer analytics.

**Access:** Private (Host)

### GET `/api/host/events/upcoming`
Get upcoming events and reminders.

**Access:** Private (Host)

---

## Admin Panel

### GET `/api/admin/overview`
Get platform overview dashboard.

**Access:** Private (Admin)  
**Query Parameters:**
- `period` (number): Days to analyze

**Response (200):**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalUsers": 5000,
      "totalHosts": 800,
      "totalListings": 1200,
      "totalOrders": 8500,
      "totalRevenue": 500000,
      "platformFee": 25000
    },
    "growth": {
      "usersGrowth": 12.5,
      "hostsGrowth": 8.3,
      "listingsGrowth": 15.2,
      "revenueGrowth": 22.1
    },
    "recentActivity": [...],
    "topCategories": [...],
    "topCities": [...]
  }
}
```

### GET `/api/admin/users`
Get all users with filtering.

**Access:** Private (Admin)  
**Query Parameters:**
- `page`, `limit`: Pagination
- `role`: "all" | "admin" | "host" | "customer"
- `status`: "all" | "verified" | "unverified" | "suspended"
- `search`: Search term
- `sortBy`, `sortOrder`: Sorting

### PUT `/api/admin/users/:id/status`
Update user status/verification.

**Access:** Private (Admin)  
**Request Body:**
```json
{
  "action": "verify", // "verify" | "suspend" | "activate" | "promote_to_host"
  "reason": "Manual verification completed"
}
```

### GET `/api/admin/listings`
Get all listings with admin controls.

**Access:** Private (Admin)

### PUT `/api/admin/listings/:id/status`
Update listing status.

**Access:** Private (Admin)  
**Request Body:**
```json
{
  "action": "approve", // "approve" | "reject" | "suspend" | "activate"
  "reason": "Listing meets platform standards"
}
```

### GET `/api/admin/analytics`
Get platform analytics.

**Access:** Private (Admin)

---

## Products (Legacy)

### GET `/api/products`
Get all products with filtering and pagination.

**Access:** Public (with optional auth for enhanced features)  
**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search term
- `sortBy`, `sortOrder`: Sorting

### GET `/api/products/:id`
Get single product with details.

**Access:** Public (with optional auth)

### POST `/api/products`
Create new product.

**Access:** Private (Admin only)

### PATCH `/api/products/:id`
Update product.

**Access:** Private (Admin only)

### DELETE `/api/products/:id`
Delete product.

**Access:** Private (Admin only)

### GET `/api/products/stats`
Get product statistics.

**Access:** Private (Admin only)

---

## Rentals (Legacy)

### POST `/api/rentals/check-availability`
Check availability for rental.

**Access:** Public (with optional auth)

### POST `/api/rentals/calculate-price`
Calculate rental price.

**Access:** Public (with optional auth)

### POST `/api/rentals/create`
Create booking.

**Access:** Private

### GET `/api/rentals`
Get rentals list.

**Access:** Private

### GET `/api/rentals/:id`
Get rental by ID.

**Access:** Private

### PATCH `/api/rentals/:id/status`
Update rental status.

**Access:** Private (Admin only)

### GET `/api/rentals/stats`
Get rental statistics.

**Access:** Private (Admin only)

---

## Error Handling

All API endpoints return errors in a consistent format:

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)",
  "errors": ["Validation errors array"],
  "timestamp": "2024-01-20T14:30:00.000Z",
  "path": "/api/listings/invalid-id"
}
```

### Common Error Types
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict
- `RATE_LIMIT`: Too many requests
- `SERVER_ERROR`: Internal server error

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

---

## Data Models

### User Model
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

### Listing Model
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
  "quantity": "Number",
  "condition": "new|like_new|good|fair|poor",
  "tags": "Array",
  "availability": "Object",
  "analytics": "Object",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Order Model
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

### Payment Model
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

### Payout Model
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

## Status Codes

### Success Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content to return

### Client Error Codes
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded

### Server Error Codes
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General endpoints**: 100 requests per 15 minutes per user
- **Admin endpoints**: 200 requests per 15 minutes per admin
- **File uploads**: 10 requests per minute per user

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

## Demo Accounts

For testing and demonstration purposes:

### Admin Account
- **Email:** `admin@demo.com`
- **Password:** `admin123`
- **Role:** Admin (full access)

### Host Account
- **Email:** `host@demo.com`
- **Password:** `host123`
- **Role:** Host (listing management)

### Customer Account
- **Email:** `customer@demo.com`
- **Password:** `customer123`
- **Role:** Customer (booking only)

---

## Testing

Use tools like Postman, Insomnia, or curl to test the API endpoints.

### Example Requests

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Get listings with filters
curl -X GET "http://localhost:5000/api/listings?category=electronics&city=Mumbai&page=1&limit=10" \
  -H "Content-Type: application/json"

# Create a new listing (requires auth)
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Camera","description":"Professional DSLR camera","category":"electronics","pricing":{"basePrice":500,"pricingModel":"daily"},"location":{"city":"Mumbai","state":"Maharashtra","pincode":"400001","address":"123 Main St"},"images":["image1.jpg"]}'
```

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All monetary values are in INR (Indian Rupees) as integers (no decimal places)
3. File uploads for images should be handled via separate endpoints
4. The API uses MongoDB ObjectId format for all ID fields
5. Pagination is 1-indexed (first page is page=1)
6. Boolean query parameters accept: `true`, `false`, `1`, `0`
7. Location coordinates are in [longitude, latitude] format for GeoJSON compliance
8. All user-generated content should be sanitized on the client side
9. Webhook endpoints require proper signature verification
10. Real-time features may require WebSocket connections (separate documentation)

---

## Changelog

### Version 2.0.0 (Current)
- Added P2P marketplace functionality
- Implemented multi-host support
- Added advanced analytics and dashboard
- Enhanced payment processing with Razorpay
- Added payout management system
- Implemented comprehensive admin panel

### Version 1.0.0 (Legacy)
- Basic rental management system
- Simple product and rental endpoints
- Basic authentication and authorization
