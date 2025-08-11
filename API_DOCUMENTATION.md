# API Documentation

## Overview

This is the API documentation for the Rental Management System. The API provides endpoints for user authentication, product management, and rental operations with role-based access control.

**Base URL:** `http://localhost:5000/api` (development)  
**Authentication:** JWT Bearer Token  
**Content-Type:** `application/json`

## Table of Contents

1. [Authentication](#authentication)
2. [Products](#products)
3. [Rentals](#rentals)
4. [Error Handling](#error-handling)
5. [Data Models](#data-models)
6. [Status Codes](#status-codes)

---

## Authentication

All authentication endpoints are prefixed with `/api/auth`.

### Register User

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
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
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login User

**POST** `/api/auth/login`

Authenticate user and receive access token.

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

### Get User Profile

**GET** `/api/auth/profile`

Get current authenticated user's profile.

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
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update User Profile

**PUT** `/api/auth/profile`

Update current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

### Change Password

**POST** `/api/auth/change-password`

Change current user's password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

### Logout

**POST** `/api/auth/logout`

Logout current user (invalidates token).

**Headers:**
```
Authorization: Bearer <token>
```

---

## Products

All product endpoints are prefixed with `/api/products`.

### Get All Products

**GET** `/api/products`

Get list of all products with optional filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)
- `search` (string): Search by name or description
- `sortBy` (string): Sort field (name, createdAt, stock)
- `sortOrder` (string): Sort order (asc, desc)

**Example Request:**
```
GET /api/products?page=1&limit=10&search=camera&sortBy=name&sortOrder=asc
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "64a1b2c3d4e5f6789abc456",
        "name": "Professional Camera",
        "description": "High-quality DSLR camera for photography",
        "stock": 5,
        "pricing": [
          {
            "unit": "day",
            "rate": 150
          },
          {
            "unit": "week",
            "rate": 900
          }
        ],
        "images": ["image1.jpg", "image2.jpg"],
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Get Single Product

**GET** `/api/products/:id`

Get detailed information about a specific product.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "64a1b2c3d4e5f6789abc456",
      "name": "Professional Camera",
      "description": "High-quality DSLR camera for photography",
      "stock": 5,
      "pricing": [
        {
          "unit": "day",
          "rate": 150
        },
        {
          "unit": "week",
          "rate": 900
        }
      ],
      "images": ["image1.jpg", "image2.jpg"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Create Product (Admin Only)

**POST** `/api/products`

Create a new product. Requires admin role.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Professional Camera",
  "description": "High-quality DSLR camera for photography",
  "stock": 5,
  "pricing": [
    {
      "unit": "day",
      "rate": 150
    },
    {
      "unit": "week",
      "rate": 900
    }
  ],
  "images": ["image1.jpg", "image2.jpg"]
}
```

### Update Product (Admin Only)

**PATCH** `/api/products/:id`

Update an existing product. Requires admin role.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:** (partial update supported)
```json
{
  "stock": 8,
  "pricing": [
    {
      "unit": "day",
      "rate": 175
    }
  ]
}
```

### Delete Product (Admin Only)

**DELETE** `/api/products/:id`

Delete a product. Requires admin role.

**Headers:**
```
Authorization: Bearer <admin_token>
```

### Get Product Statistics (Admin Only)

**GET** `/api/products/stats`

Get product statistics and analytics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalProducts": 25,
    "totalStock": 150,
    "averagePrice": 125.50,
    "mostRentedProducts": [
      {
        "productId": "64a1b2c3d4e5f6789abc456",
        "name": "Professional Camera",
        "rentalCount": 45
      }
    ]
  }
}
```

---

## Rentals

All rental endpoints are prefixed with `/api/rentals`.

### Check Availability

**POST** `/api/rentals/check-availability`

Check if a product is available for a specific time period.

**Request Body:**
```json
{
  "productId": "64a1b2c3d4e5f6789abc456",
  "startTime": "2024-02-15T09:00:00.000Z",
  "endTime": "2024-02-17T18:00:00.000Z",
  "quantity": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true,
    "availableStock": 3,
    "requestedQuantity": 1,
    "conflictingBookings": []
  }
}
```

### Calculate Price

**POST** `/api/rentals/calculate-price`

Calculate rental price for a specific time period.

**Request Body:**
```json
{
  "productId": "64a1b2c3d4e5f6789abc456",
  "startTime": "2024-02-15T09:00:00.000Z",
  "endTime": "2024-02-17T18:00:00.000Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalPrice": 300,
    "breakdown": {
      "days": 2,
      "dailyRate": 150,
      "basePrice": 300,
      "discounts": 0,
      "fees": 0
    }
  }
}
```

### Create Booking

**POST** `/api/rentals/create`

Create a new rental booking. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "productId": "64a1b2c3d4e5f6789abc456",
  "startTime": "2024-02-15T09:00:00.000Z",
  "endTime": "2024-02-17T18:00:00.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "_id": "64a1b2c3d4e5f6789abc789",
      "customer": "64a1b2c3d4e5f6789abc123",
      "product": {
        "_id": "64a1b2c3d4e5f6789abc456",
        "name": "Professional Camera"
      },
      "startTime": "2024-02-15T09:00:00.000Z",
      "endTime": "2024-02-17T18:00:00.000Z",
      "totalPrice": 300,
      "status": "confirmed",
      "lateFee": 0,
      "createdAt": "2024-01-20T14:30:00.000Z"
    }
  }
}
```

### Get Rentals

**GET** `/api/rentals`

Get list of rental bookings. Returns user's own bookings for customers, all bookings for admins.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)
- `status` (string): Filter by status (confirmed, picked_up, returned, cancelled)
- `mine` (boolean): Get only current user's bookings (for admins)
- `sortBy` (string): Sort field (createdAt, startTime, endTime)
- `sortOrder` (string): Sort order (asc, desc)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rentals": [
      {
        "_id": "64a1b2c3d4e5f6789abc789",
        "customer": {
          "_id": "64a1b2c3d4e5f6789abc123",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "product": {
          "_id": "64a1b2c3d4e5f6789abc456",
          "name": "Professional Camera"
        },
        "startTime": "2024-02-15T09:00:00.000Z",
        "endTime": "2024-02-17T18:00:00.000Z",
        "totalPrice": 300,
        "status": "confirmed",
        "lateFee": 0,
        "createdAt": "2024-01-20T14:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Get Single Rental

**GET** `/api/rentals/:id`

Get detailed information about a specific rental booking.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rental": {
      "_id": "64a1b2c3d4e5f6789abc789",
      "customer": {
        "_id": "64a1b2c3d4e5f6789abc123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "product": {
        "_id": "64a1b2c3d4e5f6789abc456",
        "name": "Professional Camera",
        "description": "High-quality DSLR camera"
      },
      "startTime": "2024-02-15T09:00:00.000Z",
      "endTime": "2024-02-17T18:00:00.000Z",
      "totalPrice": 300,
      "status": "picked_up",
      "lateFee": 0,
      "createdAt": "2024-01-20T14:30:00.000Z",
      "updatedAt": "2024-02-15T09:15:00.000Z"
    }
  }
}
```

### Update Rental Status (Admin Only)

**PATCH** `/api/rentals/:id/status`

Update the status of a rental booking. Requires admin role.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "picked_up"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Rental status updated successfully",
  "data": {
    "rental": {
      "_id": "64a1b2c3d4e5f6789abc789",
      "status": "picked_up",
      "lateFee": 0,
      "updatedAt": "2024-02-15T09:15:00.000Z"
    }
  }
}
```

### Get Rental Statistics (Admin Only)

**GET** `/api/rentals/stats`

Get rental statistics and analytics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalRentals": 150,
    "activeRentals": 25,
    "totalRevenue": 45000,
    "averageRentalDuration": 3.5,
    "statusBreakdown": {
      "confirmed": 10,
      "picked_up": 15,
      "returned": 120,
      "cancelled": 5
    }
  }
}
```

---

## Error Handling

All API endpoints return errors in a consistent format:

### Error Response Format

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2024-01-20T14:30:00.000Z",
  "path": "/api/products/invalid-id"
}
```

### Common Error Types

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (e.g., email already exists)
- `RATE_LIMIT`: Too many requests
- `SERVER_ERROR`: Internal server error

### Validation Errors

Validation errors include detailed field-level information:

```json
{
  "error": true,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
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
}
```

---

## Data Models

### User Model

```json
{
  "_id": "64a1b2c3d4e5f6789abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "customer", // "customer" | "admin"
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Product Model

```json
{
  "_id": "64a1b2c3d4e5f6789abc456",
  "name": "Professional Camera",
  "description": "High-quality DSLR camera for photography",
  "stock": 5,
  "pricing": [
    {
      "unit": "hour", // "hour" | "day" | "week"
      "rate": 25
    }
  ],
  "images": ["image1.jpg", "image2.jpg"],
  "createdBy": "64a1b2c3d4e5f6789abc123",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Rental Order Model

```json
{
  "_id": "64a1b2c3d4e5f6789abc789",
  "customer": "64a1b2c3d4e5f6789abc123",
  "product": "64a1b2c3d4e5f6789abc456",
  "startTime": "2024-02-15T09:00:00.000Z",
  "endTime": "2024-02-17T18:00:00.000Z",
  "totalPrice": 300,
  "status": "confirmed", // "confirmed" | "picked_up" | "returned" | "cancelled"
  "lateFee": 0,
  "createdAt": "2024-01-20T14:30:00.000Z"
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

## Demo Accounts

For testing and demonstration purposes, the following accounts are available:

### Admin Account
- **Email:** `admin@demo.com`
- **Password:** `p@ssw0rd`
- **Role:** Admin (full access)

### Customer Account
- **Email:** `user@demo.com`
- **Password:** `p@ssw0rd`
- **Role:** Customer (limited access)

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General endpoints**: 100 requests per 15 minutes per user
- **Admin endpoints**: 200 requests per 15 minutes per admin

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All monetary values are in the base currency (no decimal places for cents)
3. File uploads for product images should be handled separately via a file upload endpoint
4. The API uses MongoDB ObjectId format for all ID fields
5. Pagination is 1-indexed (first page is page=1)
6. Boolean query parameters accept: `true`, `false`, `1`, `0`
