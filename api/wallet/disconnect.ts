import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, clearSessionCookie } from '../_lib/auth.js';
import { supabase } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(451).json({ error: 'Method not allowed' });
  }

  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    const session = getSession(req);
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!supabase) {
      // Mock mode
      return res.status(200).json({ success: true });
    }

    // Delete wallet row
    const { error: deleteError } = await supabase
      .from('wallets')
      .delete()
      .eq('user_id', session.userId)
      .eq('address', address.toLowerCase());

    if (deleteError) {
      console.error('Failed to delete wallet row:', deleteError);
      return res.status(500).json({ error: 'Failed to disconnect wallet' });
    }

    // If no other login identifiers remain, clear session
    const { data: user } = await supabase
      .from('users')
      .select('twitter_id')
      .eq('id', session.userId)
      .maybeSingle();

    const { data: remainingWallets } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', session.userId);

    const hasTwitter = !!user?.twitter_id;
    const hasWallets = remainingWallets && remainingWallets.length > 0;

    if (!hasTwitter && !hasWallets) {
      clearSessionCookie(res);
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Wallet disconnect error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
