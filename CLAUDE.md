@AGENTS.md

# Box Office Top 25

Next.js frontend for an n8n-powered box office tracker. See [README.md](README.md) for stack/setup.

## Architecture

- **`Box Office Mojo Top 25 Tracker`** (n8n, scheduled daily 7am) — scrapes Box Office Mojo, cross-references the `box office test` Google Sheet, enriches new entrants via OMDb + Gemini, caches static per-film data (poster, fun fact, plot, director, cast) in two n8n Data Tables (`box_office_film_cache`, `box_office_film_details`), and updates a Google Slides deck. This is the expensive, heavy workflow — never call it from the frontend.
- **`Box Office Top 25 API`** (n8n, on-demand webhooks) — the frontend's actual data source. Two GET endpoints:
  - `/webhook/box-office-top25` — the full ranked list (reads Sheet1 + cache table only, fast)
  - `/webhook/box-office-film?name=<film name>` — single film detail (reads Sheet1 + both cache tables)

The frontend never triggers the daily scraper directly — it only reads already-computed data via the API workflow, which is why list loads are fast (~3s) despite the daily workflow being slow (scraping + OMDb + AI + Slides).

## Known issue: weekly trends deferred

A `Sheet2` in the same Google Sheet holds a computed weekly gross trajectory per film (used for the Slides chart). A large one-time row cleanup (trimmed ~19k blank rows down to 100) left Google's read replicas inconsistent for a while — some `Read Sheet2` calls return in seconds, others take minutes. The weekly-trend UI (`components/Sparkline.tsx`, `lib/chart.ts`) is built and wired to accept `weeks`/`weeklyGross` on `Film`, but the API workflow's `Read Sheet2` step is currently **not** wired in (removed from `Build Top 25` in the `Box Office Top 25 API` workflow) to keep the main endpoint reliably fast. Before re-enabling: verify `Read Sheet2` responds in a few seconds consistently (test via n8n directly, not just once), then re-add it to the `Read Cache → Build Top 25` chain and restore `weeklyGross`/`weeks` in `Build Top 25`'s code (see git history for the exact code).

## Conventions

- Never commit secrets or webhook URLs with auth tokens — use `.env.local` locally and Vercel's env var settings in production.
- Prefer editing the n8n workflows via the n8n-mcp MCP server over asking the user to do it manually in the n8n UI.
- When editing n8n workflows via `n8n_update_partial_workflow`, pass `operations` as its own top-level parameter (not nested inside a wrapper object) — large combined operation arrays have intermittently failed to parse when constructed as one big embedded JSON blob.

## TODO — next session

### Performance: movie detail page is slow

Two real, verified causes (checked directly against the n8n instance on Aug 14 — the cache table itself is fine, only 27 rows, not a bloat issue):

1. **Serial reads instead of parallel.** The `Get Film Detail` webhook branch in the `Box Office Top 25 API` workflow reads `Read Sheet1 Detail` → `Read Cache Detail` → `Read Film Details Detail` in series (each wired as the next one's input), so their round-trips stack instead of overlapping. Rewire so all three read nodes branch directly off `Get Film Detail` in parallel, merge (e.g. a Merge node or just let `Build Detail` reference all three via `$('NodeName')` once they've all executed), then feed `Build Detail`.
2. **No caching at all.** Both `getTop25()` and `getFilmDetail()` in `lib/n8n.ts` use `fetch(url, { cache: "no-store" })`, so every single page view/click is a fully fresh n8n round-trip — even though the underlying data only changes once a day (the 7am scheduled run). Switch both to a short revalidation window instead, e.g. `next: { revalidate: 300 } }`, so repeat visits within the window are served from Vercel's cache instantly.

### Design / UX backlog

1. Add a sliding/animated transition for the expand-collapse of each FilmCard (currently an instant show/hide of the expanded panel — no transition at all).
2. Remove the yellow/gold glow (`.ticket-stub--top` in `app/globals.css`) from the #1 ranked film; replace it with a crown treatment instead.
3. Repurpose that yellow/gold glow to highlight a card's **title** when the card is clicked open/expanded (currently unused for this — glow is only tied to rank #1 today).
4. Weekly box-office-per-week numbers on the movie detail page (`app/movie/[name]/page.tsx`), sourced from Sheet2 of the "box office test" spreadsheet — this is the same underlying feature as "Known issue: weekly trends deferred" above; implement together once Sheet2 reads are reliably fast.
5. A chart on the homepage (`app/page.tsx`) showing all 25 entries' trajectories together, similar to the multi-line chart already generated from Sheet2 for the Google Slides deck.
6. A line graph on each movie detail page visualizing that single film's week-by-week trajectory, sourced from Sheet2 of the "box office test" spreadsheet (same source as item 4, just rendered as a graph instead of raw numbers — the user confirmed this after an initial "sheet 3" mention was a slip).
7. Give the page background a more distinct/pronounced gradient (currently a subtle radial gold-tinted gradient in `app/globals.css`).
8. Give each movie detail page a background: that film's poster stretched full-bleed, heavily blurred and darkened, so it reads as an ambient gradient rather than a recognizable image — not a literal poster background.
9. Add a link (e.g. in the homepage footer) to the "box office test" Google Sheet and its companion Google Slides deck, both opened in view-only mode.
