# AGENTS.md — Repository Guidance for AI Agents & Developers

This document provides architectural patterns, coding standards, verification protocols, and critical domain knowledge for AI coding agents and human maintainers working on **Zerodha Family Holdings Dashboard**.

---

## Repository Architecture & Directory Structure

```
kite-family/
├── src/
│   ├── index.ts               # Entry point (Hono app, routes, middleware, cache, cron daemon)
│   ├── lib/
│   │   ├── config.ts          # Environment variables parser for dynamic multi-account setup
│   │   ├── cron.ts            # Daily auto-auth background scheduler (node-cron / Cloudflare scheduled)
│   │   ├── http-auth.ts       # Automated Zerodha OAuth login engine (Steps 1-5 handshake)
│   │   ├── kite.ts            # KiteConnect SDK wrapper for fetching account holdings
│   │   ├── merge.ts           # Portfolio aggregation engine (blended avg price, P&L, day change)
│   │   ├── token-store.ts     # Token storage abstraction (Memory / Disk JSON / Cloudflare KV)
│   │   └── totp.ts            # Pure RFC 6238 Base32 HMAC-SHA1 TOTP generator
│   ├── middleware/
│   │   └── auth.ts            # Dashboard master password session cookie middleware
│   └── views/
│       ├── components/
│       │   ├── chart.ts       # SVG Donut Chart component generator
│       │   ├── header.ts      # Top navigation header & account filter component
│       │   ├── holdings-table.ts # Interactive holdings table & analytics view component
│       │   └── overview-card.ts  # Summary cards, value mode radio, & donut chart grid
│       ├── layout.ts          # Base HTML layout template (Pure Light Theme, CSS design tokens)
│       ├── dashboard.ts       # Main holdings page view renderer
│       └── login.ts           # Master password login view template
├── .env                       # Local environment variables (DO NOT COMMIT SECRETS)
├── Dockerfile                 # Multi-stage production container build
├── SETUP_GUIDE.md             # End-user step-by-step setup guide
├── wrangler.toml              # Cloudflare Workers configuration
└── package.json               # Node.js dependencies & scripts
```

---

## Core Domain Concept: Zerodha Automated Authentication Engine

Zerodha access tokens expire daily at **6:00 AM IST**. The engine in [`src/lib/http-auth.ts`](file:///Users/vh/Desktop/kite-family/src/lib/http-auth.ts) automates login without browser automation (Puppeteer/Playwright):

1. **Step 1 (`POST https://kite.zerodha.com/api/login`)**:
   - Submits `user_id` and `password` to obtain `request_id` and set-cookies (`kf_session`, `__cf_bm`).
2. **Step 2 (`POST https://kite.zerodha.com/api/twofa`)**:
   - Generates a 6-digit TOTP code from `ACCOUNT_x_TOTP_SECRET` using RFC 6238 HMAC-SHA1.
   - Submits `twofa_value` to obtain `public_token` and session cookies (`enctoken`, `public_token`).
3. **Step 3 (`GET https://kite.zerodha.com/connect/login?v=3&api_key=...`)**:
   - Executes GET with `redirect: 'manual'` to capture HTTP 302 location header and extract `sess_id`.
4. **Step 4 (`POST https://kite.zerodha.com/connect/finish`)**:
   - Submits form POST with `Origin`, `Referer`, `sess_id`, `api_key`, and `authorize: public_token`.
   - Captures HTTP 302 redirect location containing `request_token`.
5. **Step 5 (`KiteConnect.generateSession`)**:
   - Calls official `KiteConnect` SDK to exchange `request_token` for `access_token` and saves it.

> **CRITICAL GOTCHA**: Do NOT attempt to load `/connect/authorize` via simple `GET` redirect loops. Zerodha's backend requires a form `POST` to `/connect/finish` containing `authorize: public_token`.

---

## UI & Frontend Design System Guidelines

- **Default Theme**: **Pure Light Theme** (`data-theme="light"` on `<html>`).
- **Icons**: Always use inline SVG icons instead of emojis for clean, professional UI presentation.
- **Color Tokens**: Defined via CSS variables in [`src/views/layout.ts`](file:///Users/vh/Desktop/kite-family/src/views/layout.ts).
- **Motion UI**:
  - Hover states: `transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.15s ease`.
  - Active states: `transform: scale(0.98)` on buttons.
  - Reduced Motion: Always respect `@media (prefers-reduced-motion: reduce)`.
- **Responsiveness**:
  - Flexbox & CSS Grid with `repeat(auto-fit, minmax(240px, 1fr))`.
  - Scroll container (`overflow-x: auto`) for holding tables on mobile.
  - Minimum 44px tap targets for mobile usability.

---

## Verification & Development Workflow

### Start Development Server
```bash
npm run dev
```

### Type Checking & Build Verification
```bash
npx tsc --noEmit
```

### Key Invariants to Maintain
1. **Never alter API response signatures** of `/api/holdings` or `/api/status`.
2. **Never log sensitive Zerodha passwords or TOTP secret keys** to console logs.
3. **Ensure full backward compatibility** between Node.js container environments and Cloudflare Workers serverless edge runtime.
