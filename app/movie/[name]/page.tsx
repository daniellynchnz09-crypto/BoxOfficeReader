import Image from "next/image";
import Link from "next/link";
import { getFilmDetail } from "@/lib/n8n";
import { formatGross, formatReleaseDate } from "@/lib/format";

export default async function MoviePage(props: PageProps<"/movie/[name]">) {
  const { name: encodedName } = await props.params;
  const name = decodeURIComponent(encodedName);

  let film;
  let loadError: string | null = null;

  try {
    film = await getFilmDetail(name);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Something went wrong.";
  }

  if (loadError || !film) {
    return (
      <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson">
          Reel missing
        </p>
        <h1 className="font-display text-3xl text-cream">
          Can&apos;t find that one on the board
        </h1>
        <p className="max-w-md text-sm text-muted">
          {loadError ?? `"${name}" isn't in the current Top 25.`}
        </p>
        <Link
          href="/"
          className="mt-4 font-mono text-xs uppercase tracking-wide text-gold-soft underline decoration-gold/40 underline-offset-4 hover:text-gold"
        >
          ← Back to the board
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-24 pt-14 sm:px-8">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-wide text-muted hover:text-gold-soft"
      >
        ← Back to the board
      </Link>

      <div className="mt-8 flex flex-col gap-8 sm:flex-row">
        {film.poster ? (
          <div className="relative h-72 w-48 shrink-0 overflow-hidden rounded border border-surface-border shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] sm:h-80 sm:w-52">
            <Image
              src={film.poster}
              alt={`${film.name} poster`}
              fill
              sizes="208px"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="flex h-72 w-48 shrink-0 items-center justify-center rounded border border-surface-border bg-surface font-display text-4xl text-muted-dim sm:h-80 sm:w-52">
            {film.name.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {film.rank && (
            <div className="ticket-stub ticket-stub--top mb-4">
              {film.rank}
            </div>
          )}
          <h1 className="font-body text-4xl italic text-cream sm:text-5xl">
            {film.name}
          </h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-wide text-muted-dim">
            {formatReleaseDate(film.releaseDate)}
            {film.country ? ` · ${film.country}` : ""}
          </p>
          {film.director && (
            <p className="mt-1 font-body text-sm text-muted">
              Directed by {film.director}
            </p>
          )}

          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-surface-border pt-5">
            <Stat label="Domestic" value={formatGross(film.domesticGross)} />
            <Stat
              label="International"
              value={formatGross(film.internationalGross)}
            />
            <Stat
              label="Worldwide"
              value={formatGross(film.worldwideGross)}
              accent
            />
          </dl>
        </div>
      </div>

      {film.plot && (
        <p className="mt-10 font-body text-lg leading-relaxed text-cream">
          {film.plot}
        </p>
      )}

      {film.cast && (
        <p className="mt-4 font-mono text-xs uppercase tracking-wide text-muted-dim">
          Starring {film.cast}
        </p>
      )}

      {film.funFact && (
        <p className="mt-8 border-l-2 border-gold/60 pl-4 font-body text-base italic text-muted">
          {film.funFact}
        </p>
      )}

      {film.imdbLink && (
        <a
          href={film.imdbLink}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex w-fit items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-gold-soft underline decoration-gold/40 underline-offset-4 hover:text-gold"
        >
          View on IMDb →
        </a>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-dim">
        {label}
      </dt>
      <dd
        className={`mt-0.5 font-mono text-lg ${accent ? "text-gold-soft" : "text-cream"}`}
      >
        {value}
      </dd>
    </div>
  );
}
