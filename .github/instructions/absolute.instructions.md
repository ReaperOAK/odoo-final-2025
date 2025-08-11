---
applyTo: '**'
---
Top rules (repeat out loud)
===========================

1. **Buy time with UX** — seed data + fast flows so you demo in 60s.
    
2. **One golden path** — customer books, admin picks up, admin returns. Make that flawless.
    
3. **Availability logic is sacred** — protect it with DB transactions + simple retry if needed.
    
4. **No premature scale features** — no emails, no external payments (simulate), no maps.

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