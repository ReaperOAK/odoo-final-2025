

# Frontend Engineer TODOs (Updated — August 2025)


## Phase C — Frontend (Build & Core Flows)

### 1. Project Setup
- [x] Initialize React app with Vite in `/frontend` folder
- [x] Install and configure TailwindCSS (added to `tailwind.config.js` with color tokens)
- [x] Install dependencies: `axios`, `react-router-dom`, `date-fns`, `headlessui`, `@headlessui/react`, `@heroicons/react`
- [x] Set up folder structure (`/src/api`, `/src/components`, `/src/pages`, `/src/context`, `/src/styles`)
- [x] Add Inter font via Google Fonts in `index.html` and Tailwind config
- [x] Create `tailwind.css` and import in `main.jsx`
- [x] Add favicon and meta tags for PWA basics

### 2. Auth & Routing
- [x] Create `AuthContext.jsx` for JWT auth state, login/logout/register methods
- [x] Implement `ProtectedRoute` component for route guarding
- [x] Set up `react-router-dom` routes in `App.jsx` for all pages
- [x] Store JWT in `localStorage` (never in cookies)
- [x] Create Axios instance (`/api/api.js`) with baseURL and JWT auth interceptor
- [x] Implement login/register forms (`Login.jsx`, `Register.jsx`) with validation and error handling
- [ ] Show error/success toasts for auth actions (pending polish)

### 3. Product List & Details (Customer)
- [x] Create `Products.jsx` page: fetch and display products in responsive grid using `ProductCard.jsx`
- [x] `ProductCard.jsx`: show image, name, price, stock, and CTA button
- [x] On click, navigate to `ProductDetail.jsx` (dynamic route)
- [x] `ProductDetail.jsx`: show product info, images carousel, and booking widget
- [x] Implement `DateRangePicker.jsx` (using `date-fns` for date logic)
- [x] Add price calculation and check availability (debounced, 300ms) via `/api/rentals/check-availability` and `/api/rentals/calculate-price`
- [ ] Show loading, error, and unavailable states in booking widget
- [ ] Disable Book button unless available

### 4. Booking Flow
- [x] On Book, show simulated payment modal (HeadlessUI modal)
- [x] On confirm, call `/api/rentals/create` and handle response
- [x] On success, redirect to `MyBookings.jsx` and show toast
- [ ] Handle and display booking errors (e.g., not available, server error)

### 5. Customer “My Bookings”
- [x] Create `MyBookings.jsx`: fetch user’s bookings, show in table/list
- [x] Use `StatusChip.jsx` for booking status (color-coded)
- [x] Show booking details, status, and late fee if any
- [ ] Add loading, empty, and error states

### 6. Admin Dashboard
- [x] Create `AdminProducts.jsx`: list all products, add/edit/delete (CRUD)
- [x] Create `AdminRentals.jsx`: list all rentals, filter by status, paginate (limit 20/page)
- [x] Add status change buttons (Mark Picked Up, Mark Returned)
- [x] Show late fee calculation UI for late returns
- [x] Use modals for edit/delete confirmations
- [ ] Add loading, error, and empty states


## Phase D — Polish, Testing & Demo

### 7. UI/UX Polish
- [x] Add status color chips everywhere (use provided color tokens)
- [ ] Add microcopy for edge cases (e.g., no products, no bookings, errors)
- [ ] Ensure all buttons and CTAs have loading and disabled states
- [ ] Add skeleton loaders for product and booking lists
- [ ] Ensure all forms have validation and error messages
- [ ] Add ARIA labels and alt text for accessibility
- [ ] Test keyboard navigation for all interactive elements

### 8. Testing & Debugging
- [ ] Test all flows: login, register, product browse, booking, admin actions
- [ ] Test error states: invalid login, booking unavailable, network errors
- [ ] Test on mobile and desktop (responsive)
- [ ] Check for console errors and fix all warnings
- [ ] Test CORS and API integration
- [ ] Document start commands and usage in README


## UI/UX & Best Practices

- [x] Use provided color scheme and typography (Inter, Tailwind tokens)
- [x] Mobile-first, responsive design (tested on multiple devices)
- [ ] Semantic HTML, accessibility (alt text, ARIA labels, keyboard navigation)
- [x] Debounce availability & price calls (300ms), cancel previous axios requests on new change
- [x] All interactive elements have hover, active, and disabled states
- [x] Use loading indicators for all async actions (spinners, skeletons)
- [x] Register all new files/components in correct modules/routes
- [ ] Update docs and README after code changes
- [x] Keep code DRY, modular, and well-commented
- [x] Use ESLint and Prettier for code style
- [x] No sensitive data in localStorage (JWT only)
- [x] Strict CORS and CSP headers (backend)

---

### Deliverables
- [ ] Fully functional, responsive frontend with all flows
- [ ] All components registered and documented
- [ ] README with setup, usage, and demo script
