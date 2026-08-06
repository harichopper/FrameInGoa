import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : null;

function generateBuilderId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude confusing chars like 0, 1, O, I
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `HHG26-${part1}-${part2}`;
}

export async function getUniqueBuilderId(): Promise<string> {
  if (!supabase) {
    // Return a mock if database is not configured
    return `HHG26-MOCK-TEMP`;
  }

  let attempts = 0;
  while (attempts < 10) {
    const builderId = generateBuilderId();
    const { data, error } = await supabase
      .from('builder_profiles')
      .select('id')
      .eq('builder_id', builderId)
      .maybeSingle();

    if (!error && !data) {
      return builderId;
    }
    attempts++;
  }
  throw new Error('Could not generate unique Builder ID');
}
