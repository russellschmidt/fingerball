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
**Google OAuth only** (`signInWithOAuth`). We started with email magic links but
Supabase's built-in mailer rate-limited at ~2–4/hr — too low for a login rush at a
reunion — so we switched to Google and removed the email fallback entirely. If you
ever re-add email auth, reliable delivery needs custom SMTP (e.g. Resend + a
verified domain).

After auth, a user with no `members` row is sent to `ClaimName` to pick a unique
display name; that row is what everything else is attributed to.

## Data + realtime
See `supabase/migrations/0001_init.sql` for the schema, RLS, and the
`merge_person(from_id, into_id)` SQL function. RLS: any authenticated user reads
everything; you may only write rows attributed to yourself. `useFeedData()`
(`src/lib/data.ts`) loads everything and subscribes to ALL public table changes,
debounce-refetching on any change — simple and fine at this scale.

## UI / design
Mobile-first "toy sticker / arcade trading card" look — warm cream paper, grain,
hard-offset shadows (`--shadow*` vars; elements `translate` + collapse shadow on
`:active`), tangerine/magenta/lime accents. Fonts: Bricolage Grotesque (display)
+ Hanken Grotesk (body) via Google Fonts link in `index.html`. ALL styling is in
`src/index.css` as plain CSS — no Tailwind/UI lib. Keep new UI consistent with
the existing CSS variables and the `.card`/sticker-shadow conventions.

## Photos
`AddPerson.tsx` offers two pickers: "Camera roll" (plain file input) and "Camera"
(file input + `capture="environment"`), plus a thumbnail preview. On submit it
runs `compressImage()` (`src/lib/image.ts`, canvas-based, zero deps: resize to
1280px + JPEG ~0.82, EXIF-aware, falls back to original) before uploading to the
`people-photos` Supabase bucket.

## Juice (sound/haptics/disco)
`src/lib/fx.ts` = zero-asset Web Audio sound effects + `navigator.vibrate` haptics
(Android only; iOS ignores vibrate). Call fx functions from inside the tap handler
BEFORE any await so iOS resumes the audio context on the gesture. Votes call
fxUp/fxDown/fxUndo; adds call fxSwish. Tapping `FingerBall` toggles `body.disco`
(all disco styling is `body.disco …` rules in `index.css`) and plays fxDisco.

## Gotchas
- Supabase **Auth → URL Configuration** must whitelist the app origin
  (`https://fingerball.netlify.app` + `http://localhost:5173`) or OAuth/magic-link
  redirects fail. OAuth redirect uses `window.location.origin`.
- Google Cloud OAuth client must list
  `https://kacqripfdqjwafpznjcb.supabase.co/auth/v1/callback` as a redirect URI.
- `netlify.toml` SPA fallback is required so deep links don't 404.
- PWA icons are a single `public/icon.svg` (no PNG set) — fine for now.
