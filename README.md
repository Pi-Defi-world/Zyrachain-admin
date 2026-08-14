# Zyrachain Admin

Admin dashboard for the Zyrachain Pi Network ecosystem. A Vite + React + TypeScript
single-page app that talks to the `Zyrachain-server` admin API.

## Features

- **OTP login** — email + role → emailed 6-digit code → JWT (24h), matching the
  server's `/api/admin/auth` flow.
- **Dashboard** — user counts, activity, server health (`/api/admin/analytics`).
- **Users** — browse and search users (`/api/admin/users`).
- **Listings** — approve/reject startup, business, community, and influencer
  listings (`/api/admin/listings`).
- **Communities / Influencers** — combined main + listing sources
  (`/api/admin/communities/combined`, `/api/admin/influencers/combined`).
- **Addresses** — full CRUD on `generated`, `cex`, and `core-team` address
  collections (`/api/admin/addresses/*`).
- **Settings** — server info, signed-in profile, PCT balance scan trigger.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in VITE_API_BASE_URL and defaults
npm run dev                  # http://localhost:5173
```

The server already allows `http://localhost:5173` in its CORS allow-list.

## Environment variables

See `.env.example`. The only required one is `VITE_API_BASE_URL`; everything
else has sensible defaults. Values are baked in at build time (Vite `VITE_*`).

> The admin email must be in the server's whitelist
> (`ALLOWED_ADMIN_EMAILS` in `Zyrachain-server/zyrachain-lib/lib/email-service.ts`).

## Deploying with a custom domain

1. Push this repo to GitHub.
2. In GitHub → repo **Settings → Pages**, set Source to **GitHub Actions**.
3. Add a **custom domain** in Pages settings and create the matching DNS record:
   - `CNAME` → `<username>.github.io` (for `admin.yourdomain.com`), or
   - `A` records → the GitHub Pages IP addresses (for the apex domain).
4. The included workflow builds and deploys automatically on push to `main`.
   Set the **repository variables** it reads:

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Server base URL (e.g. `https://api.zyrachain.app`) | build-time default |
| `VITE_BASE_PATH` | `/` for a custom domain, `/Zyrachain-admin/` otherwise | `/` |
| `VITE_ADMIN_EMAIL` | Pre-filled login email | from `.env` |
| `VITE_ADMIN_ROLE` | Pre-selected login role | `super_admin` |

Alternatively, host anywhere static files work (Vercel, Netlify, Cloudflare Pages)
and set the same `VITE_*` build variables.

## API surface

The client in `src/lib/api.ts` covers the admin routes documented in
`Zyrachain-server/ADMIN_API_GUIDE.md`. Note it intentionally does **not** send an
`X-Client` header — that header is missing from the server's CORS
`allowedHeaders` and would break browser preflights.
