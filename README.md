# MN State Fair Group Planner

A progressive web app for planning group outings to the Minnesota State Fair. Drop pins on the fairgrounds map, filter by type and author, and view a chronological schedule of time-sensitive events.

## Tech Stack

- **React 18** + **Vite**
- **MUI v5** (Material UI)
- **Supabase** (Auth, Postgres, Realtime)
- **HTML Canvas** for the interactive map
- **PWA** with Workbox (offline support)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Go to [supabase.com](https://supabase.com) and open your project.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Fill in your project URL and anon key from **Project Settings > API**.

### 3. Run the database schema

In your Supabase project, open the **SQL Editor** and run the contents of:

```
supabase/schema.sql
```

This creates all tables, RLS policies, and RPC functions.

### 4. Generate PWA icons (optional, recommended for production)

The app references `public/icons/icon-192.png` and `public/icons/icon-512.png`.
Use [pwa-asset-generator](https://github.com/elegantapp/pwa-asset-generator) or [Favicon.io](https://favicon.io) to convert `public/icons/icon.svg` to the required PNG sizes and place them in `public/icons/`.

### 5. Start the dev server

```bash
npm run dev
```

### 6. Build for production

```bash
npm run build
```

---

## Deployment (AWS: S3 + CloudFront via Terraform)

Hosting is S3 + CloudFront on a custom domain, provisioned with Terraform
and deployed automatically by GitHub Actions on push to `main`. See
[`infra/README.md`](infra/README.md) for one-time setup (state backend
bootstrap, `terraform apply`, GitHub secrets/variables) and
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) for the
deploy pipeline. There is no backend compute yet — the app talks to
Supabase directly from the browser; see
[`lambdas/README.md`](lambdas/README.md) for the planned path to adding
one.

The PWA service worker and manifest are automatically included in the production build.

---

## Features

- **Interactive fairgrounds map** — pan and zoom with mouse or touch/pinch
- **5 pin types** — Food, Music, Activity, Show, Exhibit — each with a distinct icon and color
- **Time-constrained pins** — shows and music pins require scheduled start/end times; marked with a clock badge
- **Author badges** — colored dot on each pin indicating who added it
- **Filters** — by pin type, by group member, and by time window
- **Schedule view** — chronological list of all time-sensitive pins, grouped by day, with live "NOW" indicator
- **Real-time sync** — all group members see pin changes instantly via Supabase Realtime
- **Offline support** — cached map and last-loaded pins available when connectivity is lost
- **Group privacy** — each group is password-protected; members must enter the password to join

---

## Map Image

The fairgrounds map (`MN_STATE_FAIR.svg`) must be placed in the `public/` directory.
It is already copied there from the project root during initial setup.
