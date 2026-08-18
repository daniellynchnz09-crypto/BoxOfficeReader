@AGENTS.md

# Box Office Top 25

Next.js frontend for an n8n-powered box office tracker. See [README.md](README.md) for stack/setup.

## Architecture

- **`Box Office Mojo Top 25 Tracker`** (n8n, scheduled daily 7am) — scrapes Box Office Mojo, cross-references the `box office test` Google Sheet, enriches new entrants via OMDb + Gemini, caches static per-film data (poster, fun fact, plot, director, cast) in two n8n Data Tables (`box_office_film_cache`, `box_office_film_details`), and updates a Google Slides deck. This is the expensive, heavy workflow — never call it from the frontend.
- **`Box Office Top 25 API`** (n8n, on-demand webhooks) — the frontend's actual data source. Two GET endpoints:
  - `/webhook/box-office-top25` — the full ranked list (reads Sheet1 + cache table only, fast)
  - `/webhook/box-office-film?name=<film name>` — single film detail (reads Sheet1 + both cache tables)

The frontend never triggers the daily scraper directly — it only reads already-computed data via the API workflow, which is why list loads are fast (~3s) despite the daily workflow being slow (scraping + OMDb + AI + Slides).

Both `Box Office Top 25 API` webhooks require an `X-Webhook-Secret` header (n8n `httpHeaderAuth` credential "Box Office API Webhook Secret"); `lib/n8n.ts` sends it from `N8N_WEBHOOK_SECRET`. Both endpoints also return a generic `{ error, message }` JSON body with a 500 status on any read failure (Google Sheets/Data Table errors are handled via `onError: continueErrorOutput` fanning into a shared "Build Error Response" → "Respond Error" pair per branch) instead of leaking n8n's default error page.

## Known issue: weekly trends deferred

A `Sheet2` in the same Google Sheet holds a computed weekly gross trajectory per film (used for the Slides chart). A large one-time row cleanup (trimmed ~19k blank rows down to 100) left Google's read replicas inconsistent for a while — some `Read Sheet2` calls return in seconds, others take minutes. The weekly-trend UI (`components/Sparkline.tsx`, `lib/chart.ts`) is built and wired to accept `weeks`/`weeklyGross` on `Film`, but the API workflow's `Read Sheet2` step is currently **not** wired in (removed from `Build Top 25` in the `Box Office Top 25 API` workflow) to keep the main endpoint reliably fast. Before re-enabling: verify `Read Sheet2` responds in a few seconds consistently (test via n8n directly, not just once), then re-add it to the `Read Cache → Build Top 25` chain and restore `weeklyGross`/`weeks` in `Build Top 25`'s code (see git history for the exact code).

## Conventions

- Never commit secrets or webhook URLs with auth tokens — use `.env.local` locally and Vercel's env var settings in production.
- Prefer editing the n8n workflows via the n8n-mcp MCP server over asking the user to do it manually in the n8n UI.
- When editing n8n workflows via `n8n_update_partial_workflow`, pass `operations` as its own top-level parameter (not nested inside a wrapper object) — large combined operation arrays have intermittently failed to parse when constructed as one big embedded JSON blob.
- This local folder is **not** a git repository (no `.git`, and `git` isn't installed on this machine), but Vercel deploys from the connected GitHub repo `daniellynchnz09-crypto/BoxOfficeReader` (`main` branch) whenever it changes. Local file edits do nothing for the deployed site on their own. **After making any code change here, push the changed files to that repo via the GitHub MCP server** (it works over the API, no local git needed) — otherwise Vercel keeps serving stale code, which has already caused a real outage (see the 403/webhook-auth incident in git history — the fix was written locally but never deployed for days). Never push `.env.local` itself.
- Exception to the above: edits to `CLAUDE.md` itself don't need to be pushed to GitHub right away. It doesn't affect the deployed site (Vercel builds the app, not this file), so it's fine for it to only exist locally for a while and go out later, batched with the next real code push.

## TODO — next session

### Bugs / requests — Aug 17 follow-up

1. **White fade on the "Obsession" poster on mobile — still open, needs a real device/emulator.** Downloaded and viewed the raw poster file directly (the OMDb-sourced JPEG for "Obsession") — it's clean, a normal dark movie poster with no white gradient or watermark baked in. That rules out "bad source image" as the cause. Remaining candidate: a loading-state artifact on mobile (e.g. a slow/broken load on mobile network conditions briefly showing a blank/white image box before the poster paints, or an `next/image` responsive-size variant behaving differently on a narrow viewport). Still needs a real mobile device or emulator with the Network tab open to pin down — no such tool was available this session.

### Resolved this session (verify visually next time you're on a build)

- Homepage background gradient "breaking" every ~7 titles, and disappearing on mobile: both traced to the same cause — `body` in `app/globals.css` never set `background-repeat: no-repeat`, so the two `radial-gradient(...)` layers tiled down the page by default instead of rendering as one smooth gradient. Fixed by adding `background-repeat: no-repeat;` and `background-attachment: fixed;` to the `body` rule (the latter also anchors the gradient's percentage sizing to the viewport instead of the ever-growing page height, which is what made it shrink to invisible on mobile's much taller relative scroll).
- Expand-glow moved from the film title to the rank number: `components/FilmCard.tsx`'s `<Link>` no longer gets a glow class; the `.ticket-stub` wrapper does instead (via the renamed `.rank-glow` class in `app/globals.css`, was `.title-glow`).
- Movie detail page load times: raised `getFilmDetail()`'s fetch `revalidate` from 300s to `21600` (6h) in `lib/n8n.ts`. This part is live and safe.
  - **Reverted: `generateStaticParams()` on `app/movie/[name]/page.tsx` broke every detail page in production and has been removed.** What happened: it returned `encodeURIComponent(film.name)` (e.g. `Spider-Man%3A%20Brand%20New%20Day`) because returning the raw name crashed the local Windows build (`:` isn't legal in a Windows path, and `next build` writes a real directory per prerendered route). But Next.js encodes the param value *again* when building the actual served route, so real visits — which arrive already singly-encoded via the homepage's `Link href` — got matched to a doubly-encoded prerendered page. `decodeURIComponent()` only unwraps one layer, so `name` stayed literally as `Spider-Man%3A%20Brand%20New%20Day`, matched no film, and every detail page showed "isn't in the current Top 25." Confirmed and fixed by removing `generateStaticParams()` and the page-level `revalidate` export entirely; the route is back to `ƒ` fully-dynamic per-request rendering, still benefiting from the 6h fetch-level cache above.
  - If someone wants to re-attempt full prerendering later: `generateStaticParams()` needs to return the **raw, unencoded** film name (the Next.js-standard convention — Next handles the URL encoding itself). That's correct for Vercel's Linux build servers (colons are legal in Linux filenames) but **cannot be verified with `npm run build` on this Windows dev machine** for any title containing a colon (there's currently at least one, "Spider-Man: Brand New Day") — it will crash locally with an `ENOENT`/`mkdir` error even though it would build fine on Vercel. Test it by watching the actual Vercel build log after pushing, not by trusting a local Windows build to catch a problem it structurally can't reproduce.
- Movie detail page background darkness: user asked for a 30% reduction as a first pass, to assess and iterate from there. Applied a uniform 30% relative reduction to the dark overlay gradient's opacity stops in `app/movie/[name]/page.tsx` (`from-bg/60 via-bg/80 to-bg` → `from-bg/42 via-bg/56 to-bg/70`); the poster `<Image>`'s own `opacity-35` was left untouched since the user's instruction was one single lever, not two. Net visible-poster math with the new values (poster opacity still 35%): ~20% visible at the top (was ~14%), ~15% at the middle (was ~7%), ~11% at the bottom (was 0% — previously the bottom stop was fully opaque `to-bg`, hiding the poster completely; now it stays faintly visible even there). **Waiting on user feedback** — if they want it lighter/darker still, adjust these same three `from/via/to` percentages (and/or `opacity-35` on the `<Image>` if the poster itself should also brighten).

### Design / UX backlog — blocked on Sheet2

Everything below is deferred along with "Known issue: weekly trends deferred" above, and for the same reason (Sheet2 read-replica lag needs to be confirmed fixed first):

1. Weekly box-office-per-week numbers on the movie detail page (`app/movie/[name]/page.tsx`), sourced from Sheet2 of the "box office test" spreadsheet.
2. A chart on the homepage (`app/page.tsx`) showing all 25 entries' trajectories together, similar to the multi-line chart already generated from Sheet2 for the Google Slides deck.
3. A line graph on each movie detail page visualizing that single film's week-by-week trajectory, sourced from Sheet2 (same source as item 1, just rendered as a graph instead of raw numbers).
