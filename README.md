# Box Office Top 25

A cinematic dashboard for the 25 highest-grossing films of the year — ranked by worldwide gross, refreshed daily. Built with Next.js, backed by an n8n workflow that scrapes Box Office Mojo, cross-references Google Sheets, and enriches each entry with OMDb data and Gemini-generated fun facts.

## Features

- **Top 25 board** — ticket-stub ranked list, click any entry to expand gross breakdown, fun fact, and IMDb link
- **Movie detail pages** (`/movie/[name]`) — plot, director, cast, and full stats for each film
- Dark, marquee-inspired visual design

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Data via two n8n webhooks: a Top 25 list endpoint and a per-film detail endpoint
- n8n workflow: daily scrape → Google Sheets → OMDb + Gemini enrichment → cached in n8n Data Tables

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your n8n webhook URLs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
| --- | --- |
| `N8N_WEBHOOK_URL` | GET endpoint returning the Top 25 list as JSON |
| `N8N_FILM_DETAIL_WEBHOOK_URL` | GET endpoint (`?name=`) returning a single film's detail |
| `N8N_WEBHOOK_SECRET` | Shared secret sent as the `X-Webhook-Secret` header on both requests; must match the `httpHeaderAuth` credential on the n8n webhooks |

Both point at webhooks on the `Box Office Top 25 API` n8n workflow, which reads from the same Google Sheet and n8n Data Tables the daily `Box Office Mojo Top 25 Tracker` workflow maintains.

## Deployment

Deployed on Vercel, connected to this GitHub repo. Set the three environment variables above in the Vercel project settings — pushes to `main` auto-deploy.
