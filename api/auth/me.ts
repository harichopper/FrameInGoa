import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession } from '../_lib/auth.js';
import { supabase } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const session = getSession(req);
    if (!session || !session.userId) {
      return res.status(200).json({ user: null });
    }

    if (!supabase) {
      // Mock/Offline mode active
      return res.status(200).json({
        user: {
          id: session.userId,
          twitter_username: 'mock_builder',
          twitter_name: 'Mock Builder',
          twitter_profile_image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
        },
        profile: {
          builder_id: 'HHG26-MOCK-TEMP',
          name: 'Mock Builder',
          title: 'Full Stack Alchemist',
          role: 'Creative Developer',
          stack: ['React', 'Three.js', 'Solidity'],
          github: 'mockgithub',
          twitter: 'mock_builder',
          theme_id: 'cyber',
          badge_number: 'BLD-9999'
        },
        wallets: []
      });
    }

    // 1. Fetch User row
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .maybeSingle();

    if (userError || !user) {
      return res.status(200).json({ user: null });
    }

    // 2. Fetch linked wallets
    const { data: wallets } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', session.userId);

    // 3. Fetch active builder profile
    const { data: profile } = await supabase
      .from('builder_profiles')
      .select('*')
      .eq('user_id', session.userId)
      .maybeSingle();

    return res.status(200).json({
      user: {
        id: user.id,
        twitter_username: user.twitter_username,
        twitter_name: user.twitter_name,
        twitter_profile_image: user.twitter_profile_image,
      },
      profile: profile || null,
      wallets: wallets || [],
    });
  } catch (err: any) {
    console.error('API me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
