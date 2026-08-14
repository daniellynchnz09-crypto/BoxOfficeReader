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
