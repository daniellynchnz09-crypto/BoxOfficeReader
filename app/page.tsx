import { getTop25 } from "@/lib/n8n";
import { FilmCard } from "@/components/FilmCard";

export default async function Home() {
  let data;
  let loadError: string | null = null;

  try {
    data = await getTop25();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Something went wrong.";
  }

  if (loadError || !data || data.films.length === 0) {
    return (
      <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson">
          House lights up
        </p>
        <h1 className="font-display text-3xl text-cream">
          The board is dark right now
        </h1>
        <p className="max-w-md text-sm text-muted">
          {loadError ?? "No films are tracked yet."} Check back after the
          next daily refresh, or confirm the tracker workflow is running in
          n8n.
        </p>
      </main>
    );
  }

  const { films, weeks, generatedAt } = data;
  const topGross = films[0]?.worldwideGross || 1;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-24 pt-14 sm:px-8">
      <header className="mb-14">
        <div className="bulb-strip mb-6">
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 90}ms` }} />
          ))}
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold">
          International box office numbers 2026
        </p>
        <h1 className="mt-3 font-display text-6xl uppercase leading-[0.95] text-cream sm:text-7xl">
          Top 25
        </h1>
        <p className="mt-4 max-w-lg font-body text-[0.95rem] text-muted">
          The 25 highest-grossing films of the year, ranked by worldwide
          gross and refreshed every morning. Tap any entry for the full
          breakdown.
        </p>
        <p className="mt-2 font-mono text-xs text-muted-dim">
          Board last updated{" "}
          {new Date(generatedAt).toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      </header>

      <ol className="flex flex-col gap-2.5">
        {films.map((film, i) => (
          <div
            key={film.name}
            className="film-row"
            style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
          >
            <FilmCard film={film} weeks={weeks} topGross={topGross} />
          </div>
        ))}
      </ol>

      <footer className="mt-16 border-t border-surface-border pt-6 text-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-dim">
          Scraped from Box Office Mojo · enriched with OMDb &amp; Gemini ·
          rebuilt every morning by an n8n workflow
        </p>
      </footer>
    </main>
  );
}
