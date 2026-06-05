# 🏀 Fingerball

A tiny mobile web app for scoring the people you meet at a reunion. Log in, add
people you run into, rate whether they're happy to see you, how their opinion of
you has shifted, drop interesting facts and superlatives — then vote and merge
with friends in a live feed. Topped with a finger that has a steel rod surgically
implanted in it and a ball on the end, spinning in an endless loop.

**Live:** https://fingerball.netlify.app

## Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript (PWA via `vite-plugin-pwa`) |
| Backend | [Supabase](https://supabase.com) — Postgres + Auth + Storage + Realtime |
| Auth | Google OAuth (one-tap); email magic-link as a fallback |
| Hosting | Netlify (static) |

Everything runs on free tiers — $0 to operate.

## Design

Mobile-first "toy sticker / arcade trading card" aesthetic: warm cream paper with
a tangerine glow and fine grain, near-black ink, **hard-offset shadows** (cards
and buttons physically depress on tap), and a tangerine/magenta/lime palette.
Type is **Bricolage Grotesque** (display) + **Hanken Grotesk** (body), loaded from
Google Fonts in `index.html`. All styling lives in `src/index.css` (plain CSS,
CSS variables, safe-area insets, staggered load animations) — no UI framework.

## Local development

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + key
npm run dev            # http://localhost:5173
```

### Environment variables (`.env`)

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_KEY=sb_publishable_...   # the browser-safe publishable/anon key
```

These are baked in at build time. The publishable/anon key is safe to expose in
the browser — access is governed by Postgres Row Level Security (see the
migration).

## Supabase setup (one-time)

1. **Schema:** run `supabase/migrations/0001_init.sql` in the Supabase SQL Editor.
   Creates all tables, the `merge_person` function, RLS policies, Realtime, and
   the `people-photos` storage bucket.
2. **Auth → URL Configuration:**
   - Site URL: `https://fingerball.netlify.app`
   - Redirect URLs: `https://fingerball.netlify.app`, `http://localhost:5173`
3. **Auth → Providers → Google:** enable, paste the OAuth Client ID + Secret.
   In Google Cloud, the OAuth client must list
   `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized
   redirect URI, and the OAuth consent screen should be **published** so any
   friend can sign in.

## Deploy

Built and shipped to Netlify via CLI:

```bash
npm run build
netlify deploy --prod --dir=dist
```

The repo is linked to the Netlify site `fingerball` (see `.netlify/`, gitignored).
`netlify.toml` provides the SPA fallback so deep links (`/person/:id`, `/add`)
resolve to `index.html`.

## Data model

- **members** — one row per logged-in user (`id` = auth uid), unique `display_name`.
- **people** — a scored person: name, optional photo, `happy_to_see_us` (1–3),
  `opinion_change` (1–3), facts, `merged_into` (set when merged away).
- **superlatives** — free-text superlatives attached to a person.
- **votes** — one ±1 vote per (person, member); score = sum.
- **events** — append-only activity log powering the realtime feed.

Duplicate people are kept separate on add; any member can merge two cards via the
`merge_person(from_id, into_id)` SQL function, which re-points votes/superlatives/
events onto the canonical card.

## Project layout

```
src/
  auth.tsx            Auth context (session + member row)
  index.css           Full design system (cream/sticker theme)
  lib/
    supabase.ts       Supabase client
    types.ts          Shared types + emoji scales
    data.ts           useFeedData() hook + realtime subscription
    image.ts          Client-side image compression (canvas, no deps)
  components/
    FingerBall.tsx    The spinning finger/rod/ball (SVG + CSS)
    Login.tsx         Google sign-in + email fallback
    ClaimName.tsx     First-login unique display-name claim
    Feed.tsx          Activity ticker + people cards + voting
    AddPerson.tsx     New-person form (camera-roll photo, emoji scales, superlatives)
    PersonDetail.tsx  Full card, suggest superlative, merge
supabase/migrations/
  0001_init.sql       Schema, RLS, functions, storage, realtime
```

## Photos

The photo picker uses a plain `<input type="file" accept="image/*">` (no `capture`
attribute) so phones offer the full native sheet including the camera roll. On
submit, `compressImage()` (`src/lib/image.ts`) resizes to max 1280px and
re-encodes as JPEG (~0.82 quality) before uploading to the Supabase
`people-photos` bucket — turning multi-MB phone photos into a few hundred KB.
