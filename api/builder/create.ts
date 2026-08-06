import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession } from '../_lib/auth.js';
import { supabase, getUniqueBuilderId } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(451).json({ error: 'Method not allowed' });
  }

  try {
    const session = getSession(req);
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Authentication required to save profile' });
    }

    const {
      name,
      title,
      role,
      bio,
      stack,
      github,
      twitter,
      website,
      crop,
      zoom,
      rotation,
    } = req.body;

    const themeId = req.body.themeId !== undefined ? req.body.themeId : req.body.theme_id;
    const badgeNumber = req.body.badgeNumber !== undefined ? req.body.badgeNumber : req.body.badge_number;
    const photoUrl = req.body.photoUrl !== undefined ? req.body.photoUrl : req.body.photo_url;
    const croppedAreaPixels = req.body.croppedAreaPixels !== undefined ? req.body.croppedAreaPixels : req.body.cropped_area_pixels;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!supabase) {
      // Mock mode
      return res.status(200).json({
        success: true,
        profile: {
          builder_id: 'HHG26-MOCK-TEMP',
          name,
          title,
          role,
          bio,
          stack,
          github,
          twitter,
          website,
          theme_id: themeId,
          badge_number: badgeNumber,
        }
      });
    }

    // Check if profile already exists for this user
    const { data: existingProfile } = await supabase
      .from('builder_profiles')
      .select('*')
      .eq('user_id', session.userId)
      .maybeSingle();

    let resultProfile;

    if (existingProfile) {
      // Update existing
      const { data: updated, error: updateError } = await supabase
        .from('builder_profiles')
        .update({
          name,
          title,
          role,
          bio,
          stack,
          github,
          twitter,
          website,
          theme_id: themeId || 'cyber',
          badge_number: badgeNumber,
          photo_url: photoUrl,
          crop: crop || null,
          zoom: zoom || 1.0,
          rotation: rotation || 0.0,
          cropped_area_pixels: croppedAreaPixels || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Update profile error:', updateError);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      resultProfile = updated;
    } else {
      // Create new: generate unique Builder ID
      const builderId = await getUniqueBuilderId();
      
      const { data: inserted, error: insertError } = await supabase
        .from('builder_profiles')
        .insert({
          user_id: session.userId,
          builder_id: builderId,
          name,
          title,
          role,
          bio,
          stack,
          github,
          twitter,
          website,
          theme_id: themeId || 'cyber',
          badge_number: badgeNumber,
          photo_url: photoUrl,
          crop: crop || null,
          zoom: zoom || 1.0,
          rotation: rotation || 0.0,
          cropped_area_pixels: croppedAreaPixels || null
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Insert profile error:', insertError);
        return res.status(500).json({ error: 'Failed to create profile' });
      }
      resultProfile = inserted;
    }

    return res.status(200).json({ success: true, profile: resultProfile });
  } catch (err: any) {
    console.error('Create profile unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
