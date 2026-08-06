import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyMessage } from 'ethers';
import { getSession, setSessionCookie } from '../_lib/auth.js';
import { supabase } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(451).json({ error: 'Method not allowed' });
  }

  const { address, signature, message } = req.body;

  if (!address || !signature || !message) {
    return res.status(400).json({ error: 'Missing wallet verification details' });
  }

  try {
    // 1. Recover and verify the signer's address
    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    // 2. Validate the signed message structure and timestamp
    // Expected format: "FrameInGoa Connect Wallet: {address}\nTimestamp: {timestamp}"
    const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
    if (!timestampMatch) {
      return res.status(400).json({ error: 'Invalid verification message format' });
    }

    const timestamp = Number(timestampMatch[1]);
    const drift = Math.abs(Date.now() - timestamp);
    if (drift > 10 * 60 * 1000) { // 10 minutes max drift
      return res.status(401).json({ error: 'Verification message signature expired' });
    }

    if (!supabase) {
      // Mock/Offline mode database fallback
      const mockUserId = `mock-user-wallet-${address.toLowerCase().slice(0, 10)}`;
      setSessionCookie(res, { userId: mockUserId });
      return res.status(200).json({
        success: true,
        address: address,
        userId: mockUserId,
        msg: 'Verified successfully (Mock mode)'
      });
    }

    // 3. Find or create session user
    let userId: string;
    const session = getSession(req);

    if (session?.userId) {
      userId = session.userId;
    } else {
      // User is not logged in: check if wallet already belongs to a user
      const { data: existingWallet } = await supabase
        .from('wallets')
        .select('user_id')
        .eq('address', address.toLowerCase())
        .maybeSingle();

      if (existingWallet) {
        userId = existingWallet.user_id;
      } else {
        // Create new user for this wallet
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            twitter_id: null // Web3 wallet user, no X linked yet
          })
          .select('id')
          .single();

        if (createError || !newUser) {
          console.error('Failed to create user for wallet:', createError);
          return res.status(500).json({ error: 'Database creation error' });
        }
        userId = newUser.id;
      }
    }

    // 4. Link/upsert wallet row
    const { error: walletError } = await supabase
      .from('wallets')
      .upsert({
        user_id: userId,
        address: address.toLowerCase(),
        wallet_type: 'evm',
        verified: true
      }, {
        onConflict: 'user_id,address'
      });

    if (walletError) {
      console.error('Failed to upsert wallet row:', walletError);
      return res.status(500).json({ error: 'Failed to record wallet connection' });
    }

    // 5. Establish session if not logged in
    if (!session?.userId) {
      setSessionCookie(res, { userId });
    }

    return res.status(200).json({
      success: true,
      userId,
      address: address.toLowerCase()
    });
  } catch (err: any) {
    console.error('Wallet verify error:', err);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
}
