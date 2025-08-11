# Rental Management System

A high-performance rental management system built with React frontend and Node.js/Express backend.

## Quick Start

### Prerequisites
- Node.js (>=18.0.0)
- npm (>=9.0.0)
- MongoDB (running locally or connection string in .env)

### Installation & Setup

1. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env` in the backend directory
   - Configure your MongoDB connection and other settings

3. **Seed the database** (optional):
   ```bash
   npm run seed:dev
   ```

4. **Start the application**:
   ```bash
   npm start
   ```

This will start both the backend server and frontend development server concurrently.

## Available Scripts

### Production
- `npm start` - Start both frontend and backend in production mode
- `npm run build` - Build the frontend for production

### Development
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:backend` - Start only the backend in development mode
- `npm run dev:frontend` - Start only the frontend in development mode

### Individual Services
- `npm run start:backend` - Start only the backend in production mode
- `npm run start:frontend` - Start only the frontend development server

### Database
- `npm run seed` - Seed the database with sample data (production)
- `npm run seed:dev` - Seed the database with sample data (development)

### Utilities
- `npm run install:all` - Install dependencies for root, backend, and frontend
- `npm run lint` - Run linting for both frontend and backend
- `npm run test` - Run backend tests

## Demo Accounts

After seeding the database, you can use these accounts:

- **Admin**: `admin@demo.com` / `p@ssw0rd`
- **User**: `user@demo.com` / `p@ssw0rd`

## Project Structure

```
├── backend/          # Node.js/Express API server
├── frontend/         # React application
├── docs/            # Documentation
└── package.json     # Root package with scripts to run both services
```

## Ports

- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:3000 (Express API)

## Features

- 🔐 Role-based authentication (Admin/User)
- 📅 Real-time availability checking
- 💰 Dynamic pricing calculation
- 📱 Responsive design
- 🔒 Comprehensive security measures
- 🚀 High-performance architecture

## API Documentation

See [COMPREHENSIVE_API_DOCUMENTATION.md](./COMPREHENSIVE_API_DOCUMENTATION.md) for detailed API reference with all endpoints, data models, and examples.
