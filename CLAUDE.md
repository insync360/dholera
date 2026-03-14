# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GAP Visualizer — a real estate/land parcel visualization platform for Dholera Smart City. Interactive map-based UI for browsing parcels (public) and managing them (admin). Built with React 18 + TypeScript + Vite, backed by Supabase.

The actual source code lives in `dholera/` subdirectory (not the repo root).

## Commands

All commands run from `dholera/` directory:

```bash
cd dholera
npm i              # Install dependencies
npm run dev        # Dev server on http://localhost:3000
npm run build      # Production build to dholera/build/
```

There are no test or lint scripts configured.

## Architecture

### View System (No Router)

No React Router. `App.tsx` manages all views via state:
- `view: 'public' | 'login' | 'admin'` — top-level view switching
- `adminView: 'dashboard' | 'upload' | 'editor' | 'history' | 'settings'` — admin sub-views

All app state (parcels, filters, user, etc.) lives in `App.tsx` and is passed down as props.

### Dual Map Modes

- **Full mode**: `MapVisualizer.tsx` — Google Maps API with hybrid view, drawing tools
- **Demo mode**: `DemoMapVisualizer.tsx` — SVG-based fallback when no Google Maps API key is set

Auto-switches to demo mode if `VITE_GOOGLE_MAPS_API_KEY` is missing.

### API Layer (`src/lib/api.ts`)

All backend calls go through four API objects that wrap Supabase client calls:
- `parcelApi` — CRUD + search for parcels
- `uploadApi` — KML/KMZ file upload (calls Supabase Edge Function at `/functions/v1/upload-kml`)
- `versionApi` — version history
- `authApi` — login/logout/getCurrentUser via Supabase Auth

Custom `ApiError` class with status codes. Toast notifications for user feedback.

### Key Source Paths

```
dholera/src/
├── App.tsx                    # Central state hub, view routing
├── lib/
│   ├── api.ts                 # Supabase API service layer
│   ├── supabase.ts            # Supabase client init
│   ├── types.ts               # Core TypeScript interfaces (Parcel, User, FilterOptions, etc.)
│   └── constants.ts           # Map center (22.2492, 72.1793), zoom, filter defaults
├── components/
│   ├── public/                # Public-facing: map, top bar, filters, parcel detail
│   ├── admin/                 # Admin panel: dashboard, KML upload, parcel editor, version history
│   ├── auth/                  # LoginScreen
│   └── ui/                    # Shadcn/ui component library (Radix UI primitives + CVA)
```

### Supabase Backend

- **Tables**: `parcels`, `user_profiles`, `data_versions`, `upload_history`
- **Auth**: Email/password via Supabase Auth; roles (Admin/Editor/Viewer) stored in `user_profiles`
- **RLS**: Public read on parcels, authenticated write
- **Region**: ap-south-1 (Mumbai)

### Environment Variables

Defined in `dholera/.env` (see `.env.example` for template):
- `VITE_GOOGLE_MAPS_API_KEY` — Google Maps API key (optional; demo mode if missing)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key

### Styling

Tailwind CSS v4 + Shadcn/ui components. Path alias `@/*` maps to `./src/*`. Responsive breakpoint at 768px (`isMobile` state in App.tsx) switches between panel/modal layouts.

### Deployment

Vercel — configured via `vercel.json` with SPA rewrites. Build output: `build/`.
