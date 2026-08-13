import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { getAccountConfigs, getDashboardPassword } from './lib/config';
import { getToken } from './lib/token-store';
import { authenticateAccount } from './lib/http-auth';
import { fetchHoldingsForAccount, FetchHoldingsResult } from './lib/kite';
import { mergeHoldings } from './lib/merge';
import { authMiddleware, createSessionCookie, clearSessionCookie } from './middleware/auth';
import { renderLoginPage } from './views/login';
import { renderDashboardPage } from './views/dashboard';
import { runDailyAutoAuth, startNodeCronDaemon } from './lib/cron';

type Env = {
  Bindings: {
    HOLDINGS_KV?: any;
    DASHBOARD_PASSWORD?: string;
    SESSION_SECRET?: string;
    [key: string]: any;
  };
};

const app = new Hono<Env>();

// Apply Auth Middleware to all routes except /login and /api/auth/login
app.use('*', authMiddleware);

// -------------------------------------------------------------
// Health Check
// -------------------------------------------------------------
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// -------------------------------------------------------------
// Auth Routes
// -------------------------------------------------------------
app.get('/login', (c) => {
  return c.html(renderLoginPage());
});

app.post('/api/auth/login', async (c) => {
  let password = '';
  try {
    const body = await c.req.parseBody();
    password = (body.password as string) || '';
  } catch (e) {
    // Fallback JSON body check
    const json = (await c.req.json().catch(() => ({}))) as any;
    password = json.password || '';
  }

  const expectedPassword = getDashboardPassword(c.env as any);

  if (password && password === expectedPassword) {
    await createSessionCookie(c);
    return c.redirect('/');
  }

  return c.html(renderLoginPage('Invalid password. Please try again.'), 401);
});

app.get('/api/auth/logout', (c) => {
  clearSessionCookie(c);
  return c.redirect('/login');
});

// -------------------------------------------------------------
// Dashboard Page & Holdings Aggregation (With 30s Cache)
// -------------------------------------------------------------
let cachedPortfolio: { timestamp: number; data: any } | null = null;
const HOLDINGS_CACHE_TTL_MS = 30 * 1000; // 30 seconds memory cache

async function getAggregatedPortfolio(c: any, forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedPortfolio && now - cachedPortfolio.timestamp < HOLDINGS_CACHE_TTL_MS) {
    console.log('[Cache] Serving unified holdings from 30s memory cache.');
    return cachedPortfolio.data;
  }

  const accounts = getAccountConfigs(c.env as any);
  const kvBinding = c.env?.HOLDINGS_KV;

  const holdingsPromises: Promise<FetchHoldingsResult>[] = accounts.map(async (acc) => {
    let stored = await getToken(acc.id, kvBinding);

    // Auto authenticate if token is missing or expired
    const isExpired = stored?.expiresAt ? new Date(stored.expiresAt) <= new Date() : true;
    if (!stored || !stored.accessToken || isExpired) {
      console.log(`[AutoAuth] Token missing/expired for ${acc.label}. Authenticating...`);
      const authRes = await authenticateAccount(acc, kvBinding);
      if (authRes.success && authRes.accessToken) {
        stored = {
          accountId: acc.id,
          userId: acc.userId,
          accessToken: authRes.accessToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        return {
          accountId: acc.id,
          label: acc.label,
          userId: acc.userId,
          success: false,
          holdings: [],
          error: authRes.error || 'Authentication failed',
        };
      }
    }

    return await fetchHoldingsForAccount(
      acc.id,
      acc.label,
      acc.userId,
      acc.apiKey,
      stored.accessToken
    );
  });

  const accountResults = await Promise.all(holdingsPromises);
  const mergedData = mergeHoldings(accountResults);

  // Update memory cache if at least one account returned data or attempted
  cachedPortfolio = { timestamp: Date.now(), data: mergedData };
  return mergedData;
}

app.get('/', async (c) => {
  const forceRefresh = c.req.query('refresh') === '1';
  const mergedData = await getAggregatedPortfolio(c, forceRefresh);
  return c.html(renderDashboardPage(mergedData));
});

app.get('/dashboard', async (c) => {
  const forceRefresh = c.req.query('refresh') === '1';
  const mergedData = await getAggregatedPortfolio(c, forceRefresh);
  return c.html(renderDashboardPage(mergedData));
});

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------
app.get('/api/holdings', async (c) => {
  const forceRefresh = c.req.query('refresh') === '1';
  const mergedData = await getAggregatedPortfolio(c, forceRefresh);
  return c.json(mergedData);
});

app.post('/api/refresh-tokens', async (c) => {
  const kvBinding = c.env?.HOLDINGS_KV;
  const results = await runDailyAutoAuth(c.env as any, kvBinding);
  const anyFailed = results.some((r) => !r.success);
  
  // Clear holdings cache on token refresh
  cachedPortfolio = null;
  
  return c.json({
    success: !anyFailed,
    message: anyFailed ? 'Some accounts failed to re-authenticate' : 'All accounts re-authenticated successfully',
    results,
  });
});

app.get('/api/status', async (c) => {
  const accounts = getAccountConfigs(c.env as any);
  const kvBinding = c.env?.HOLDINGS_KV;

  const statuses = await Promise.all(
    accounts.map(async (acc) => {
      const stored = await getToken(acc.id, kvBinding);
      const isLive = stored?.accessToken && new Date(stored.expiresAt) > new Date();
      return {
        accountId: acc.id,
        label: acc.label,
        userId: acc.userId,
        isLive: Boolean(isLive),
        expiresAt: stored?.expiresAt || null,
        updatedAt: stored?.updatedAt || null,
      };
    })
  );

  return c.json({ accounts: statuses });
});

// -------------------------------------------------------------
// Server Initialization
// -------------------------------------------------------------
const port = Number(process.env.PORT) || 3000;

// Start Node.js daemon if running directly via Node
if (typeof process !== 'undefined' && process.release?.name === 'node') {
  startNodeCronDaemon();
  const foundAccounts = getAccountConfigs();
  console.log(`[Server] Family Holdings server starting on http://localhost:${port}`);
  console.log(`[Config] Found ${foundAccounts.length} configured account(s) in environment.`);
  foundAccounts.forEach(a => console.log(`   - ${a.label} (${a.userId}) [API Key: ${a.apiKey.slice(0, 4)}...]`));
  serve({
    fetch: app.fetch,
    port,
  });
}

// Export for Cloudflare Workers / Serverless edge runtimes
export default {
  fetch: app.fetch,
  async scheduled(event: any, env: any, ctx: any) {
    ctx.waitUntil(runDailyAutoAuth(env, env.HOLDINGS_KV));
  },
};
