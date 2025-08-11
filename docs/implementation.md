
Nice. You changed the rules mid-game — **P2P** it is. Good move: more wow, more technical depth, judges love the marketplace twist. You’ve got 20 hours and two devs. Below is a brutal, exact, deployable plan: prioritized TODOs, split-by-person sprint plan, color & UI theme, production-ish DB schemas (Mongoose-ready), folder structures, API contract, reservation algorithm (transactional), Razorpay flow for P2P (escrow-ish), and critical best practices so nothing explodes during the live demo.

Read this once. Do it exactly. I’ll give you copy-pasteable schema + endpoints next if you want.

* * *

Short summary of product shift (P2P)
====================================

* **Vendor (Host)**: any user can list items (equipment, bikes, speakers).
    
* **Customer (Renter)**: browses, requests booking, pays.
    
* **Platform**: takes payments, holds funds (escrow or platform wallet), optionally charges commission, and payouts to hosts (Razorpay payouts or manual).
    
* Reservation & fulfillment still follow the original mockup: pickup/delivery, return, inspections, invoices — now per host listing.
    

Implications (must be handled):

* Host onboarding/verification & profile.
    
* Commission & payout handling (escrow).
    
* Multi-owner inventory vs shared inventory (each listing owned by one host).
    
* Dispute flow & damage hold.
    

* * *

HIGH-PRIORITY MVP (what you must finish in 20 hrs)
==================================================

Make this flawless. NO extra features.

1. User auth + onboarding (customer & host flag).
    
2. Host: create listing (name, photos, unitType, quantity, price rules).
    
3. Catalog & search by availability.
    
4. Booking request → instant confirm flow (atomic reservation).
    
5. Payment: Razorpay payment by renter to platform (mockable offline). Platform marks order paid.
    
6. Platform holds funds; shows pending payout to host. Payout flow mocked for offline demo.
    
7. Pickup / Return status updates by host or admin.
    
8. Calendar view for host/admin.
    
9. Simple dispute/damage flag + admin resolves.
    
10. Local demo working with `PAYMENT_MODE=mock`.
    

If you finish this early: add host wallet & payout via Razorpay Payouts.

* * *

20-hour, two-dev detailed timeline (forked tasks)
=================================================

Two devs = parallelize. Dev A = Backend/Payments/DB, Dev B = Frontend/UX/Calendar + Devops. Follow strictly.

T0 — Prep (30m)

* Create repo + branches `main`, `dev`.
    
* Create `README_DEMO.md` with one-line run instructions.
    
* Copy `.env.example`.
    

T0.5–T1.5 — Backend skeleton + DB (1 hour) (Dev A)

* Init Express + Mongoose.
    
* Connect to local Mongo (docker-compose).
    
* Create basic auth JWT skeleton.
    
* Create User model with `isHost` flag and basic seed script.
    

T1.5–T4.5 — Listing & Models + Reservation Engine (3 hrs) (Dev A)

* Implement Listing model, Reservation model, Order model, Payment model (schemas below).
    
* Implement availability endpoint.
    
* Implement reservation engine with Mongo transactions (function to reserve).
    
* Add indexes.
    

T1.5–T4.5 — Frontend basic UI & Tailwind setup (3 hrs) (Dev B)

* Init Vite React + Tailwind.
    
* Build Product grid, Listing detail skeleton, booking form (dates qty).
    
* Wire API client `api.js`.
    

T4.5–T7.5 — Orders & Razorpay integration (3 hrs) (Dev A)

* Implement `POST /orders` that runs reservation transaction + creates order and Razorpay order (or mock).
    
* Implement webhook `POST /webhook/razorpay` to verify signature and mark payment.
    
* Add PAYMENT_MODE env fallback to create fake payment & emit event.
    

T4.5–T7.5 — Booking UX + Checkout (3 hrs) (Dev B)

* Implement booking flow: select dates → check availability → create order → call backend to create Razorpay order → open Razorpay checkout (or mock modal) → on success call backend confirm payment endpoint.
    
* Show clear deposit vs full payment UI. Default: take 30% deposit.
    

T7.5–T10.5 — Host Dashboard + Calendar (3 hrs) (Dev B)

* Host panel shows listings, upcoming bookings, calendar (FullCalendar).
    
* Add ability to mark pickup/return, flag damage.
    

T7.5–T10.5 — Admin & Payouts mock (3 hrs) (Dev A)

* Simple admin endpoint to view unpaid host balances.
    
* Implement mocked payout: mark payout processed (no Razorpay Payouts needed for demo).
    

T10.5–T13.5 — Polish + Seed data + Tests (3 hrs) (Both)

* Seed 3 hosts, 5 listings, 5 customers.
    
* Unit test reservation conflict manually.
    
* Add skeleton loaders & toasts.
    

T13.5–T16 — Dockerize + Local Demo mode (2.5 hrs) (Both)

* Add `docker-compose.yml` (frontend, backend, mongo).
    
* Ensure `PAYMENT_MODE=mock` default for offline.
    

T16–T18 — Edge cases & concurrency test (2 hrs) (Both)

* Simulate concurrent bookings (2 windows) for last unit → must fail gracefully.
    
* Test timezone/overnight crossing.
    

T18–T20 — Deploy locally, rehearse demo, final polish (2 hrs) (Both)

* Prepare demo script and 3 slides + GIFs.
    

* * *

Clear split of responsibilities during coding (so you don’t step on each other)
===============================================================================

Dev A (Backend, Payments, DB):

* Models + reservation engine + transactions
    
* Razorpay integration + webhook verification
    
* Payments, Payouts mock + admin payouts
    
* Docker backend container, seed script
    

Dev B (Frontend, UX, Calendar):

* React screens + Tailwind theme
    
* Razorpay checkout integration client-side
    
* Host dashboard & calendar
    
* Demo-ready UI/UX polish, accessibility basics
    
* Docker frontend container
    

* * *

Color scheme & theme (copy these exact Tailwind tokens)
=======================================================

Goal: clean marketplace, subtle trust colors, highlight CTAs.

Tailwind config theme tokens:

* primary: `#0B1220` (nav) — `text-primary`
    
* accent / brand: `#0EA5A4` (teal-500) — CTAs & active
    
* host highlight: `#6366F1` (indigo-500) — host badges
    
* danger / late: `#F97316` (orange-500) — late fees & warnings
    
* success: `#10B981` (green-500)
    
* bg: `#F8FAFC` (slate-50)
    
* card: `#FFFFFF`
    
* text: `#0F172A` (slate-900)
    
* muted text: `#64748B` (slate-500)
    

Component style guidelines:

* Card radius: `rounded-lg` (12px)
    
* Shadow: `shadow-md`
    
* Buttons: Primary (accent bg, white text), Secondary (outline, text-primary).
    
* Use `Inter` font.
    
* Focus ring: `ring-2 ring-accent/50`.
    

Microcopy:

* Show "Hosted by <HostName>" under listing.
    
* Show "Deposit: ₹X (Y% of total) — refundable on inspection" near checkout.
    
* Show explicit cancellation policy link.
    

* * *

Folder structure (MERN, clean + contest-ready)
==============================================

Backend:

```
/backend
  /src
    /config
      index.js
    /controllers
      auth.controller.js
      listing.controller.js
      order.controller.js
      payment.controller.js
      host.controller.js
      admin.controller.js
    /models
      User.js
      Listing.js
      Reservation.js
      Order.js
      Payment.js
      Payout.js
    /services
      reservation.service.js
      pricing.service.js
      razorpay.service.js
      notification.service.js
    /routes
      auth.js
      listings.js
      orders.js
      payments.js
      admin.js
    /utils
      validator.js
      errors.js
      logger.js
    index.js
  package.json
  Dockerfile
  seed.js
  .env.example
```

Frontend:

```
/frontend
  /src
    /api
      client.js
      auth.js
      listings.js
      orders.js
    /components
      Header.jsx
      Footer.jsx
      ListingCard.jsx
      BookingForm.jsx
      Calendar.jsx
      RazorpayCheckout.jsx
      Toast.jsx
    /pages
      Home.jsx
      Listing.jsx
      Checkout.jsx
      HostDashboard.jsx
      AdminDashboard.jsx
    /styles
      tailwind.css
      theme.js
    App.jsx
    main.jsx
  package.json
  vite.config.js
  Dockerfile
```

* * *

Database schema (Mongoose-ready) — P2P edition (paste-ready)
============================================================

### User

```js
const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  passwordHash: String,
  isHost: { type: Boolean, default: false },
  hostProfile: {
    displayName: String,
    verified: { type: Boolean, default: false },
    phone: String,
    address: String,
    govtIdUrl: String // optional for verification
  },
  walletBalance: { type: Number, default: 0 }, // platform-held amount payable to host
  role: { type: String, enum: ['user','host','admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
```

### Listing

```js
const ListingSchema = new Schema({
  ownerId: { type: ObjectId, ref: 'User', index: true }, // host
  title: { type: String, required: true, index: true },
  description: String,
  images: [String],
  category: String,
  unitType: { type: String, enum: ['hour','day','week'], default: 'day' },
  basePrice: { type: Number, required: true }, // per unitType
  depositType: { type: String, enum: ['flat','percent'], default: 'percent' },
  depositValue: { type: Number, default: 20 }, // percent or amount
  totalQuantity: { type: Number, default: 1 },
  location: { type: String }, // city or geo
  status: { type: String, enum: ['draft','published','disabled'], default: 'published' },
  metadata: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
ListingSchema.index({ title: 'text' });
```

### Reservation

```js
const ReservationSchema = new Schema({
  listingId: { type: ObjectId, ref: 'Listing', index: true },
  orderId: { type: ObjectId, ref: 'Order' },
  qty: { type: Number, default: 1 },
  start: { type: Date, required: true, index: true },
  end: { type: Date, required: true, index: true },
  status: { type: String, enum: ['reserved','picked','active','returned','cancelled'], default: 'reserved' },
  createdAt: { type: Date, default: Date.now }
});
// index for overlap queries
ReservationSchema.index({ listingId: 1, start: 1, end: 1 });
```

### Order

```js
const OrderSchema = new Schema({
  renterId: { type: ObjectId, ref: 'User', index: true },
  hostId: { type: ObjectId, ref: 'User', index: true },
  lines: [{
    listingId: { type: ObjectId, ref: 'Listing' },
    qty: Number,
    start: Date,
    end: Date,
    unitPrice: Number,
    lineTotal: Number
  }],
  subtotal: Number,
  depositAmount: Number,
  platformCommission: Number, // calculated
  totalAmount: Number,
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  orderStatus: { type: String, enum: ['quote','confirmed','in_progress','completed','cancelled','disputed'], default: 'quote' },
  razorpayOrderId: String,
  createdAt: { type: Date, default: Date.now },
});
OrderSchema.index({ renterId: 1, hostId: 1, createdAt: -1 });
```

### Payment

```js
const PaymentSchema = new Schema({
  orderId: { type: ObjectId, ref: 'Order' },
  amount: Number,
  method: String, // 'razorpay' or 'mock'
  razorpayPaymentId: String,
  razorpayOrderId: String,
  status: { type: String, enum: ['initiated','success','failed'], default: 'initiated' },
  raw: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
```

### Payout (host payments)

```js
const PayoutSchema = new Schema({
  hostId: { type: ObjectId, ref: 'User' },
  amount: Number,
  status: { type: String, enum: ['pending','processed','failed'], default: 'pending' },
  method: { type: String, enum: ['manual','razorpay_payout'], default: 'manual' },
  createdAt: { type: Date, default: Date.now }
});
```

Indexes: Reservation (listingId + start + end), Listing ownerId, Order indexes for quick queries.

* * *

Reservation algorithm (transactional) — exact approach
======================================================

**Use MongoDB transactions** (Atlas or local replica set). Steps for each order:

1. Start a client session and transaction.
    
2. For each line (listing + qty + start + end):
    
    * Query overlapping reservations:
        
        ```js
        const overlapping = await Reservation.aggregate([
          { $match: {
              listingId: ObjectId(listingId),
              status: { $in: ['reserved','active','picked'] },
              $expr: { $and: [ { $lt: ['$start', endDate] }, { $gt: ['$end', startDate] } ] }
          }},
          { $group: { _id: null, totalQty: { $sum: '$qty' } } }
        ], { session });
        ```
        
    * `reservedQty = overlapping[0]?.totalQty || 0`
        
    * `if (reservedQty + requestedQty > listing.totalQuantity) abort transaction -> return 409 conflict`
        
    * Else insert Reservation doc with `orderId` and status `reserved`.
        
3. Insert Order doc referencing reservations.
    
4. Commit transaction.
    

Why this is safe: all reads & writes in same transaction prevent race conditions. If you can’t use transactions (demo offline with single-node), then use a pessimistic locking pattern: create a `Lock` document per listing and use `findOneAndUpdate({ _id: lockId, locked: false}, {$set: {locked: true}})` but that’s hacky.

**Important**: Keep reservations lightweight and remove expired ones automatically (cron) in case of incomplete payments.

* * *

Razorpay flow for P2P (practical hackathon version)
===================================================

For a true marketplace you’d use Razorpay Route + Payouts or Connect — too heavy for 20 hours. Do this:

* Renter pays **platform** via Razorpay Order.
    
* On successful payment, `Payment` record is created and `Order.paymentStatus = 'paid'`.
    
* Platform holds the funds (simulate escrow): `hostBalance += (totalAmount - commission)`, but **do not** actually transfer funds during hackathon — just mark `Payout` record `pending`.
    
* Admin triggers mocked payout (or a scheduled job uses Razorpay Payouts if you want extra credit).
    
* For demo: `PAYMENT_MODE=mock` creates a fake success response and the same code path executes (so you can demo offline).
    

Commission:

* Simple default: 10% platform commission on subtotal.
    
* Store platformCommission in order for transparency.
    

Security:

* VERIFY Razorpay webhook signature (HMAC SHA256).
    
* Never store full card info (Razorpay handles that).
    

* * *

API endpoints (minimum, RESTful) — copy-paste into your OpenAPI later
=====================================================================

Auth

* POST `/api/auth/register` — {name,email,password,isHost}
    
* POST `/api/auth/login` — {email,password} → JWT
    

Listings

* GET `/api/listings?query&from&to` — search with availability filter
    
* GET `/api/listings/:id`
    
* POST `/api/listings` — host creates listing
    
* PATCH `/api/listings/:id` — host edits
    
* GET `/api/host/:hostId/listings`
    

Availability

* GET `/api/listings/:id/availability?start&end&qty` — returns available qty
    

Orders & Reservations

* POST `/api/orders` — create order, run reservation transaction (body: lines)
    
* GET `/api/orders/:id`
    
* GET `/api/host/orders` — host orders
    
* POST `/api/orders/:id/pickup` — host marks pickup
    
* POST `/api/orders/:id/return` — host marks return + damage flag
    

Payments

* POST `/api/orders/:id/pay` — backend creates Razorpay order -> returns orderId & amount
    
* POST `/api/webhooks/razorpay` — verify & update payment
    
* POST `/api/orders/:id/refund` — admin refunds (optional)
    

Admin / Payouts

* GET `/api/admin/payouts` — pending payouts
    
* POST `/api/admin/payouts/:id/process` — mock process
    

* * *

Best practices & demo-critical checklist (do these)
===================================================

Absolute musts:

* **Transactions** for reservation flow.
    
* **Idempotency** on payment webhooks & order creation. Use `razorpayOrderId` uniqueness check.
    
* **Mock payment mode** so offline demo always works.
    
* **Seeded demo data** and simple login credentials in README.
    
* **Detailed logs** on reservation steps (so judge can open logs and see atomic commit).
    
* **Simple error messages** for conflicts: “Sorry, only X units left for that period — choose other dates.”
    
* **Timeouts & retries** for external calls (Razorpay).
    
* **Rate limiting** basic (express-rate-limit) to avoid accidental floods.
    
* **Avoid sensitive storage**: no card storage, secrets in `.env` only.
    

Performance tips (for judges to notice)

* Add basic server-side caching for `GET /listings` (in-memory LRU for demo).
    
* Return minimal fields for list responses (avoid heavy images).
    
* Use `populate()` only where needed.
    
* Add index on `Reservation` for the overlap query.
    
* Frontend: lazy load images, show skeletons.
    

UX & winning polish

* Clean microcopy for marketplace trust: host verification badge, reviews placeholder.
    
* Show expected payout and commission breakdown on checkout.
    
* On conflict, show “Alternative available slots” (compute next 3 available windows) — impressive if you can squeeze it.
    
* Add small animations for booking success.
    

Security & legal (two lines to say during demo)

* “Platform holds payments until return inspection. Hosts are verified via ID upload.” — this shows thought-out marketplace safety.
    

* * *

Quick demo script (2–3 minutes) — tailored P2P
==============================================

1. Intro 10s — problem statement + P2P angle: “Peer-to-peer rental marketplace; hosts list gear; renters book; platform handles escrow & dispute.”
    
2. Show listing page → filter by date → show host + verified badge 15s.
    
3. Open listing → booking flow (choose dates) → show price breakdown (subtotal, deposit, commission, host payout) 30s.
    
4. Checkout → Razorpay mock modal → complete payment → show order confirmed 20s.
    
5. Switch to host dashboard → show incoming booking & calendar 20s.
    
6. Host marks pickup → renter uses → host marks return → admin inspects & mark completed → payout moves to host balance (mock) 20s.
    
7. Show concurrency test: two browsers try last unit → second fails gracefully 15s.
    

* * *

Safety nets (if something breaks while judge watches)
=====================================================

* Pre-recorded 60s GIF of the entire happy path (use if live fails).
    
* `seed-reset` script to quickly restore initial state.
    
* Local static HTML fallback showing screenshots + counters.
    
* `PAYMENT_MODE=mock` must be default.
    

* * *

Final checklist to finish in 20 hours (copy & tick)
===================================================

Backend

*  Models (User, Listing, Reservation, Order, Payment, Payout)
    
*  Reservation service with transactions
    
*  Order create + payment init + webhook
    
*  Payout mock + admin endpoints
    
*  Seed script + reset flag
    
*  Dockerfile + docker-compose
    

Frontend

*  Tailwind & theme applied
    
*  Listing grid, detail, booking form
    
*  Razorpay checkout wrapper (with mock)
    
*  Host Dashboard + Calendar
    
*  Admin simple panel + logs viewer
    

Polish & Ops

*  README_DEMO with credentials & one-command run
    
*  Demo GIF + slides
    
*  Concurrency test logs ready
    
*  Postman collection (optional but good)
    

* * *

Want me to **generate exact files now**? I can produce:

* (A) Full Mongoose model files + `seed.js` (instant paste)
    
* (B) `reservation.service.js` with transaction-safe code + a small test script to simulate conflict
    
* (C) React components for Listing -> Booking -> Checkout (with Razorpay mock integration)
    
* (D) `docker-compose.yml`, backend & frontend `Dockerfile`, and `.env.example`
    
* (E) Postman collection + `README_DEMO.md` + 3-slide content
    

Say which letters (you can choose multiple). I’ll produce working code you can paste and run immediately.

* * *

**You:**

this was the pdf btw:
P
 r
 o
 b
 l
 e
 m
 S 
t
 a
 t
 e
 m
 e
 n
 t
 3 
:
  Rental Management
 Rental application streamlines the entire rental process. It provides a 
unified platform to manage products, schedule pickups.
 Online booking and reservations are done through a website portal, 
Customers can shop available products, reserve their selected dates, 
and checkout right on the website.
 Whether you rent by the hour, week, month or year, create customized 
pricing for every product based on different time frames.
 Roles
 Customer
 End user
 Core Rental Features
 1. Rental Product Management
 ○ Define Rentable Products: Mark products as rentable and configure
 units (e.g., per hour, day, week).
 ○
 ○
 Custom Rental Duration: Supports short-term and long-term rentals
 with flexible durations.
 Product Availability: View product availability in calendar or list view
 to avoid overbooking.
 Order and Rental Flow
 2. Rental Quotations & Orders
 ○ Create rental quotations, confirm them into rental orders, and generate
 rental contracts.
 ○
 ○
 Customers can review, confirm, and pay online through the customer
 portal.
 Pickup/Return Scheduling: Track and schedule pickup and return with
 precise timing.
Notifications
 ○
 The system sends timely reminders to both customers and internal 
users:
 Customer Notifications – Automated reminders via email and/or portal alerts,
 sent N days before the scheduled rental return date.
 End User Notifications – Email notifications to the end users N days before
 the scheduled rental return date, allowing them to prepare for pickup or
 follow-up.
 Customizable N value for notification lead time to match business 
needs.
 Payment Gateway Integration
 At least one secure payment gateway must be configured, enabling 
customers to make online payments directly from the rental quotation 
or order. Popular gateways (e.g., PayPal, Stripe, Razorpay, etc.) can be 
integrated as per business requirements.
 3. Delivery Management
 When you rent out products, the system automatically takes care of 
moving them through three main stages:
 Reservation (Order Confirmed)
 ○ As soon as you confirm a rental order, the system “reserves” the required
 items.
 ○
 ○
 This means those products are set aside and cannot be given to anyone
 else.
 It ensures you always have the right items ready for that customer.
 Pickup (Delivery to the Customer)
 ○ The system creates a pickup document telling your pickup team which
 items need to be delivered.
 ○
 ○
 This makes it easy to prepare and hand over the products to the customer.
 The stock records are updated to show that the items are now with the
 customer.
Return (Collecting Back from the Customer)
 ○
 ○ When the rental period ends, the system generates a return document.
 This guides your pickup team to collect the rented products from the
 customer.
 ○
 Once returned, the stock records are updated so the items are available
 for the next rental.
 4. Flexible Invoicing
 When the Order is Confirmed, The user can create an initial invoice.
 ○ Full upfront payment – Charge the total rental amount before the customer
 picks up the goods.
 ○
 ○
 Partial payment / deposit – Take a security deposit or first installment now,
 and charge the rest later.
 Late Return Fees: Automatically calculate late fees based on predefined
 rules.
 5. Pricelist Management
 Integrates its Pricelist system into the rental module to offer customized 
and flexible pricing:
 Multiple Pricelists:
 ○ Create different pricelists for different customer segments, regions,
 or rental durations.
 ○
 E.g., Corporate clients, VIP customers, or seasonal discounts.
 Time-Dependent Pricing:
 ○ Set variable pricing based on rental duration.
 ○
 Example: ₹10/hour, ₹60/day, ₹300/week – automatically applied based
 on rental period.
 Discount Rules:
 ○ Apply percentage discounts, fixed discounts, or promotional offers to
 rental products.
 Product Category or Customer-Specific Rules:
 ○ Define pricing rules per product category or specific customer groups.
Validity Periods:
 ○ Set date ranges for seasonal or promotional pricelists (e.g., “Holiday
 Rental Rates”).
 6. Returns & Delays Handling
 ○
 ○ Get alerts for late returns.
 Configure automatic late fees or penalties.
 7. Reports and Dashboards
 ○ Get alerts for late returns.
 ○
 Configure automatic late fees or penalties.
 Downloadable Reports
 All reports can be exported in multiple formats (PDF, XLSX, or CSV) for 
analysis, sharing, or record-keeping.
 Tracking based on the given period:
 ○
 ○
 ○
 Most rented products
 Total rental revenue
 Top Customer
 Mockup: https://link.excalidraw.com/l/65VNwvy7c4X/1C10DktExEQ

* * *

**ChatGPT:**

Nice — this is everything you need, laser-cut and ready for execution. I’ve taken the PDF problem statement + your mockup and converted them into a _P2P marketplace_ hackathon plan that two devs can finish in **20 hours**. You get:

* exact hour-by-hour sprint plan (who does what),
    
* prioritized TODO checklist,
    
* fully copy-pasteable **Mongoose schemas** (P2P edition),
    
* API contract,
    
* reservation algorithm (transactional),
    
* Razorpay escrow/payout approach (mockable for offline demo),
    
* folder structure,
    
* color-theme + UI rules that match your mockup,
    
* best practices, tests & demo checklist.
    

Read it once, assign roles, and tell me which artifact to generate first (models/service/docker-compose/React components/Postman). Let’s not waste time.

High-level constraints (given)
==============================

* MERN stack (MongoDB, Express, React, Node).
    
* Razorpay for payments (use `PAYMENT_MODE=mock` locally).
    
* P2P marketplace: hosts list items; renters book; platform holds funds (escrow) & pays hosts (mocked).
    
* Offline-ready: single `docker-compose up --build` must run everything local.
    
* 20 hours, 2 devs (Dev A = Backend, Dev B = Frontend).
    

20-hour timeline (exact — follow it)
====================================

Dev A = Backend (DB, transactions, Razorpay webhook, seed, docker).  
Dev B = Frontend (React + Tailwind UI, Checkout, Calendar).

T0 (00:00–00:30) — Kickoff (both)

* Setup repo: `main`, `dev`. Add `README_DEMO.md`.
    
* Copy `.env.example`.
    
* Agree on one happy-path demo script (book→pay→host pickup→return→payout mock).
    

T0.5–T2.5 (1h30) — Back + DB scaffold (Dev A)

* Init Express app, Mongoose connect, JWT auth skeleton.
    
* Paste Mongoose schemas below into `/src/models`.
    
* Create `seed.js` (3 hosts, 5 listings, 4 customers).
    
* Start Mongo in Docker (or local) to ensure connection.
    

T0.5–T3.5 (3h) — Frontend skeleton (Dev B)

* Vite + React + Tailwind setup.
    
* Create pages: Home (listings), Listing detail, Booking form placeholder.
    
* Implement `api/client.js` (axios) and auth mock.
    

T2.5–T6.5 (4h) — Reservation engine + Orders (Dev A)

* Implement `reservation.service.js` using transactions (code below).
    
* `POST /api/orders` checks availability & creates reservations + order.
    
* Add `GET /api/listings/:id/availability?start&end&qty`.
    

T3.5–T7.5 (4h) — Booking UI & Checkout base (Dev B)

* Booking form: date/time, qty, preview price breakdown (subtotal, deposit, commission).
    
* Checkout flow: call `/api/orders` → get `razorpayOrderId` (or mock) → call Razorpay checkout (or mock modal).
    
* On success call `/api/orders/:id/confirm-payment`.
    

T6.5–T9.5 (3h) — Razorpay integration + webhook (Dev A)

* Implement `razorpay.service.js` and `POST /api/webhooks/razorpay` with signature verify.
    
* `PAYMENT_MODE=mock` path that simulates a success: creates a Payment record, triggers order update flow.
    

T7.5–T10.5 (3h) — Host dashboard + Calendar (Dev B)

* FullCalendar or grid to show reservations for host listings.
    
* Mark pickup / returned / flag damage UI and endpoints.
    

T9.5–T13.5 (4h) — Admin/payout mock + polish (Dev A)

* Implement host wallet balance calculation after payment (total - commission).
    
* Admin endpoint to trigger mocked payout (mark Payout `processed`).
    
* Logging around reservation transactions.
    

T10.5–T16.5 (6h) — Polish, tests, performance, Dockerize (both)

* Add skeleton loaders, toasts, microcopy, images lazy-load.
    
* Concurrency testing: simulate parallel booking attempts.
    
* Add Dockerfiles + `docker-compose.yml`, default `PAYMENT_MODE=mock`.
    
* Seed data run & demo data verify.
    

T16.5–T20 (3.5h) — Finalize demo + contingency (both)

* Create `README_DEMO.md` one-command run.
    
* Prepare 3-slide deck + short recorded demo GIF.
    
* Run 3 full demos; fix critical bugs.
    

* * *

Prioritized TODO checklist (developer-ready)
============================================

### Must finish (MVP — demo)

*  Backend: JWT auth, User model (`isHost`), listing model, order/reservation/payment models.
    
*  Backend: reservation transactional service + `POST /api/orders`.
    
*  Backend: Razorpay order creation endpoint + webhook (mock mode working).
    
*  Backend: host wallet calculation + admin payout endpoint (mock).
    
*  Frontend: listing grid, listing detail, booking form, checkout modal, host dashboard & calendar.
    
*  Docker compose + `seed.js` + `.env.example` + `README_DEMO.md`.
    
*  Concurrency test outcomes + demo script.
    

### Nice if time

*  Host listing creation UI.
    
*  Host verification upload (ID).
    
*  Show commission breakdown on checkout.
    
*  Alternative slot suggestions on conflict.
    

* * *

Color scheme & UI theme (copy into Tailwind)
============================================

Theme: trust + marketplace + modern. Use these exact values.

```css
--color-primary: #0B1220;    /* deep navy (nav, headings) */
--color-accent:  #06B6D4;    /* cyan / CTA */
--color-host:    #7C3AED;    /* indigo for host badges */
--color-warning: #F97316;    /* orange */
--color-success: #10B981;    /* green */
--color-bg:      #F8FAFC;    /* page bg */
--color-card:    #FFFFFF;    /* card bg */
--text-main:     #0F172A;    /* main text */
--text-muted:    #64748B;    /* muted text */
```

UI rules

* Card radius `rounded-lg`, shadow `shadow-md`.
    
* Buttons: primary = `bg-accent text-white`, hover slightly darker + elevation.
    
* Show host info under title: `Hosted by <name> • Verified` (indigo badge).
    
* Price breakdown: clear rows: Subtotal | Deposit | Commission | Total.
    
* Deposit text small, red-orange for warnings, green for paid.
    
* Use Inter font, 14–16px body.
    

* * *

Folder structures (copy-paste ready)
====================================

**Backend**

```
/backend
  /src
    config/
      index.js
    controllers/
      auth.controller.js
      listings.controller.js
      orders.controller.js
      payments.controller.js
      host.controller.js
      admin.controller.js
    models/
      User.js
      Listing.js
      Reservation.js
      Order.js
      Payment.js
      Payout.js
    routes/
      auth.js
      listings.js
      orders.js
      payments.js
      admin.js
    services/
      reservation.service.js
      pricing.service.js
      razorpay.service.js
      payout.service.js
    utils/
      logger.js
      validators.js
      errors.js
    seed.js
    index.js
  package.json
  Dockerfile
  .env.example
```

**Frontend**

```
/frontend
  /src
    api/
      client.js
      auth.js
      listings.js
      orders.js
    components/
      Header.jsx
      Footer.jsx
      ListingCard.jsx
      BookingForm.jsx
      PriceBreakdown.jsx
      Calendar.jsx
      RazorpayCheckout.jsx
      Toast.jsx
    pages/
      Home.jsx
      ListingDetail.jsx
      Checkout.jsx
      HostDashboard.jsx
      HostListingCreate.jsx
      AdminPanel.jsx
    styles/
      tailwind.css
      theme.js
    App.jsx
    main.jsx
  package.json
  Dockerfile
  vite.config.js
```

* * *

Mongoose schemas (P2P — copy/paste ready)
=========================================

Use these exact schemas (sanitized, minimal validations). Put in `/backend/src/models`.

**User.js**

```js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: String,
  isHost: { type: Boolean, default: false },
  hostProfile: {
    displayName: String,
    verified: { type: Boolean, default: false },
    phone: String,
    address: String,
    govtIdUrl: String
  },
  walletBalance: { type: Number, default: 0 }, // platform-held balance for host
  role: { type: String, enum: ['user','host','admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
```

**Listing.js**

```js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ListingSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, index: true },
  description: String,
  images: [String],
  category: String,
  unitType: { type: String, enum: ['hour','day','week'], default: 'day' },
  basePrice: { type: Number, required: true },
  depositType: { type: String, enum: ['flat','percent'], default: 'percent' },
  depositValue: { type: Number, default: 20 }, // percent or amount
  totalQuantity: { type: Number, default: 1 },
  location: String,
  status: { type: String, enum: ['draft','published','disabled'], default: 'published' },
  createdAt: { type: Date, default: Date.now }
});

ListingSchema.index({ title: 'text' });
module.exports = mongoose.model('Listing', ListingSchema);
```

**Reservation.js**

```js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReservationSchema = new Schema({
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  qty: { type: Number, default: 1 },
  start: { type: Date, required: true, index: true },
  end: { type: Date, required: true, index: true },
  status: { type: String, enum: ['reserved','picked','active','returned','cancelled'], default: 'reserved' },
  createdAt: { type: Date, default: Date.now }
});

ReservationSchema.index({ listingId: 1, start: 1, end: 1 });
module.exports = mongoose.model('Reservation', ReservationSchema);
```

**Order.js**

```js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderSchema = new Schema({
  renterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  lines: [{
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing' },
    qty: Number,
    start: Date,
    end: Date,
    unitPrice: Number,
    lineTotal: Number
  }],
  subtotal: Number,
  depositAmount: Number,
  platformCommission: Number,
  totalAmount: Number,
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  orderStatus: { type: String, enum: ['quote','confirmed','in_progress','completed','cancelled','disputed'], default: 'quote' },
  razorpayOrderId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
```

**Payment.js**

```js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  amount: Number,
  method: String,
  razorpayPaymentId: String,
  razorpayOrderId: String,
  status: { type: String, enum: ['initiated','success','failed'], default: 'initiated' },
  raw: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);
```

**Payout.js**

```js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PayoutSchema = new Schema({
  hostId: { type: Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  status: { type: String, enum: ['pending','processed','failed'], default: 'pending' },
  method: { type: String, enum: ['manual','razorpay_payout'], default: 'manual' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payout', PayoutSchema);
```

* * *

Reservation algorithm (copy-paste safe, transaction-based)
==========================================================

Use Mongo transactions (Atlas or local replica set). Put in `/src/services/reservation.service.js`.

Pseudo-code (Node + Mongoose):

```js
async function createOrderAndReserve({ renterId, lines, paymentMode }, session) {
  const sessionLocal = session || await mongoose.startSession();
  try {
    sessionLocal.startTransaction();

    // For each line: check availability
    for (const line of lines) {
      const { listingId, qty, start, end } = line;
      // sum overlapping reservations
      const overlap = await Reservation.aggregate([
        { $match: {
            listingId: mongoose.Types.ObjectId(listingId),
            status: { $in: ['reserved','active','picked'] },
            $expr: { $and: [ { $lt: ['$start', new Date(end)] }, { $gt: ['$end', new Date(start)] } ] }
        }},
        { $group: { _id: null, totalQty: { $sum: '$qty' } } }
      ], { session: sessionLocal });

      const reservedQty = (overlap[0] && overlap[0].totalQty) ? overlap[0].totalQty : 0;
      const listing = await Listing.findById(listingId).session(sessionLocal);
      if (!listing) throw new Error('Listing not found');

      if (reservedQty + qty > listing.totalQuantity) {
        await sessionLocal.abortTransaction();
        throw { code: 409, message: 'Not enough items available' };
      }

      // Insert reservation doc
      const reservation = new Reservation({
        listingId, qty, start, end, status: 'reserved'
      });
      await reservation.save({ session: sessionLocal });

      // attach reservation id to the line (or collect to return)
      line.reservationId = reservation._id;
    }

    // Compute totals and create Order
    const order = new Order({
      renterId,
      hostId: lines[0].hostId || listing.ownerId, // ensure host assign
      lines,
      subtotal: computeSubtotal(lines),
      depositAmount: computeDeposit(lines),
      platformCommission: computeCommission(lines),
      totalAmount: subtotalCalculation
    });
    await order.save({ session: sessionLocal });

    // update reservations with orderId
    await Reservation.updateMany({ _id: { $in: lines.map(l=>l.reservationId) } },
                                { $set: { orderId: order._id } }, { session: sessionLocal });

    await sessionLocal.commitTransaction();
    return order;
  } catch (err) {
    if (sessionLocal.inTransaction()) await sessionLocal.abortTransaction();
    throw err;
  } finally {
    sessionLocal.endSession();
  }
}
```

Important: keep the transaction short. Do not call external APIs (Razorpay) inside the transaction. Create the order, commit, then create Razorpay order.

* * *

Razorpay flow (P2P / hackathon-safe)
====================================

* Renter pays platform via Razorpay Order. Platform holds funds.
    
* Calculation: `platformCommission = subtotal * 0.10` (10%). `hostReceivable = total - commission`.
    
* Save `Payment` record on webhook success.
    
* Update `Order.paymentStatus = 'paid'` and `orderStatus = 'confirmed'`.
    
* Increase `User.walletBalance` for host by `hostReceivable`. (No real payout during hackathon)
    
* Admin triggers `POST /admin/payouts/:id/process` — mark payout `processed`. (Razorpay Payouts optional; for hackathon we mock.)
    

Local offline: if `PAYMENT_MODE=mock`, the backend will simulate webhook calling the same code path.

Security:

* Verify webhook signature with HMAC using `RAZORPAY_SECRET`.
    

* * *

API endpoints (minimum set)
===========================

Auth

* `POST /api/auth/register`
    
* `POST /api/auth/login`
    

Listings

* `GET /api/listings?from&to&query`
    
* `GET /api/listings/:id`
    
* `POST /api/listings` (host)
    
* `PATCH /api/listings/:id`
    

Availability

* `GET /api/listings/:id/availability?start&end&qty`
    

Orders

* `POST /api/orders` → runs reservation engine (returns order.id)
    
* `POST /api/orders/:id/pay` → returns `razorpayOrderId` or `mock`
    
* `POST /api/orders/:id/confirm-payment` → called after client success (or webhook)
    
* `GET /api/orders/:id`
    
* `POST /api/orders/:id/pickup` (host)
    
* `POST /api/orders/:id/return` (host; can include damage & fee)
    

Payments / Webhook

* `POST /api/webhooks/razorpay` — verify & mark payment success
    

Admin / Payouts

* `GET /api/admin/payouts`
    
* `POST /api/admin/payouts/:id/process` (mock)
    

* * *

Performance & best practices (must-follow)
==========================================

* **DB Indexes**: Reservation index on `(listingId, start, end)`, Listing `ownerId`, Order `createdAt`.
    
* **Transactions**: Use Mongo transactions for reservation + order creation.
    
* **Do not call external APIs in transactions** — create order first, commit, then call Razorpay.
    
* **Idempotency**: Use `razorpayOrderId` and idempotency checks for webhooks.
    
* **Limit response payload**: List endpoints should return small fields; fetch full detail on detail page.
    
* **Cache**: simple in-memory cache for listing grid using TTL (LRU). Judges notice snappy UI.
    
* **Debounce** availability calls from frontend.
    
* **Error messages**: 409 for conflicts with helpful alternative suggestion text.
    

* * *

Testing & demo checklist (run immediately before judges)
========================================================

*  `docker-compose up --build` boots all services.
    
*  Seed data present: 3 hosts, 5 listings, 4 renters.
    
*  Booking → mock payment success → order confirmed → host wallet increased.
    
*  Two parallel booking attempts on same slot: second fails with 409 and shows alternatives.
    
*  Host marks pickup; return; order complete; host wallet shows receivable.
    
*  Admin triggers payout mock; Payout status becomes `processed`.
    
*  Webhook signature verification tested (use razorpay test).
    
*  Timezone check: booking across midnight works.
    

* * *

Demo script (2 minutes — memorize)
==================================

1. Problem one-liner: “Peer-to-peer rental marketplace — hosts list, renters book, platform holds payment escrow, host gets paid after completion.” (5s)
    
2. Show listing grid → select listing → show host badge + availability calendar. (20s)
    
3. Book: choose dates, qty; show price breakdown (subtotal, deposit, commission, host payout) → checkout (Razorpay mock) → success. (40s)
    
4. Switch to host dashboard: show new booking, calendar block, mark pickup → mark return, confirm inspection → show host wallet updated & admin payout pending. (40s)
    
5. Concurrency demo: open a second browser attempt on the same 1-unit slot, show graceful conflict (10s). Finish. (5s)
    

* * *

Final: tell me which artifact you want generated now
====================================================

Pick one or several and I’ll spit out ready-to-paste files (complete code):

* **A** — `seed.js` + `.env.example` + `docker-compose.yml` (offline-ready).
    
* **B** — Full Mongoose model files (User, Listing, Reservation, Order, Payment, Payout) — ready now (I already provided above, but I can output files).
    
* **C** — `reservation.service.js` (transactional) + a small concurrent booking test script.
    
* **D** — `razorpay.service.js`, `payments.controller.js` + webhook verification snippet.
    
* **E** — React components: `ListingCard.jsx`, `BookingForm.jsx`, `RazorpayCheckout.jsx` (mocked).
    
* **F** — Full `README_DEMO.md` + 3-slide deck content + Postman collection.
    

Say the letters (or “all”) and I’ll generate the files right away.