# AVA Fit — Admin Dashboard

Internal analytics dashboard for the AVA Fit prosthetic-socket project. Reads
every tester's data from the shared Supabase project ("Quorum Prosthetic",
`pzwsehbrstvjkqpxwyod`) — the same backend the `ava-fit-ios` app and the
desktop app (`adapt-updated-2026-08-14/adapt`) already sync to.

## Why this exists

Every table in that Supabase project is RLS-scoped to `auth.uid()`, so a
normal login only ever sees its own rows — there was no way to see all
testers' data in one place. This app adds that view: a Next.js server that
holds the Supabase **service role key** (bypasses RLS) and only ever uses it
on the server, plus a small password-gated UI on top.

## Setup

1. `cd admin-dashboard && npm install`
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from the Supabase
     dashboard for the Quorum Prosthetic project: **Project Settings → API →
     service_role key**. This key is secret — never commit it, never put it
     in a `NEXT_PUBLIC_*` variable, never import `lib/supabaseAdmin.ts` from
     a `"use client"` file (the `server-only` import in that file turns any
     accidental client import into a build error).
   - `ADMIN_DASHBOARD_PASSWORD` — the shared password your team uses to sign
     into this dashboard. It's a single team password, not a per-person
     Supabase account, since this is an internal tool.
   - `ADMIN_SESSION_SECRET` — random secret used to sign the login session
     cookie. Generate one with:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. `npm run dev` and open `http://localhost:3000`.

## What it shows

- **Overview** — headline KPI cards (registered testers, active this week,
  patient profiles, sessions, total session time, samples logged) plus
  sessions/signups over time and distribution charts (device split, sensor
  mapping method, grid size).
- **Patients** — every patient profile across every tester, searchable, with
  a detail page listing that patient's full session history.
- **Sessions** — every logging session across every tester, filterable by
  device and date range.
- **Testers** — every registered Supabase Auth account, signup/last-active
  dates, verification status, and their saved app preferences.
- **Analytics** — longer-range trends: 90-day session volume, cumulative
  tester growth, daily logged-sample volume, most active patients/testers.

Data refreshes automatically every 15 seconds (toggle in the top-right of
every page) by re-running the server components — there's no Supabase
Realtime subscription here, deliberately: a realtime channel that can see
every tester's rows would need the service role key in the browser, which
defeats the whole point of keeping it server-only. Polling metadata this
size every 15s is cheap and keeps that boundary intact.

## Known gap: no raw sensor time-series yet

Supabase currently only receives **session metadata** (start/end time,
duration, row count, device) — the actual per-channel pressure/IMU readings
stay local as CSV/JSON on each device (see `ava-fit-ios/src/pressure/
sessionLogger.ts` and the desktop app's session CSV logger). This dashboard
can't show live pressure heatmaps or waveform charts until that changes.

If/when that's wanted: add a `session_readings` (or similar) table, wire the
iOS app's `CloudSyncService.ts` (and optionally the desktop `cloud_sync.py`)
to upload sampled readings per session, and this dashboard has the charting
components (`components/charts/*`) already in place to build on.

## Suggested next additions

- Pressure-injury risk / socket-fit-suggestion analytics, once those
  per-session outputs (see `ml/risk.py`, `ml/geometry.py` in the desktop app)
  are pushed to Supabase alongside session metadata.
- CSV export for the Patients/Sessions tables.
- Per-tester engagement funnel (signed up → first patient → first session →
  repeat session within 7 days) once there's enough volume for it to be
  meaningful.
