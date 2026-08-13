# Zerodha Family Holdings Dashboard

A modern, high-performance unified family portfolio tracking web application built with **Node.js, TypeScript, Hono, and Zerodha's official Kite Connect v3 API**.

It automatically aggregates stock holdings across multiple Zerodha accounts (e.g. Self, Spouse, Parents) into a single, real-time family holdings dashboard with blended average prices, total portfolio valuation, overall P&L, day's change, and interactive per-account breakdowns.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Hono](https://img.shields.io/badge/Hono-v4-orange.svg)
![Theme](https://img.shields.io/badge/Theme-Light%20%2F%20Dark-emerald.svg)

---

## Key Features

- **Unified Multi-Account Portfolio View**: Merges identical holdings across all configured Zerodha accounts into a single row with weighted blended average buy price, combined quantity, and real-time total valuation.
- **Interactive Per-Account Breakdown**: Click any stock row to instantly expand a detailed table showing each family member's quantity, average purchase price, invested capital, and individual P&L.
- **Automated Headless 2FA Login Engine**: Features a first-principles automated OAuth login engine (`src/lib/http-auth.ts`) that executes Zerodha's HTTP authentication handshake (`/api/login` + pure RFC 6238 TOTP `/api/twofa` + `/connect/finish` authorization) without requiring daily manual browser log-ins.
- **Pure Light Theme**: Modern light theme user interface with soft typography, high-contrast badges, smooth hover animations, and SVG icons.
- **Fast 30-Second Memory Cache**: Eliminates Zerodha API rate limit bottlenecks and provides instantaneous page loads for family members.
- **Responsive & Accessible**: Fully responsive across mobile, tablet, and desktop screens with keyboard accessibility and reduced motion support (`prefers-reduced-motion`).
- **Edge & Container Ready**: Deployable on **Coolify / Docker / VPS** as a standalone Node server daemon, or on **Cloudflare Workers** with KV storage and Cron triggers.

---

## Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- One or more **Zerodha Kite Developer Apps** (Free Personal Apps created at [developers.kite.trade](https://developers.kite.trade))

### 2. Installation & Setup

Clone the repository and install dependencies:

```bash
cd kite-family
npm install
```

Create a `.env` file from the provided template:

```bash
cp .env.example .env
```

Edit `.env` with your master dashboard password and Zerodha account credentials:

```env
# Master password to access the Web UI
DASHBOARD_PASSWORD="your_secure_dashboard_password"

# Account 1 Config
ACCOUNT_1_LABEL="Self"
ACCOUNT_1_USER_ID="BX9131"
ACCOUNT_1_PASSWORD="zerodha_password"
ACCOUNT_1_TOTP_SECRET="BASE32_TOTP_SECRET_KEY"
ACCOUNT_1_API_KEY="your_kite_api_key"
ACCOUNT_1_API_SECRET="your_kite_api_secret"

# Account 2 Config (Optional)
ACCOUNT_2_LABEL="Spouse"
ACCOUNT_2_USER_ID="CD5678"
ACCOUNT_2_PASSWORD="zerodha_password_2"
ACCOUNT_2_TOTP_SECRET="BASE32_TOTP_SECRET_KEY_2"
ACCOUNT_2_API_KEY="kite_api_key_2"
ACCOUNT_2_API_SECRET="kite_api_secret_2"
```

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## Architecture & Tech Stack

```
   ┌──────────────────────────────────────────────────────────┐
   │                  Hono Web Application                   │
   │               (http://localhost:3000)                    │
   └─────────────┬──────────────────────────┬─────────────────┘
                 │                          │
   ┌─────────────▼────────────┐  ┌──────────▼─────────────────┐
   │  Automated Auth Engine   │  │  Portfolio Merge Engine   │
   │  (src/lib/http-auth.ts)  │  │   (src/lib/merge.ts)     │
   └─────────────┬────────────┘  └──────────┬─────────────────┘
                 │                          │
   ┌─────────────▼──────────────────────────▼─────────────────┐
   │               KiteConnect Node.js SDK                    │
   └─────────────────────────────┬────────────────────────────┘
                                 │
                   ┌─────────────▼─────────────┐
                   │  Zerodha Kite Connect v3  │
                   │       API Endpoints       │
                   └───────────────────────────┘
```

- **Framework**: Hono (`@hono/node-server`)
- **Language**: TypeScript (`tsx` runner / watcher)
- **API SDK**: `kiteconnect` official Node.js SDK
- **2FA TOTP Generator**: Built-in RFC 6238 HMAC-SHA1 TOTP generator (`src/lib/totp.ts`)
- **Styling**: Vanilla CSS tokens with CSS variables (Pure Light Theme)

---

## Security & Authentication Flow

Zerodha access tokens expire daily at 6:00 AM IST. This project automates token acquisition using Zerodha's OAuth handshake:

1. **Step 1 (`POST /api/login`)**: Submits `user_id` and `password` to acquire `request_id`.
2. **Step 2 (`POST /api/twofa`)**: Submits 6-digit TOTP code generated from `ACCOUNT_x_TOTP_SECRET`, receiving `public_token` and session cookies.
3. **Step 3 (`GET /connect/login?v=3&api_key=...`)**: Obtains the OAuth session ID (`sess_id`).
4. **Step 4 (`POST /connect/finish`)**: Submits app consent form with `authorize: public_token` to receive the HTTP 302 redirect containing `request_token`.
5. **Step 5 (`KiteConnect SDK`)**: Exchanges `request_token` for an active `access_token` and caches it until 6:00 AM IST next day.

---

## REST API Endpoints

| Endpoint              | Method | Description                                               |
| --------------------- | ------ | --------------------------------------------------------- |
| `/`                   | `GET`  | Main unified holdings dashboard (HTML UI)                 |
| `/login`              | `GET`  | Master password login page                                |
| `/api/auth/login`     | `POST` | Authenticates master password session                     |
| `/api/auth/logout`    | `GET`  | Clears master password session cookie                     |
| `/api/holdings`       | `GET`  | Returns aggregated family portfolio JSON                  |
| `/api/refresh-tokens` | `POST` | Forces re-authentication for all Zerodha accounts         |
| `/api/status`         | `GET`  | Returns token status and expiration timestamp per account |
| `/api/health`         | `GET`  | Health check endpoint (`{ status: "ok" }`)                |

---

## Deployment Options

### Option A: Docker / Coolify

Build and run using the included `Dockerfile` and `docker-compose.yml`:

```bash
docker compose up -d --build
```

### Option B: Cloudflare Workers

Deploy to Cloudflare Workers with KV storage and automatic daily Cron triggers:

```bash
npx wrangler deploy
```

---

## License

MIT License. Developed for family portfolio aggregation.
