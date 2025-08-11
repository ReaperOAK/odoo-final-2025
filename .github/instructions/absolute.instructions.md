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