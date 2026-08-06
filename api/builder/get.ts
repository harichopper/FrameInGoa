import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Builder ID is required' });
  }

  try {
    if (!supabase) {
      // Mock mode
      return res.status(200).json({
        profile: {
          builder_id: String(id),
          name: 'Mock Builder',
          title: 'Full Stack Alchemist',
          role: 'Creative Developer',
          bio: 'Building in paradise. Hacker at HH Goa 2026.',
          stack: ['React', 'Three.js', 'Solidity', 'Tailwind'],
          github: 'mockgithub',
          twitter: 'mock_builder',
          website: 'https://example.com',
          theme_id: 'cyber',
          badge_number: 'BLD-9999',
          created_at: new Date().toISOString()
        },
        wallets: [
          { address: '0x1234567890abcdef1234567890abcdef12345678' }
        ]
      });
    }

    // Find profile by builder_id (or database UUID fallback)
    const { data: profile, error: profileError } = await supabase
      .from('builder_profiles')
      .select('*')
      .or(`builder_id.eq.${id},id.eq.${id}`)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(444).json({ error: 'Builder profile not found' });
    }

    // Fetch linked wallets
    let wallets: any[] = [];
    if (profile.user_id) {
      const { data: userWallets } = await supabase
        .from('wallets')
        .select('address, wallet_type, verified')
        .eq('user_id', profile.user_id);
      wallets = userWallets || [];
    }

    return res.status(200).json({
      profile,
      wallets
    });
  } catch (err: any) {
    console.error('Get builder details unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
