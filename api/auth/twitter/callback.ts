import { VercelRequest, VercelResponse } from '@vercel/node';
import { parseCookies, serializeCookie } from '../../_lib/cookies.js';
import { supabase } from '../../_lib/db.js';
import { setSessionCookie, getSession } from '../../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cookies = parseCookies(req);
  const stateCookie = cookies.oauth_state;
  const verifierCookie = cookies.oauth_verifier;
  
  const { code, state, error: oauthError } = req.query;

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const redirectPage = `${appUrl}/#generator`; // redirect back to the studio

  // Clear OAuth cookies on callback landing
  const clearStateCookie = serializeCookie('oauth_state', '', { path: '/', maxAge: 0 });
  const clearVerifierCookie = serializeCookie('oauth_verifier', '', { path: '/', maxAge: 0 });
  res.setHeader('Set-Cookie', [clearStateCookie, clearVerifierCookie]);

  if (oauthError) {
    console.error('OAuth Callback Error:', oauthError);
    return res.redirect(302, `${appUrl}/?error=${encodeURIComponent(String(oauthError))}`);
  }

  if (!code || !state) {
    return res.redirect(302, `${appUrl}/?error=invalid_oauth_request`);
  }

  if (state !== stateCookie) {
    return res.redirect(302, `${appUrl}/?error=state_mismatch`);
  }

  if (!verifierCookie) {
    return res.redirect(302, `${appUrl}/?error=missing_verifier`);
  }

  try {
    const clientId = process.env.TWITTER_CLIENT_ID || '';
    const clientSecret = process.env.TWITTER_CLIENT_SECRET || '';
    const redirectUri = process.env.TWITTER_REDIRECT_URI || `${appUrl}/api/auth/twitter/callback`;

    // 1. Exchange OAuth code for Access Token
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code: String(code),
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: verifierCookie,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('Twitter token exchange failed:', errBody);
      return res.redirect(302, `${appUrl}/?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch User Details from Twitter API v2
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch Twitter user profile');
      return res.redirect(302, `${appUrl}/?error=profile_fetch_failed`);
    }

    const userData = await userResponse.json();
    const twitterUser = userData.data; // { id, name, username, profile_image_url }

    if (!supabase) {
      // Offline/Mock mode database fallback
      console.warn('Supabase not configured. Mocking session creation.');
      const mockUserId = `mock-user-${twitterUser.id}`;
      setSessionCookie(res, { userId: mockUserId });
      // Redirect back, prefilling in URL or storage query
      return res.redirect(302, `${redirectPage}?name=${encodeURIComponent(twitterUser.name)}&username=${encodeURIComponent(twitterUser.username)}&avatar=${encodeURIComponent(twitterUser.profile_image_url)}`);
    }

    // 3. Find or Create User Record
    let userId: string;
    
    // Check if the user is already logged in (e.g. they connected wallet first)
    const existingSession = getSession(req);
    
    if (existingSession?.userId) {
      userId = existingSession.userId;
      // Link X details to existing user row
      await supabase
        .from('users')
        .update({
          twitter_id: twitterUser.id,
          twitter_username: twitterUser.username,
          twitter_name: twitterUser.name,
          twitter_profile_image: twitterUser.profile_image_url
        })
        .eq('id', userId);
    } else {
      // Find user with this twitter_id
      const { data: userByTwitter } = await supabase
        .from('users')
        .select('id')
        .eq('twitter_id', twitterUser.id)
        .maybeSingle();

      if (userByTwitter) {
        userId = userByTwitter.id;
        // Update user profile image / username in case it changed
        await supabase
          .from('users')
          .update({
            twitter_username: twitterUser.username,
            twitter_name: twitterUser.name,
            twitter_profile_image: twitterUser.profile_image_url
          })
          .eq('id', userId);
      } else {
        // Create new user row
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            twitter_id: twitterUser.id,
            twitter_username: twitterUser.username,
            twitter_name: twitterUser.name,
            twitter_profile_image: twitterUser.profile_image_url
          })
          .select('id')
          .single();

        if (createError || !newUser) {
          console.error('Failed to create user record:', createError);
          return res.redirect(302, `${appUrl}/?error=database_error`);
        }
        userId = newUser.id;
      }
    }

    // 4. Set Session Cookie & Redirect
    setSessionCookie(res, { userId });
    res.redirect(302, redirectPage);
  } catch (err: any) {
    console.error('Twitter OAuth callback unexpected error:', err);
    res.redirect(302, `${appUrl}/?error=auth_internal_error`);
  }
}
