# FrameInGoa — HH Goa 2026 Frame / Builder ID Generator

FrameInGoa is a mobile-friendly web app that lets users upload a photo and instantly generate:

- **Format A:** PFP frame/overlay for X profile pictures
- **Format B:** Builder ID card with name, role, stack, title, and event branding

It is optimized for quick create → download → share flows, with dynamic public builder links for social previews.

---

## Live Link

- Production: https://frame-in-goa-gules.vercel.app

---

## Key Features

- **Near-instant generation** with live preview
- **Real photo handling** (JPG, PNG, HEIC/HEIF, WebP)
- **Crop + zoom + rotation** for off-center/portrait/landscape photos
- **Two export formats** (ID Card + PFP Frame)
- **High-resolution PNG download** (1080x1080 class output)
- **Share to X flow** with prefilled caption and `#FrameInGoa`
- **Dynamic public profile pages** at `/builder/{builderId}`
- **OG/Twitter preview tags** rendered per builder profile
- **No login wall** for image generation
- Optional identity layer:
  - X (Twitter) OAuth sign-in
  - MetaMask wallet verification
  - Mobile MetaMask deep-link fallback support

---

## Product Flow

1. Upload a photo (or use camera)
2. Adjust crop/zoom/rotation
3. Fill builder details (name, role, title, stack, theme)
4. Generate final graphic
5. Download PNG
6. Share to X using prefilled tweet intent link

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling/UX:** Tailwind CSS, Motion, Lucide
- **Imaging:** html-to-image, react-easy-crop, heic2any
- **Backend (Vercel Functions):**
  - X OAuth callback/login
  - Session cookies + JWT
  - Builder profile CRUD
  - Wallet signature verification (ethers)
- **Database/Storage:** Supabase (PostgreSQL + Storage)

---

## Project Structure

```text
src/                 React app (views, context, components)
api/                 Vercel serverless API routes
  auth/              X login/callback/logout/session endpoints
  builder/           Profile create/get + HTML OG rendering
  wallet/            Wallet connect/disconnect endpoints
supabase/schema.sql  Database schema
vercel.json          Rewrites + security/cache headers
```

---

## API Surface (High Level)

- `GET /api/auth/me` — current user/session/profile/wallets
- `POST /api/auth/logout` — clear session
- `GET /api/auth/twitter/login` — start X OAuth
- `GET /api/auth/twitter/callback` — complete X OAuth
- `POST /api/wallet/connect` — verify signed wallet ownership
- `POST /api/wallet/disconnect` — remove wallet link
- `POST /api/builder/create` — create/update builder profile
- `GET /api/builder/get?id=...` — fetch profile JSON + wallets
- `GET /builder/:builderId` — public builder page (rewritten to dynamic HTML endpoint for OG tags)

---

## Dynamic Routing + OG Preview

Public builder links use:

- `/builder/{builderId}`

Vercel rewrites this to:

- `/api/builder/get-html?id={builderId}`

The HTML response injects dynamic title/description/image meta tags so WhatsApp/X link previews show the builder-specific card image when available.

---

## Environment Variables

Copy `.env.example` to `.env` and fill values:

```env
APP_URL=
GEMINI_API_KEY=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_REDIRECT_URI=
JWT_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Notes:

- `TWITTER_REDIRECT_URI` must match your X app callback exactly.
- Use Supabase **service role** key only on backend routes.
- `APP_URL` should be your deployed base URL in production.

---

## Local Development

### Prerequisites

- Node.js 22.x
- npm

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env
   ```
   (On Windows PowerShell: `Copy-Item .env.example .env`)
3. Fill `.env` values.
4. Start dev server:
   ```bash
   npm run dev
   ```

App runs at `http://localhost:3000`.

---

## Database Setup (Supabase)

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql` to create all required tables and policies.

---

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — TypeScript check (`tsc --noEmit`)

---

## Deployment (Vercel)

1. Import repo into Vercel.
2. Add all `.env` variables in project settings.
3. Ensure `APP_URL` and `TWITTER_REDIRECT_URI` use production domain.
4. Deploy.

`vercel.json` already configures:

- API and builder rewrites
- security headers
- asset caching headers

---

## Troubleshooting

### Link preview not showing generated card

- Make sure you are sharing `/builder/{builderId}`, not `/`.
- Ensure profile save includes card image upload.
- Re-share after deployment so crawlers fetch fresh OG tags.

### MetaMask on mobile

- If extension provider is unavailable, app deep-links to MetaMask mobile dApp browser.
- Open the site inside MetaMask app and retry connect.

### X OAuth callback mismatch

- Verify callback URI in X Developer Portal exactly matches `TWITTER_REDIRECT_URI`.

---

## Challenge Readiness Snapshot

- Supports both required formats (PFP + Builder ID)
- Supports required image input formats
- No login wall for generation
- Download + share flow implemented
- Dynamic OG preview path implemented
- Mobile-first responsive UX implemented

---

Built for **HH Goa 2026** with a cyber-tropical identity system focused on speed, polish, and social sharing.
