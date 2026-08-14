"use client";

import { useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Film } from "@/lib/n8n";
import { formatGross, formatReleaseDate } from "@/lib/format";
import { Sparkline } from "./Sparkline";

export function FilmCard({
  film,
  weeks,
  topGross,
}: {
  film: Film;
  weeks: number[];
  topGross: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => setExpanded((v) => !v);
  const onRowKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <li className="film-row overflow-hidden rounded-md border border-surface-border bg-surface/60">
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={onRowKeyDown}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center gap-4 p-3 text-left sm:gap-5 sm:p-4"
      >
        <div className={`ticket-stub ${film.rank === 1 ? "ticket-stub--top" : ""}`}>
          {film.rank}
        </div>

        {film.poster ? (
          <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded border border-surface-border sm:h-20 sm:w-14">
            <Image
              src={film.poster}
              alt={`${film.name} poster`}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        ) : (
          <PosterFallback name={film.name} className="h-16 w-11 sm:h-20 sm:w-14" />
        )}

        <div className="min-w-0 flex-1">
          <Link
            href={`/movie/${encodeURIComponent(film.name)}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate font-body text-base text-cream underline-offset-4 hover:text-gold-soft hover:underline sm:text-lg"
          >
            {film.name}
          </Link>
          <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-dim">
            {formatReleaseDate(film.releaseDate)}
            {film.country ? ` · ${film.country}` : ""}
          </p>

          <div className="mt-2 flex items-center gap-3">
            <div className="gross-meter w-full max-w-40">
              <span
                style={{
                  width: `${Math.max(4, (film.worldwideGross / topGross) * 100)}%`,
                }}
              />
            </div>
            <span className="shrink-0 font-mono text-xs text-cream">
              {formatGross(film.worldwideGross)}
            </span>
          </div>
        </div>

        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-muted-dim transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            d="M5 8l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {expanded && (
        <div className="border-t border-surface-border p-4 sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            {film.poster ? (
              <div className="relative h-44 w-28 shrink-0 overflow-hidden rounded border border-surface-border sm:h-52 sm:w-36">
                <Image
                  src={film.poster}
                  alt={`${film.name} poster`}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              </div>
            ) : (
              <PosterFallback name={film.name} className="h-44 w-28 sm:h-52 sm:w-36" />
            )}

            <div className="min-w-0 flex-1">
              <dl className="grid grid-cols-3 gap-4">
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

              {film.funFact && (
                <p className="mt-5 border-l-2 border-gold/60 pl-3 font-body text-sm italic text-muted">
                  {film.funFact}
                </p>
              )}

              <div className="mt-5">
                <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-wide text-muted-dim">
                  Cumulative gross by week in theatres
                </p>
                <Sparkline weeks={weeks} values={film.weeklyGross} />
              </div>

              {film.imdbLink && (
                <a
                  href={film.imdbLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex w-fit items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-gold-soft underline decoration-gold/40 underline-offset-4 hover:text-gold"
                >
                  View on IMDb →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
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

function PosterFallback({
  name,
  className,
}: {
  name: string;
  className: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded border border-surface-border bg-surface font-display text-2xl text-muted-dim ${className}`}
    >
      {name.charAt(0)}
    </div>
  );
}
