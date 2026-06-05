# Fingerball — context for AI agents

Reunion app: friends log in and score people they meet (happy-to-see-us, opinion
change, facts, superlatives, photo), then vote and merge cards in a live feed.
Built to be cheap, fast, and friend-group scale (~10 users), not production-grade.

## Ground rules
- **Work only inside this directory** (`/Users/rms/Dev/fingerball`). It is its own
  git repo (`origin` = github.com/russellschmidt/fingerball). The parent
  `~/Dev` is a *separate* repo that happens to point at the same remote — ignore it.
- Never commit `.env` (gitignored; holds the Supabase publishable key).

## Stack
Vite + React + TypeScript PWA → Supabase (Postgres/Auth/Storage/Realtime) →
Netlify static hosting. All free tier.

## Commands
```bash
npm run dev        # local dev, http://localhost:5173
npm run build      # production build into dist/
netlify deploy --prod --dir=dist   # ship to https://fingerball.netlify.app
```

## Auth
Primary = **Google OAuth** (`signInWithOAuth`). We started with email magic links
but Supabase's built-in mailer rate-limited at ~2–4/hr — too low for a login rush
at a reunion — so Google became primary. The email magic-link path still exists in
`Login.tsx` as a fallback but shares that rate limit; remove it if all friends use
Google. (Reliable email would need custom SMTP, e.g. Resend + a verified domain.)

After auth, a user with no `members` row is sent to `ClaimName` to pick a unique
display name; that row is what everything else is attributed to.

## Data + realtime
See `supabase/migrations/0001_init.sql` for the schema, RLS, and the
`merge_person(from_id, into_id)` SQL function. RLS: any authenticated user reads
everything; you may only write rows attributed to yourself. `useFeedData()`
(`src/lib/data.ts`) loads everything and subscribes to ALL public table changes,
debounce-refetching on any change — simple and fine at this scale.

## Gotchas
- Supabase **Auth → URL Configuration** must whitelist the app origin
  (`https://fingerball.netlify.app` + `http://localhost:5173`) or OAuth/magic-link
  redirects fail. OAuth redirect uses `window.location.origin`.
- Google Cloud OAuth client must list
  `https://kacqripfdqjwafpznjcb.supabase.co/auth/v1/callback` as a redirect URI.
- `netlify.toml` SPA fallback is required so deep links don't 404.
- PWA icons are a single `public/icon.svg` (no PNG set) — fine for now.
