import { KiteConnect } from 'kiteconnect';
import { generateTOTP } from './totp';
import { AccountConfig } from './config';
import { saveToken, StoredToken } from './token-store';

interface AuthResult {
  success: boolean;
  accessToken?: string;
  userId?: string;
  error?: string;
}

// Helper to parse set-cookie headers into a cookie map
function extractCookies(response: Response, existingCookies: Record<string, string> = {}): Record<string, string> {
  const cookieMap = { ...existingCookies };
  const setCookieHeaders = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  if (setCookieHeaders.length === 0) {
    const rawSetCookie = response.headers.get('set-cookie');
    if (rawSetCookie) {
      setCookieHeaders.push(...rawSetCookie.split(/,\s*(?=[a-zA-Z0-9_]+=)/));
    }
  }

  for (const header of setCookieHeaders) {
    const parts = header.split(';')[0].split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (val) {
        cookieMap[name] = val;
      }
    }
  }
  return cookieMap;
}

function stringifyCookies(cookieMap: Record<string, string>): string {
  return Object.entries(cookieMap)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

export async function authenticateAccount(account: AccountConfig, kvBinding?: any): Promise<AuthResult> {
  if (!account.password || !account.totpSecret) {
    const err = `Missing Zerodha password or TOTP secret for account ${account.label} (${account.userId}).`;
    console.error(`[Auth] ${err}`);
    return {
      success: false,
      error: err,
    };
  }

  try {
    console.log(`[Auth] Beginning login handshake for ${account.label} (${account.userId})...`);
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    let cookies: Record<string, string> = {};

    // -------------------------------------------------------------
    // Step 1: POST /api/login
    // -------------------------------------------------------------
    console.log(`[Auth] Step 1: Submitting credentials to /api/login...`);
    const loginBody = new URLSearchParams({
      user_id: account.userId,
      password: account.password,
    });

    const loginRes = await fetch('https://kite.zerodha.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent,
      },
      body: loginBody.toString(),
    });

    cookies = extractCookies(loginRes, cookies);
    const loginJson = (await loginRes.json()) as any;

    if (loginJson.status !== 'success' || !loginJson.data?.request_id) {
      const errMsg = `Step 1 Login failed: ${loginJson.message || JSON.stringify(loginJson)}`;
      console.error(`[Auth] ${account.label} -> ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }

    const requestId = loginJson.data.request_id;
    console.log(`[Auth] Step 1 Success. Got request_id: ${requestId}`);

    // -------------------------------------------------------------
    // Step 2: POST /api/twofa (Pure RFC 6238 TOTP)
    // -------------------------------------------------------------
    const totpCode = generateTOTP(account.totpSecret);
    console.log(`[Auth] Step 2: Submitting 2FA TOTP code (${totpCode})...`);

    const twofaBody = new URLSearchParams({
      user_id: account.userId,
      request_id: requestId,
      twofa_value: totpCode,
      twofa_type: 'totp',
    });

    const twofaRes = await fetch('https://kite.zerodha.com/api/twofa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent,
        'Cookie': stringifyCookies(cookies),
      },
      body: twofaBody.toString(),
    });

    cookies = extractCookies(twofaRes, cookies);
    const twofaJson = (await twofaRes.json()) as any;

    if (twofaJson.status !== 'success') {
      const errMsg = `Step 2 2FA failed: ${twofaJson.message || JSON.stringify(twofaJson)}`;
      console.error(`[Auth] ${account.label} -> ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }

    const publicToken = cookies.public_token || twofaJson.data?.public_token;
    console.log(`[Auth] Step 2 Success. 2FA verified.`);

    // -------------------------------------------------------------
    // Step 3: GET /connect/login?v=3&api_key={API_KEY} -> Extract sess_id
    // -------------------------------------------------------------
    console.log(`[Auth] Step 3: Fetching OAuth connect URL with api_key...`);
    const connectRes = await fetch(`https://kite.zerodha.com/connect/login?v=3&api_key=${account.apiKey}`, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Cookie': stringifyCookies(cookies),
      },
      redirect: 'manual',
    });

    cookies = extractCookies(connectRes, cookies);
    const locFinish = connectRes.headers.get('location');

    if (!locFinish) {
      const errMsg = `Step 3 Connect login failed: No location header in redirect.`;
      console.error(`[Auth] ${account.label} -> ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }

    const sessId = new URL(locFinish, 'https://kite.zerodha.com').searchParams.get('sess_id');
    if (!sessId) {
      const errMsg = `Step 3 Connect login failed: sess_id not found in redirect URL (${locFinish}).`;
      console.error(`[Auth] ${account.label} -> ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }

    console.log(`[Auth] Step 3 Success. Acquired sess_id for connect flow.`);

    // -------------------------------------------------------------
    // Step 4: POST /connect/finish (App Authorization)
    // -------------------------------------------------------------
    console.log(`[Auth] Step 4: Submitting app authorization to /connect/finish...`);
    const finishRes = await fetch('https://kite.zerodha.com/connect/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent,
        'Cookie': stringifyCookies(cookies),
        'Origin': 'https://kite.zerodha.com',
        'Referer': `https://kite.zerodha.com/connect/authorize?api_key=${account.apiKey}&sess_id=${sessId}`,
      },
      body: new URLSearchParams({
        sess_id: sessId,
        api_key: account.apiKey,
        authorize: publicToken || '',
      }).toString(),
      redirect: 'manual',
    });

    const callbackUrl = finishRes.headers.get('location');
    if (!callbackUrl) {
      const errMsg = `Step 4 App authorization failed: /connect/finish did not return a callback redirect.`;
      console.error(`[Auth] ${account.label} -> ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }

    const redirectUrlObj = new URL(callbackUrl, 'https://kite.zerodha.com');
    const requestToken = redirectUrlObj.searchParams.get('request_token');

    if (!requestToken) {
      const errMsg = `Step 4 App authorization failed: request_token not found in callback URL (${callbackUrl}).`;
      console.error(`[Auth] ${account.label} -> ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }

    console.log(`[Auth] Step 4 Success. Intercepted request_token: ${requestToken.slice(0, 6)}...`);

    // -------------------------------------------------------------
    // Step 5: KiteConnect SDK Session Generation
    // -------------------------------------------------------------
    console.log(`[Auth] Step 5: Exchanging request_token using official KiteConnect SDK...`);
    const kc = new KiteConnect({ api_key: account.apiKey });
    const session = await kc.generateSession(requestToken, account.apiSecret);

    if (!session || !session.access_token) {
      const errMsg = `Step 5 Token Exchange failed: No access_token returned by KiteConnect SDK.`;
      console.error(`[Auth] ${account.label} -> ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }

    const accessToken = session.access_token;
    console.log(`[Auth] Step 5 Success! Acquired access_token for ${account.label}.`);

    // Compute expiration: 6 AM next day IST
    const now = new Date();
    const tomorrow6AM = new Date(now);
    tomorrow6AM.setHours(6, 0, 0, 0);
    if (now.getHours() >= 6) {
      tomorrow6AM.setDate(tomorrow6AM.getDate() + 1);
    }

    const tokenRecord: StoredToken = {
      accountId: account.id,
      userId: account.userId,
      accessToken,
      expiresAt: tomorrow6AM.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveToken(tokenRecord, kvBinding);

    return {
      success: true,
      accessToken,
      userId: account.userId,
    };
  } catch (err: any) {
    const errMsg = `Authentication exception for ${account.label}: ${err.message || String(err)}`;
    console.error(`[Auth] ${errMsg}`);
    return {
      success: false,
      error: errMsg,
    };
  }
}
