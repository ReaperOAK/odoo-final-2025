
# Frontend Engineer TODOs (Detailed)

## Phase C — Frontend (Hours 12–18)

### 1. Project Setup
- [ ] Initialize React app with Vite in `/frontend` folder
- [ ] Install and configure TailwindCSS (add to `tailwind.config.js` with provided color tokens)
- [ ] Install dependencies: `axios`, `react-router-dom`, `date-fns`, `headlessui`, `@headlessui/react`, `@heroicons/react`
- [ ] Set up folder structure as per plan (`/src/api`, `/src/components`, `/src/pages`, `/src/context`, `/src/styles`)
- [ ] Add Inter font via Google Fonts in `index.html` and Tailwind config
- [ ] Create `tailwind.css` and import in `main.jsx`
- [ ] Add favicon and meta tags for PWA basics

### 2. Auth & Routing
- [ ] Create `AuthContext.jsx` for JWT auth state, login/logout/register methods
- [ ] Implement `ProtectedRoute` component for route guarding
- [ ] Set up `react-router-dom` routes in `App.jsx` for all pages
- [ ] Store JWT in `localStorage` (never in cookies)
- [ ] Create Axios instance (`/api/api.js`) with baseURL and JWT auth interceptor
- [ ] Implement login/register forms (`Login.jsx`, `Register.jsx`) with validation and error handling
- [ ] Show error/success toasts for auth actions

### 3. Product List & Details (Customer)
- [ ] Create `Products.jsx` page: fetch and display products in responsive grid using `ProductCard.jsx`
- [ ] `ProductCard.jsx`: show image, name, price, stock, and CTA button
- [ ] On click, navigate to `ProductDetail.jsx` (dynamic route)
- [ ] `ProductDetail.jsx`: show product info, images carousel, and booking widget
- [ ] Implement `DateRangePicker.jsx` (use `date-fns` for date logic)
- [ ] Add price calculation and check availability (debounced, 300ms) via `/api/rentals/check-availability` and `/api/rentals/calculate-price`
- [ ] Show loading, error, and unavailable states in booking widget
- [ ] Disable Book button unless available

### 4. Booking Flow
- [ ] On Book, show simulated payment modal (use HeadlessUI modal)
- [ ] On confirm, call `/api/rentals/create` and handle response
- [ ] On success, redirect to `MyBookings.jsx` and show toast
- [ ] Handle and display booking errors (e.g., not available, server error)

### 5. Customer “My Bookings”
- [ ] Create `MyBookings.jsx`: fetch user’s bookings, show in table/list
- [ ] Use `StatusChip.jsx` for booking status (color-coded)
- [ ] Show booking details, status, and late fee if any
- [ ] Add loading, empty, and error states

### 6. Admin Dashboard
- [ ] Create `AdminProducts.jsx`: list all products, add/edit/delete (CRUD)
- [ ] Create `AdminRentals.jsx`: list all rentals, filter by status, paginate (limit 20/page)
- [ ] Add status change buttons (Mark Picked Up, Mark Returned)
- [ ] Show late fee calculation UI for late returns
- [ ] Use modals for edit/delete confirmations
- [ ] Add loading, error, and empty states

## Phase D — Polish, Testing & Demo (Hours 18–20)

### 7. UI/UX Polish
- [ ] Add status color chips everywhere (use provided color tokens)
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

- [ ] Use provided color scheme and typography (Inter, Tailwind tokens)
- [ ] Mobile-first, responsive design (test on multiple devices)
- [ ] Semantic HTML, accessibility (alt text, ARIA labels, keyboard navigation)
- [ ] Debounce availability & price calls (300ms), cancel previous axios requests on new change
- [ ] All interactive elements have hover, active, and disabled states
- [ ] Use loading indicators for all async actions (spinners, skeletons)
- [ ] Register all new files/components in correct modules/routes
- [ ] Update docs and README after code changes
- [ ] Keep code DRY, modular, and well-commented
- [ ] Use ESLint and Prettier for code style
- [ ] No sensitive data in localStorage (JWT only)
- [ ] Strict CORS and CSP headers (backend)

---

### Deliverables
- [ ] Fully functional, responsive frontend with all flows
- [ ] All components registered and documented
- [ ] README with setup, usage, and demo script
