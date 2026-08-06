import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const rawId = Array.isArray(id) ? id[0] : id;
  const builderIdStr = String(rawId || '').trim();

  if (!builderIdStr) {
    return res.status(400).send('Builder ID is required');
  }
  let name = 'Builder';
  let title = 'HH Goa 2026 Builder';
  let description = 'Claim your identity for Goa\'s premier creative developer gathering. Generate your official HH Goa 2026 digital badge.';
  let ogImage = '';

  try {
    if (supabase) {
      // Find profile by builder_id first (case-insensitive), then UUID fallback
      const { data: profileByBuilderId, error: builderIdError } = await supabase
        .from('builder_profiles')
        .select('*')
        .ilike('builder_id', builderIdStr)
        .maybeSingle();

      if (builderIdError) {
        throw builderIdError;
      }

      const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      let profile = profileByBuilderId;

      if (!profile && uuidLike.test(builderIdStr)) {
        const { data: profileByUuid, error: uuidError } = await supabase
          .from('builder_profiles')
          .select('*')
          .eq('id', builderIdStr)
          .maybeSingle();

        if (uuidError) {
          throw uuidError;
        }

        profile = profileByUuid;
      }

      if (profile) {
        name = profile.name || 'Builder';
        title = profile.title || profile.role || 'Creative Developer';
        description = `${name}'s verified HH Goa 2026 Builder Identity Card. Role: ${title}. Minted on-chain.`;
        ogImage = profile.card_image_url || '';
      }
    } else {
      // Mock mode
      name = 'Mock Builder';
      title = 'Creative Developer';
      description = 'Mock Builder\'s verified HH Goa 2026 Builder Identity Card. Role: Creative Developer. Minted on-chain.';
    }

    const host = req.headers.host || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // Set default preview image if none generated yet
    if (!ogImage) {
      ogImage = `${protocol}://${host}/og-image.png`;
    }

    // Fetch the index.html template from the site itself
    const indexUrl = `${protocol}://${host}/index.html`;
    const fetchRes = await fetch(indexUrl);
    let html = '';
    
    if (fetchRes.ok) {
      html = await fetchRes.text();
    } else {
      // Fallback boilerplate HTML if fetch fails
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FrameInGoa — HH Goa 2026 Builder Identity</title>
  <meta name="description" content="${description}">
  <!-- OG tags -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${name} — HH Goa 2026 Builder Card">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImage}">
  <!-- Twitter card tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${name} — HH Goa 2026 Builder Card">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImage}">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
    }

    // Dynamic replacement of headers/metatags
    const pageTitle = `${name} — HH Goa 2026 Builder Card`;
    html = html
      .replace(/<title>[^<]*<\/title>/g, `<title>${pageTitle}</title>`)
      .replace(/<meta[^>]*name="description"[^>]*>/g, `<meta name="description" content="${description}" />`)
      .replace(/<meta[^>]*property="og:title"[^>]*>/g, `<meta property="og:title" content="${pageTitle}" />`)
      .replace(/<meta[^>]*property="og:description"[^>]*>/g, `<meta property="og:description" content="${description}" />`)
      .replace(/<meta[^>]*property="og:image"[^>]*>/g, `<meta property="og:image" content="${ogImage}" />`)
      .replace(/<meta[^>]*name="twitter:title"[^>]*>/g, `<meta name="twitter:title" content="${pageTitle}" />`)
      .replace(/<meta[^>]*name="twitter:description"[^>]*>/g, `<meta name="twitter:description" content="${description}" />`)
      .replace(/<meta[^>]*name="twitter:image"[^>]*>/g, `<meta name="twitter:image" content="${ogImage}" />`);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err: any) {
    console.error('get-html unexpected error:', err);
    // Return simple fallback page
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`<!DOCTYPE html><html><head><title>FrameInGoa</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`);
  }
}
