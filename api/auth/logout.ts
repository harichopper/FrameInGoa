import { VercelRequest, VercelResponse } from '@vercel/node';
import { clearSessionCookie } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Failed to log out' });
  }
}
