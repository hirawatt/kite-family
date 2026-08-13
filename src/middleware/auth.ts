import { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { SignJWT, jwtVerify } from 'jose';
import { getDashboardPassword } from '../lib/config';

const COOKIE_NAME = 'family_holdings_session';

function getSecretKey(env?: Record<string, string | undefined>): Uint8Array {
  const pass = env?.SESSION_SECRET || getDashboardPassword(env) || 'default-secret-key-at-least-32-chars-long';
  // Ensure 32 bytes minimum for HMAC SHA-256
  const padded = (pass + '01234567890123456789012345678901').slice(0, 32);
  return new TextEncoder().encode(padded);
}

export async function createSessionCookie(c: Context): Promise<string> {
  const secret = getSecretKey(c.env);
  const jwt = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  setCookie(c, COOKIE_NAME, jwt, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return jwt;
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, COOKIE_NAME, { path: '/' });
}

export async function verifySession(c: Context): Promise<boolean> {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return false;

  try {
    const secret = getSecretKey(c.env);
    const { payload } = await jwtVerify(token, secret);
    return payload.authenticated === true;
  } catch (e) {
    return false;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const path = c.req.path;
  
  // Allow login endpoints & public assets
  if (path === '/login' || path === '/api/auth/login' || path.startsWith('/static/')) {
    return await next();
  }

  const isValid = await verifySession(c);
  if (!isValid) {
    // If API request, return 401 JSON
    if (path.startsWith('/api/')) {
      return c.json({ error: 'Unauthorized. Please log in.' }, 401);
    }
    // If HTML page request, redirect to /login
    return c.redirect('/login');
  }

  return await next();
}
