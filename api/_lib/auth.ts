import { parseCookies, serializeCookie } from './cookies.js';
import { verifyToken, signToken } from './jwt.js';

export function getSession(req: any): { userId: string } | null {
  const cookies = parseCookies(req);
  const token = cookies.session;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(res: any, payload: any) {
  const token = signToken(payload);
  res.setHeader('Set-Cookie', serializeCookie('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }));
}

export function clearSessionCookie(res: any) {
  res.setHeader('Set-Cookie', serializeCookie('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  }));
}
