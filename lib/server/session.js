// Signed session cookie (HS256 JWT). Used by the API routes and by middleware.js (edge runtime),
// so it only depends on `jose`.
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'ohj_session';

// esigntech keeps a login for 1 hour. Change with SESSION_HOURS.
export function sessionMaxAgeSeconds() {
  const h = Number(process.env.SESSION_HOURS || 1);
  return Math.max(60, Math.round((Number.isFinite(h) && h > 0 ? h : 1) * 3600));
}

function secretKey() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET 환경 변수가 없습니다.');
    return new TextEncoder().encode('dev-only-insecure-session-secret-change-me');
  }
  return new TextEncoder().encode(s);
}

export async function createSessionToken(user) {
  return new SignJWT({ email: user.email, name: user.name, role: user.role, picture: user.picture || null })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.email)
    .setIssuedAt()
    .setExpirationTime(`${sessionMaxAgeSeconds()}s`)
    .sign(secretKey());
}

// Returns the session payload or null.
export async function readSessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    return {
      email: payload.email,
      name: payload.name,
      role: payload.role,
      picture: payload.picture || null,
      exp: payload.exp ? payload.exp * 1000 : null,
    };
  } catch {
    return null;
  }
}

export function cookieOptions(maxAge = sessionMaxAgeSeconds()) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}
