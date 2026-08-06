import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { serializeCookie } from '../../_lib/cookies.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = process.env.TWITTER_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/twitter/callback`;

    if (!clientId) {
      return res.status(500).json({ error: 'TWITTER_CLIENT_ID is not configured in the environment' });
    }

    const state = crypto.randomBytes(16).toString('hex');
    const verifier = crypto.randomBytes(32).toString('hex');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

    const stateCookie = serializeCookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 300, // 5 mins
    });

    const verifierCookie = serializeCookie('oauth_verifier', verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 300, // 5 mins
    });

    res.setHeader('Set-Cookie', [stateCookie, verifierCookie]);

    const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?` + new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'users.read tweet.read',
      state: state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }).toString();

    res.redirect(302, twitterAuthUrl);
  } catch (err: any) {
    console.error('Twitter redirect error:', err);
    res.status(500).json({ error: 'Failed to initiate Twitter authorization' });
  }
}
