Love the energy — 20 hours is savage but totally doable if we execute like special ops. Below is a **military-grade, hour-by-hour plan + everything else** (DB schemas, folder structure, color theme, exact queries, snippets, best practices, test checklist, deploy checklist). Follow this _to the letter_, don’t add side features, and rehearse the demo.

Top rules (repeat out loud)
===========================

1. **Buy time with UX** — seed data + fast flows so you demo in 60s.
    
2. **One golden path** — customer books, admin picks up, admin returns. Make that flawless.
    
3. **Availability logic is sacred** — protect it with DB transactions + simple retry if needed.
    
4. **No premature scale features** — no emails, no external payments (simulate), no maps.
    

* * *

20-hour Hour-by-hour TODO (exact — follow strictly)
===================================================

Phase A — Setup & Core Backend (Hours 0–6)
------------------------------------------

0. [0:00–0:30] Kickoff & decisions (team roles, accounts, demo flow rehearsal). Create repo, branches: `main`, `dev`, `demo`.
    
1. [0:30–1:00] Create project skeleton (backend + frontend folders). Initialize git.
    
2. [1:00–2:00] Backend: `npm init` + install libs:
    
    * `express`, `mongoose`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `date-fns`, `cors`, `helmet`, `morgan`
        
    * dev: `nodemon`, `eslint`, `prettier`, `jest` (optional)
        
    * seed script file `scripts/seed.js`
        
3. [2:00–4:00] Implement Mongoose models (users, products, rentalOrders). Add indexes. (Schemas below.)
    
4. [4:00–5:00] Auth endpoints + middleware (register/login, JWT). Create role guard `isAdmin`.
    
5. [5:00–6:00] Product CRUD endpoints (admin protected). Also add simple validation.
    

Phase B — Availability Engine & Booking (Hours 6–12)
----------------------------------------------------

6. [6:00–7:30] Implement `/rentals/check-availability` and `/rentals/calculate-price` (server logic). Write unit test-ish manual checks via Postman.
    
7. [7:30–9:00] Implement `/rentals/create` with transaction & retry (code snippet below). On success return order.
    
8. [9:00–10:00] Admin order endpoints: `GET /rentals` (filter by status), `PATCH /rentals/:id/status`.
    
9. [10:00–11:00] Seed script with: 2 admins, 3 customers, 5 products (vary stock/pricing), multiple overlapping orders to demo non-availability.
    
10. [11:00–12:00] Basic logging, error handler, cors, security headers. Start local testing.
    

Phase C — Frontend (Hours 12–18)
--------------------------------

11. [12:00–12:30] Init React + Vite + Tailwind. Install `axios`, `react-router-dom`, `date-fns`, `headlessui`.
    
12. [12:30–14:00] Auth context and protected routing (JWT in localStorage; axios auth interceptor).
    
13. [14:00–16:00] Product list page (customer) + product detail page with date-range picker, price calc + check availability calls (debounced).
    
14. [16:00–17:00] Booking flow: Book button disabled unless checkAvailability returns true. Show simulated payment modal.
    
15. [17:00–17:30] Customer “My Bookings” page.
    
16. [17:30–18:30] Admin dashboard: products list, rentals list with status change buttons and late-fee calc UI.
    

Phase D — Polish, Testing & Demo (Hours 18–20)
----------------------------------------------

17. [18:30–19:00] Add status color chips, UX microcopy, edge-case error messages.
    
18. [19:00–19:30] Run concurrent booking test via small script to ensure no double booking. If failures, increase retry or lock.
    
19. [19:30–19:50] Deploy backend to Render / Railway or Heroku; frontend to Vercel / Netlify. Use free-tier.
    
20. [19:50–20:00] Final demo rehearsal (60–90s golden path + backup flows).
    

* * *

Colour scheme & theme (copyable tokens for Tailwind)
====================================================

Goal: clean, professional, modern + confident. Use soft dark accents and one strong brand color.

Primary (brand): `#0B63FF` — electric blue (calls-to-action)  
Accent / success: `#16A34A` (green)  
Warning / late fee: `#F97316` (orange)  
Danger: `#EF4444` (red)  
Background light: `#F8FAFC` (near-white)  
Surface / card: `#FFFFFF`  
Text primary: `#0F172A` (slate-900)  
Text muted: `#64748B` (slate-500)  
Border / divider: `#E6E9EE`

Tailwind `theme.extend` snippet (tailwind.config.js):

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0B63FF',
          50: '#eaf2ff',
          100: '#d6e7ff',
        },
        success: '#16A34A',
        danger: '#EF4444',
        warn: '#F97316',
        bg: '#F8FAFC'
      }
    }
  }
}
```

UI rules:

* Primary CTA: solid `brand` with white text.
    
* Secondary: outline `brand`.
    
* Status chips: green for `picked_up`, blue for `confirmed`, orange for `late`, gray for `returned`.
    
* Keep 8px baseline spacing, 12px base font, 16px body.
    

Typography: Inter (use Google Fonts) — size scale: 14 (body), 18 (lead), 24 (h2), 32 (h1).

* * *

Database schema (Mongoose-ready) — full fields + indexes
========================================================

**users.model.js**

```js
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique:true, index:true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer','admin'], default: 'customer' },
}, { timestamps: true });
```

**products.model.js**

```js
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, index:true },
  description: String,
  stock: { type: Number, required: true, min: 0 },
  pricing: [{
    unit: { type: String, enum: ['hour','day','week'], required: true },
    rate: { type: Number, required: true } // rupees/dollars etc
  }],
  images: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
```

**rentalOrder.model.js**

```js
const RentalOrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index:true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index:true },
  startTime: { type: Date, required: true, index:true },
  endTime: { type: Date, required: true, index:true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['confirmed','picked_up','returned','cancelled'], default: 'confirmed', index:true },
  lateFee: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
```

Indexes: compound index on `{ product, startTime, endTime }` helps queries. Also index status.

* * *

Availability logic — exact query + explanation (no magic)
=========================================================

**Overlap condition** (two intervals overlap if `not (existing.end <= new.start || existing.start >= new.end)`).

Mongoose query to count overlapping _active_ bookings:

```js
const overlappingCount = await RentalOrder.countDocuments({
  product: productId,
  status: { $in: ['confirmed','picked_up']},
  $or: [
    { startTime: { $lt: newEnd }, endTime: { $gt: newStart } }
  ]
});
```

Explanation: This counts orders where start < newEnd AND end > newStart ⇒ overlap.

**Available stock** = product.stock - overlappingCount.

Return `isAvailable = availableStock >= requestedQty` (usually qty=1 for hackathon; implement qty param if you want).

* * *

Atomic create booking (transaction + retry)
===========================================

Race condition scenario: two parallel requests both see availability and then create both — causing overbooking. Fix: use a **Mongo session transaction** and re-check within it.

Pseudo-code (Mongoose):

```js
async function createBooking(customerId, productId, start, end, qty=1) {
  const session = await mongoose.startSession();
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      session.startTransaction();
      const product = await Product.findById(productId).session(session);
      if (!product) throw new Error('Missing product');

      const count = await RentalOrder.countDocuments({
        product: productId,
        status: { $in: ['confirmed','picked_up'] },
        startTime: { $lt: end },
        endTime: { $gt: start }
      }).session(session);

      if (product.stock - count < qty) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, reason: 'not_available' };
      }

      const price = calculatePrice(product, start, end);
      const order = await RentalOrder.create([{
        customer: customerId, product: productId,
        startTime: start, endTime: end,
        totalPrice: price
      }], { session });

      await session.commitTransaction();
      session.endSession();
      return { success: true, order: order[0] };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      if (attempts >= 3) throw err;
      // small jitter before retry
      await new Promise(r => setTimeout(r, 50 + Math.random()*100));
    }
  }
}
```

This approach is good for the hackathon: simple, minimal infra (no Redis), and prevents most races. If you see occasional fails in stress testing, add a Redis-based lock.

* * *

Folder structures (copyable)
============================

Backend
-------

```
/backend
  /src
    /controllers
      auth.controller.js
      product.controller.js
      rental.controller.js
    /models
      user.model.js
      product.model.js
      rentalOrder.model.js
    /routes
      auth.routes.js
      product.routes.js
      rental.routes.js
    /middleware
      auth.middleware.js
      error.middleware.js
      validate.middleware.js
    /utils
      calcPrice.js
      availability.js
      logger.js
    app.js
    server.js
  /scripts
    seed.js
  .env
  package.json
  README.md
```

Frontend
--------

```
/frontend
  /src
    /api
      api.js        // axios instance
      auth.js
      products.js
      rentals.js
    /components
      Header.jsx
      Footer.jsx
      ProductCard.jsx
      BookingWidget.jsx
      DateRangePicker.jsx
      StatusChip.jsx
    /pages
      Home.jsx
      Login.jsx
      Register.jsx
      Products.jsx
      ProductDetail.jsx
      MyBookings.jsx
      AdminProducts.jsx
      AdminRentals.jsx
    /context
      AuthContext.jsx
    /styles
      tailwind.css
    main.jsx
    App.jsx
  package.json
```

* * *

API contract (concise)
======================

Auth

* `POST /api/auth/register` {name,email,password} → token
    
* `POST /api/auth/login` {email,password} → token
    

Products (admin)

* `GET /api/products`
    
* `POST /api/products`
    
* `PATCH /api/products/:id`
    
* `GET /api/products/:id`
    

Rentals

* `POST /api/rentals/check-availability` {productId, startTime, endTime, qty}
    
* `POST /api/rentals/calculate-price` {productId, startTime, endTime}
    
* `POST /api/rentals/create` {productId,startTime,endTime}
    
* `GET /api/rentals` (admin/all) or `/api/rentals?mine=true`
    
* `PATCH /api/rentals/:id/status` {status}
    

* * *

Best practices (must follow)
============================

1. **Keep secrets out of repo** — `.env` only. Use `.env.example`.
    
2. **Strict input validation** — use `express-validator` or small manual checks; always sanitize dates.
    
3. **Time handling** — store & operate on UTC. Display in local time on client using `date-fns-tz` if needed.
    
4. **Indexes** — ensure indexes on fields used for queries (`product`, `status`, `startTime`, `endTime`).
    
5. **Error handling** — a single error middleware that returns `{ error: true, message }`.
    
6. **Logging** — `morgan` + minimal custom logger. Print request IDs in logs for debugging.
    
7. **Small payloads** — paginate admin rentals (limit 50). Use projection to avoid heavy doc loads.
    
8. **Client performance** — debounce availability & price calls (300ms), cancel previous axios requests on new change.
    
9. **Accessibility** — use semantic HTML for forms; alt text for images.
    
10. **Security headers** — `helmet`, enable CORS only for allowed origins.
    
11. **Use transactions** for booking creation** — as provided above.
    
12. **Seed & demo accounts** — script must create admin: `admin@demo.com / p@ssw0rd` and user `user@demo.com / p@ssw0rd`.
    
13. **One-liner start commands**:
    

* backend: `npm run dev`
    
* frontend: `npm run dev`  
    Put these in README for judges.
    

* * *

Performance & stability tips (quick wins)
=========================================

* Serve images from CDN or use small placeholders in demo.
    
* Avoid N+1 in backend queries: use `.populate()` only where needed.
    
* Limit response size: admin list endpoint supports `?limit=20&page=1`.
    
* For concurrent testing: run a small Node script that fires 20 `create` requests for the same slot—verify no overbookings.
    
* Keep DB indexes lean; don’t over-index.
    

* * *

QA checklist (before presenting)
================================

*  Golden path: customer books — admin picks up — admin returns.
    
*  Check availability demo: show previously seeded overlapping booking and show blocked UI.
    
*  Concurrent booking test passed (run script).
    
*  Seeded accounts work; auto-logged in for demo.
    
*  All buttons have loading states and error states.
    
*  No console errors; no CORS issues; env variables set.
    
*  Small README with demo script & credentials.
    

* * *

Demo script (60–90 seconds — memorize)
======================================

1. Landing page: show product tiles (quick).
    
2. Click a product → date-range `A → B` → show price instantly.
    
3. Click `Check availability` → green (available) or red (not available) (use seeded conflicts for drama).
    
4. Book (simulate payment modal) → success → redirect to `My Bookings`.
    
5. Switch to Admin dashboard → show that new booking appears → click `Mark Picked Up` → status updates.
    
6. Click `Mark Returned` (if returned late, show auto late fee calc).
    
7. Final: show how overbooking prevented earlier.
    

Practice this twice — time it.

* * *

Final deliverables I can produce right now (fast)
=================================================

* Complete backend boilerplate (models, controllers, availability logic + transaction snippet).
    
* Frontend skeleton with Auth context + product list + booking widget (with date picker).
    
* Seed script ready to run.
    
* Concurrent test script.
    

Tell me which of those you want me to output first and I’ll generate it (I can post-ready files/snippets you can paste). Which—backend boilerplate, frontend skeleton, or both?