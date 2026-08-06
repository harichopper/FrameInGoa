import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const rawId = Array.isArray(id) ? id[0] : id;
  const builderIdStr = String(rawId || '').trim();

  if (!builderIdStr) {
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

    // Find profile by builder_id (case-insensitive to tolerate pasted/typed casing)
    const { data: profileByBuilderId, error: builderIdError } = await supabase
      .from('builder_profiles')
      .select('*')
      .ilike('builder_id', builderIdStr)
      .maybeSingle();

    if (builderIdError) {
      console.error('Get builder details builder_id lookup error:', builderIdError);
      return res.status(500).json({ error: 'Failed to lookup builder profile' });
    }

    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let profile = profileByBuilderId;

    // Optional UUID fallback for legacy/direct DB ID URLs
    if (!profile && uuidLike.test(builderIdStr)) {
      const { data: profileByUuid, error: uuidError } = await supabase
        .from('builder_profiles')
        .select('*')
        .eq('id', builderIdStr)
        .maybeSingle();

      if (uuidError) {
        console.error('Get builder details uuid lookup error:', uuidError);
        return res.status(500).json({ error: 'Failed to lookup builder profile' });
      }

      profile = profileByUuid;
    }

    if (!profile) {
      return res.status(404).json({ error: 'Builder profile not found' });
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
