# Family Holdings Dashboard — Complete Setup & Deployment Guide

This guide provides step-by-step instructions for:
1. **Kite Developer Portal Setup** — Exact field values for each Zerodha account.
2. **Local Testing & Troubleshooting Guide** — How to run, test, and debug on your computer.
3. **Deploying on Coolify UI** — Complete Docker container deployment walk-through.
4. **Deploying on Cloudflare Workers & Dashboard** — Edge serverless deployment with Cron Triggers & KV storage.

---

## Part 1: Zerodha Kite Developer Portal Setup

Each family member's Zerodha account requires its own **Kite Connect Personal App**. Creating Personal apps is **100% free**.

### Step 1.1: Log into Kite Developer Portal
1. Go to [https://developers.kite.trade](https://developers.kite.trade) and log in (or sign up).
2. Click **Create new app** at the top right.

### Step 1.2: App Field Values (Referencing Portal Screen)

| Field Name | Value to Enter | Explanation |
|---|---|---|
| **Type** | **Personal** (Free) | Select the middle radio button (`Personal / Free`). This grants full portfolio read access without monthly API fees. |
| **App name** | `Family Holdings - Self` | Give a descriptive name for each member (e.g., `Family Holdings - Spouse`, `Family Holdings - Self`). |
| **Zerodha Client ID** | `AB1234` | Enter the **Zerodha User ID** of the account owner (e.g., `AB1234`). |
| **App icon** | *(Optional)* | Leave empty or upload any square icon. |
| **Redirect URL** | `http://127.0.0.1:3000/api/auth/callback` | For local testing set `http://127.0.0.1:3000/api/auth/callback`. For production, set `https://your-domain.com/api/auth/callback`. |
| **Postback URL** | *(Leave blank)* | Not required for portfolio read-only operations. |
| **Description** | `Unified family portfolio tracking` | Short description. |

Click **Create**.

---

### Step 1.3: Copy Credentials to `.env`
After creating the app, click on your app under **My apps**. Copy the following keys into your `.env` file:

- **API Key** (e.g. `w8x7y6z5a4b3c2d1`) → Set as `ACCOUNT_1_API_KEY`
- **API Secret** (e.g. `m9n8b7v6c5x4z3a2`) → Set as `ACCOUNT_1_API_SECRET`

---

### Step 1.4: Retrieve Zerodha TOTP Secret Key

The automated login engine requires the **2FA TOTP Secret Key** to generate 6-digit 2FA codes automatically:

1. Log into Zerodha Kite Web ([https://kite.zerodha.com](https://kite.zerodha.com)) with the family member's credentials.
2. Click on the User ID (top right) → **My profile / Settings**.
3. Under **Password & Security**, click **Enable 2FA TOTP** (or *Re-enable 2FA TOTP* if already enabled).
4. An email OTP will be sent to verify. Enter the email OTP.
5. On the screen displaying the QR code, click **"Can't scan QR code? Copy secret key"** (or inspect the key text).
6. Copy the Base32 alphanumeric string (e.g. `JBSWY3DPEHPK3PXP`) → Set as `ACCOUNT_1_TOTP_SECRET`.
7. Complete the TOTP setup by scanning the QR code in Google Authenticator or Microsoft Authenticator once to activate it.

---

## Part 2: Local Testing & Troubleshooting Guide

Before deploying to production, test the application locally on your machine.

### Step 2.1: Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)

### Step 2.2: Setup Local `.env`
Inside `/Users/vh/Desktop/kite-family`, create a `.env` file (you can copy `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your actual account credentials:
```bash
DASHBOARD_PASSWORD="admin"

ACCOUNT_1_LABEL="Self"
ACCOUNT_1_USER_ID="AB1234"
ACCOUNT_1_PASSWORD="zerodha_password"
ACCOUNT_1_TOTP_SECRET="JBSWY3DPEHPK3PXP"
ACCOUNT_1_API_KEY="your_api_key"
ACCOUNT_1_API_SECRET="your_api_secret"
```

### Step 2.3: Start Local Development Server

```bash
# 1. Open terminal in project folder
cd /Users/vh/Desktop/kite-family

# 2. Install dependencies (if not done already)
npm install

# 3. Start development server (with hot-reload)
npm run dev
```

You will see:
`[Server] Family Holdings server starting on http://localhost:3000`

---

### Step 2.4: Step-by-Step Local Verification

1. **Test Login Page**:
   - Open [http://localhost:3000](http://localhost:3000) in your browser.
   - You should be automatically redirected to [http://localhost:3000/login](http://localhost:3000/login).
   - Enter your `DASHBOARD_PASSWORD` (e.g. `admin`) and click **Log In**.

2. **Test Dashboard & Portfolio Aggregation**:
   - Once logged in, the app will automatically authenticate your configured accounts via pure HTTP API requests (~200ms) and fetch holdings.
   - Verify that your unified stocks appear in the table with total portfolio valuation, overall return, and day's change.
   - Click on any stock row to expand the per-family-member breakdown table.

3. **Test Search & Filter**:
   - Type a stock symbol (e.g. `SBIN` or `INFY`) into the search box to verify instant row filtering.

4. **Test Account Status & Re-Authentication**:
   - Look at the **ACCOUNTS** status bar at the top of the dashboard.
   - Active status pill indicates the token is active.
   - Click **Re-Auth Accounts** to manually test running the HTTP 2FA handshake for all accounts.

5. **Test Local Docker Build**:
   ```bash
   # Test building and running in Docker locally
   docker-compose up --build
   ```
   Open [http://localhost:3000](http://localhost:3000) to confirm the Docker container runs properly.

---

### Step 2.5: Local Troubleshooting Matrix

| Issue / Symptom | Possible Cause | Solution |
|---|---|---|
| **`Step 1 Login failed`** | Wrong `ACCOUNT_N_USER_ID` or `ACCOUNT_N_PASSWORD`. | Verify Zerodha credentials by logging into `kite.zerodha.com` manually in an incognito window. |
| **`Step 2 2FA failed`** | Wrong `ACCOUNT_N_TOTP_SECRET` or system time out of sync. | 1. Ensure TOTP secret key is Base32 (no spaces).<br>2. Ensure your computer system time is accurate (TOTP codes expire every 30 seconds). |
| **`Step 3 Connect login failed`** | Mismatch between `ACCOUNT_N_API_KEY` and client ID. | Verify that the API Key belongs to the Zerodha Client ID configured for that account. |
| **`Step 4 Token Exchange failed`** | Invalid `ACCOUNT_N_API_SECRET`. | Check that `ACCOUNT_N_API_SECRET` matches the secret in `developers.kite.trade`. |
| **Redirected back to `/login` immediately** | Cookie blocked or session expired. | Ensure browser allows cookies for `localhost`. |

---

## Part 3: Deployment using Coolify UI

Coolify is an open-source, self-hosted PaaS (like Heroku/Netlify).

### Step 3.1: Push Project to Git Repository
1. Initialize git and push your `/Users/vh/Desktop/kite-family` directory to GitHub, GitLab, or Gitea:
   ```bash
   cd /Users/vh/Desktop/kite-family
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin git@github.com:yourusername/kite-family.git
   git push -u origin main
   ```

### Step 3.2: Add Resource in Coolify
1. Open your **Coolify Dashboard**.
2. Navigate to **Projects** → Select your Project → Select Environment (e.g. `production`).
3. Click **+ Add Resource** → Select **Public Repository** or **Private Repository** (connect GitHub App).
4. Enter your Repository URL (`https://github.com/yourusername/kite-family`) and branch `main`.

### Step 3.3: Configure Build Pack & Port
1. In the Application settings:
   - **Build Pack**: Select `Dockerfile` (or `Docker Compose`).
   - **Port Exposed**: Set to `3000`.
   - **Install Command / Build Command**: Defaults automatically via Dockerfile.

### Step 3.4: Set Environment Variables in Coolify UI
Go to the **Environment Variables** tab in your Coolify Application and add all variables:

```bash
# Dashboard Master Password
DASHBOARD_PASSWORD=your_strong_dashboard_password

# Account 1 - Dad
ACCOUNT_1_LABEL=Dad
ACCOUNT_1_USER_ID=AB1234
ACCOUNT_1_PASSWORD=zerodha_password_1
ACCOUNT_1_TOTP_SECRET=BASE32SECRET1
ACCOUNT_1_API_KEY=kite_api_key_1
ACCOUNT_1_API_SECRET=kite_api_secret_1

# Account 2 - Mom
ACCOUNT_2_LABEL=Mom
ACCOUNT_2_USER_ID=CD5678
ACCOUNT_2_PASSWORD=zerodha_password_2
ACCOUNT_2_TOTP_SECRET=BASE32SECRET2
ACCOUNT_2_API_KEY=kite_api_key_2
ACCOUNT_2_API_SECRET=kite_api_secret_2

# (Add up to ACCOUNT_10_*)
```

### Step 3.5: Configure Persistent Storage (Volume)
Tokens are cached to `/app/data/tokens.json` to prevent unnecessary logins:

1. In Coolify, navigate to **Storages / Volumes**.
2. Add a new Persistent Storage entry:
   - **Destination Path**: `/app/data`
   - **Source / Volume Name**: `kite-family-tokens-data`

### Step 3.6: Custom Domain & SSL
1. Under **Domains / FQDN**, enter your domain name:
   `https://holdings.yourdomain.com`
2. Click **Save** and then click **Deploy**.
3. Coolify automatically builds the container, requests a Let's Encrypt SSL certificate, and launches your app!

---

## Part 4: Deployment using Cloudflare Workers & Dashboard

If you prefer serverless edge hosting on Cloudflare Workers (100% Free tier supported).

### Step 4.1: Create Cloudflare KV Namespace
1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages** → **KV**.
3. Click **Create a Namespace**.
4. Name: `HOLDINGS_KV` → Click **Add**.
5. Copy the generated **Namespace ID** (e.g. `9f8e7d6c5b4a3f2e1d0c`).

### Step 4.2: Update `wrangler.toml`
Open `wrangler.toml` in your project and paste your KV Namespace ID:

```toml
name = "kite-family-holdings"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[triggers]
crons = ["15 0 * * *"] # 6:15 AM IST daily auto-auth

[[kv_namespaces]]
binding = "HOLDINGS_KV"
id = "PASTE_YOUR_KV_NAMESPACE_ID_HERE"
```

### Step 4.3: Deploy via Wrangler CLI
From your local terminal inside `kite-family`:

```bash
# 1. Login to Cloudflare
npx wrangler login

# 2. Deploy worker
npx wrangler deploy
```

### Step 4.4: Configure Environment Variables in Cloudflare Dashboard
1. Go to **Cloudflare Dashboard** → **Workers & Pages** → Select `kite-family-holdings`.
2. Go to **Settings** → **Variables & Secrets**.
3. Under **Environment Variables**, click **Add variable**:
   - `DASHBOARD_PASSWORD` (Select *Encrypt* to make it a secret)
   - `ACCOUNT_1_LABEL`, `ACCOUNT_1_USER_ID`, `ACCOUNT_1_PASSWORD`, `ACCOUNT_1_TOTP_SECRET`, `ACCOUNT_1_API_KEY`, `ACCOUNT_1_API_SECRET`
   - `ACCOUNT_2_LABEL`, `ACCOUNT_2_USER_ID`, `ACCOUNT_2_PASSWORD`, `ACCOUNT_2_TOTP_SECRET`, `ACCOUNT_2_API_KEY`, `ACCOUNT_2_API_SECRET`
   - (and so on)
4. Click **Save and Deploy**.

### Step 4.5: Verify Cron Trigger
1. In Cloudflare Dashboard → Worker → **Settings** → **Triggers**.
2. Confirm under **Cron Triggers** that `15 0 * * *` is active.
3. Your app is live at `https://kite-family-holdings.your-subdomain.workers.dev`!

---

## Security Best Practices

1. **Keep Secrets Secret**: Never commit `.env` or plain-text Zerodha passwords to public Git repositories.
2. **Coolify Encryption**: Coolify automatically encrypts environment variables stored in its database.
3. **Cloudflare Secrets**: Mark all passwords and TOTP secrets as **Encrypted** in Cloudflare Worker settings.
4. **Master Password**: Pick a strong password for `DASHBOARD_PASSWORD` as it controls access to your family's aggregated portfolio value.
