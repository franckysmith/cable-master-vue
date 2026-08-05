# CLAUDE.md — Cable-Master (cinodFlightCase)

Guidance for Claude Code when working in this repo. This file is auto-loaded.

## What this app is

**Cable-Master** (aka "Cinod FlyCase") — a cabling/inventory tool for live-sound companies and their technicians. Vue 3 + Vite + Quasar + Pinia, packaged as a **PWA** (mobile-first, portrait).

**Problem it solves:** a sound company never quite knows its cable stock vs. the jobs coming in, and whether it will have everything needed. The app centralises cable & mic lists, lets technicians declare their needs per job, helps the company pre-pack standard cases, and anticipates shortages.

**Core domain & flow:**
- A **company** keeps its own catalogue of **cables** (electrical, speaker, module, special, accessory, digital, **microphone**) and **caisses-types / flight cases** (standard prepped cases). Each cable has type, quantity (`total`), `reserved`, lengths, colour, brand.
- When an **affair** (a job/gig) comes up, the employer (**master**) assigns **technicians** to zones — **front (façade), monitor (retours), stage (scène)** — each zone may have one or more people. The master sends a link; techs open the company's cable list and enter their needs per zone (e.g. 4 here, 5 there). Needs must be easy to spot.
- Per affair, the tech builds a precise cable list (organised in **sections**: façade, subs, frontfills, exterieurs), with a **spare** column (extra cables for longer runs / contingencies), then arranges cables into **fly cases** (case droite/gauche/régie/régie retour). Printable → checklist sheet on the case. On arrival the case is ready; the tech verifies and tops up.
- Recurring affairs can be **re-imported** to reuse what worked (and see what was refused/removed/changed) → the company anticipates.
- **Mic management:** techs supply/curate a mic list; a place to tick/organise which mics are available on a given day, so the company can adjust and cover shortages.
- Monetisation idea: company pays for the service; free tier or one-off purchase for technicians; a tech can keep their own personal cable/mic list and send requests.

## Routes (src/router.js)

| Route | View | Role |
|---|---|---|
| `/` | **Cabletech** | Technician working ON an affair — the per-affair cable grid. **Empty until an affair is created/selected** (gated by `selectedAffair`). |
| `/CableList` | CableList | The company cable catalogue (browse/edit the cables). |
| `/MasterAffaire` | MasterAffaire | Employer: create affairs, assign technicians, send links. |
| `/FlightType` | FlightType | Caisses-types / flight cases. |
| `/micros` | MicLibrary | Mic library (shared library = catalog 2; "my list" = catalog 1). |
| `/company` | CompanySetup | Company + its catalogue + technicians. |
| `/share/:token` | ShareView | Read-only shared link (mailed to tech/master). |
| `/settings`, `/about` | — | — |

Role is in `localStorage['cablemaster-role']` (`'technician'` default | `'master'`). Active catalogue = `localStorage['cablemaster-catalogid']` (defaults to **1**). Company = `cablemaster-companyid` / `cablemaster-company`.

## Backend — IMPORTANT (migrated 2026-06-21)

This app's backend was **moved to the shared Cinod Supabase hub** and now lives in a dedicated Postgres schema, NOT in its own project.

- **Project:** `cinodLacoustics-v2` (ref `ahwixyrtqebukxlpxiwi`, eu-west-3) — the shared hub. (L-Acoustics uses its `public` schema; Cable-Master uses `mastercable`.)
- **Schema:** `mastercable`. Configured in `src/lib/supabase.js` via `createClient(url, key, { db: { schema: 'mastercable' } })`. Credentials in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- The old dedicated project `sbsygqfhszhcocdnuonp` is **empty and deprecated** — do not use it.
- **Exposed-schema caveat:** `mastercable` is exposed to PostgREST via `ALTER ROLE authenticator SET pgrst.db_schemas='public, graphql_public, mastercable'`. If the hub's dashboard API settings are ever edited this may reset — keep `mastercable` listed under Dashboard → Settings → API → Exposed schemas.

**11 tables in `mastercable`:** catalog, cable, affair, "order", mfc, cablemfc, company, technician, message, share, user_settings. RLS = permissive public policies (app uses the anon key, no per-user auth). FKs: order→cable/affair, cablemfc→cable/mfc, technician→company, message→affair, cable/affair/company→catalog.
**2 Storage buckets:** `documents` (affair attachments), `microphones` (mic PDFs/images).
**Catalogue convention:** id **1** = "Catalogue principal" (default working catalogue, department `sound`), id **2** = "Bibliothèque Micros" (`LIB_CATALOG_ID = 2`), id **12** = standard Lumière, id **13** = standard Vidéo. The per-department standard catalogues are the templates copied at sign-up — see `STANDARD_CATALOG_IDS` in `src/lib/provisioning.js`. **Lumière and Vidéo are still empty**: a freelance/company signing up for those departments gets an empty (but correctly typed) catalogue until their content is written.
**Seeded:** 102 cables in catalogue 1, 22 mics in catalogue 2. No companies/affairs/technicians yet — those are created through the app.

## Offline sync

The app queues failed writes in `localStorage['cm-sync-queue']` and replays them when back online (`src/lib/syncService.js`). **Fix applied 2026-06-21:** permanent server rejections (4xx: PG codes 22xxx/23xxx/42xxx, or PGRST*) are now **dropped** instead of re-queued — only genuine network errors are retried. This stopped an infinite 409 (FK-violation) retry loop from a poisoned queue. If you see stale queued ops, clear with `localStorage.removeItem('cm-sync-queue')`.

## Dev

```bash
npm run dev      # vite dev server on :5173 (host 0.0.0.0 → reachable on LAN for phone testing)
npm run build    # production build (vite + PWA)
```

PWA: `vite-plugin-pwa` (autoUpdate, runtimeCaching NetworkFirst on /rest/v1/, CacheFirst on /storage/). When repointing backends or debugging stale data, clear the service worker + caches + localStorage (DevTools → Application → Clear site data).

## Part of the Cinod ecosystem

Sibling apps share themes (L-Acoustics speakers/amps, etc.): `cinodLacoustics`, `cinodSoundvision`, `cinodFlightCase`, plus shared assets in `cinod-shared`. See `cinod-shared/CLAUDE.md` for the cross-app picture and the shared Supabase hub.
