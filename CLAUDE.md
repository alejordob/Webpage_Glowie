# Claude Instructions for Glowie Webpage

## Working Principles

- **Think before acting.** Read existing files before writing code.
- **Be concise in output** but thorough in reasoning.
- **Prefer editing over rewriting** whole files.
- **Do not re-read files** you have already read unless the file may have changed.
- **Test your code** before declaring done.
- **No sycophantic openers or closing fluff.**
- **Keep solutions simple and direct.**
- **User instructions always override this file.**

---

## Project Summary

**Glowie** is an artisanal candle e-commerce site for *velasglowie.com* built in Cali. It's a client-side SPA with no traditional backend—products sync from Firebase Firestore, checkout routes through WhatsApp.

**Stack:** HTML5 + Tailwind CSS + Vanilla JS (ES6) + Firebase + Cloudinary CDN  
**Analytics:** GA4 + Meta Pixel  
**Key Features:** Product catalog with aroma/design filtering, shopping cart (localStorage), WhatsApp checkout

**Architecture:**
- `public/index.html` — Single page, History API routing
- `public/js/app.js` — Router (maps routes to render/init functions)
- `public/js/firebase.js` — Firebase init, anonymous auth, Firestore queries
- `public/js/pages/catalog.js` — Catalog render, product filtering, stock logic
- `public/js/pages/modal.js` — Product detail modal, variant selection
- `public/js/cart.js` — Cart management, shipping, WhatsApp checkout
- `public/styles.css` + Tailwind for styling

**Data Model:** Products have `aroma[]`, `combinaciones[]`, `stock_variations` (keyed by design-aroma), colors (cinnamon, peach, cream).
