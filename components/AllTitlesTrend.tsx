"use client";

import { useState } from "react";
import type { Film } from "@/lib/n8n";
import { CHART_PALETTE, niceTicks, pickTickIndices } from "@/lib/chart";
import { formatGross } from "@/lib/format";

const WIDTH = 960;
const HEIGHT = 440;
const PADDING = { top: 16, right: 16, bottom: 32, left: 68 };

function formatAxisGross(value: number): string {
  return value === 0 ? "$0" : formatGross(value);
}

interface Series {
  name: string;
  color: string;
  points: { week: number; value: number }[];
}

export function AllTitlesTrend({
  films,
  weeks,
}: {
  films: Film[];
  weeks: number[];
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const series: Series[] = films
    .map((film, i) => ({
      name: film.name,
      color: CHART_PALETTE[i % CHART_PALETTE.length],
      points: weeks
        .map((week, wi) => ({ week, value: film.weeklyGross[wi] }))
        .filter((p): p is { week: number; value: number } => p.value != null),
    }))
    .filter((s) => s.points.length >= 2);

  const hasData = series.length > 0 && weeks.length > 0;

  return (
    <div className="mt-14 overflow-hidden rounded-md border border-surface-border bg-surface/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
            All 25, one chart
          </p>
          <p className="mt-1 font-body text-lg text-cream">
            Compare every title&apos;s weekly trajectory
          </p>
        </div>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-muted-dim transition-transform ${open ? "rotate-180" : ""}`}
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
      </button>

      <div className={`expand-panel ${open ? "is-open" : ""}`}>
        <div>
          <div className="border-t border-surface-border p-4 sm:p-6">
            {!hasData ? (
              <p className="font-mono text-xs text-muted-dim">
                Not enough weekly data tracked yet to compare trajectories.
              </p>
            ) : (
              <TrendMultiChart
                series={series}
                weeks={weeks}
                active={active}
                onToggle={(name) =>
                  setActive((cur) => (cur === name ? null : name))
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendMultiChart({
  series,
  weeks,
  active,
  onToggle,
}: {
  series: Series[];
  weeks: number[];
  active: string | null;
  onToggle: (name: string) => void;
}) {
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const minWeek = weeks[0];
  const maxWeek = weeks[weeks.length - 1];
  const weekSpan = Math.max(1, maxWeek - minWeek);

  const maxValue = Math.max(
    ...series.flatMap((s) => s.points.map((p) => p.value)),
  );
  const yTicks = niceTicks(maxValue, 5);
  const scaleMax = yTicks[yTicks.length - 1] || 1;

  const xForWeek = (week: number) =>
    PADDING.left + ((week - minWeek) / weekSpan) * plotW;
  const yForValue = (value: number) =>
    PADDING.top + plotH - (value / scaleMax) * plotH;

  const xTickWeeks = pickTickIndices(weeks.length, 10).map((i) => weeks[i]);

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Cumulative worldwide gross by week in theatres, for every film in the Top 25"
      >
        {yTicks.map((tick) => {
          const y = yForValue(tick);
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="var(--surface-border)"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              <text
                x={PADDING.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--muted-dim)"
                fontFamily="var(--font-ledger)"
                fontSize={9}
              >
                {formatAxisGross(tick)}
              </text>
            </g>
          );
        })}

        {xTickWeeks.map((week) => (
          <text
            key={week}
            x={xForWeek(week)}
            y={HEIGHT - PADDING.bottom + 18}
            textAnchor="middle"
            fill="var(--muted-dim)"
            fontFamily="var(--font-ledger)"
            fontSize={9}
          >
            Wk {week}
          </text>
        ))}

        {series.map((s) => {
          const isActive = active === s.name;
          const isDimmed = active != null && !isActive;
          const path = s.points
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"}${xForWeek(p.week).toFixed(1)},${yForValue(p.value).toFixed(1)}`,
            )
            .join(" ");
          return (
            <path
              key={s.name}
              d={path}
              fill="none"
              stroke={s.color}
              strokeWidth={isActive ? 2.75 : 1.5}
              opacity={isDimmed ? 0.15 : 1}
              onClick={() => onToggle(s.name)}
              style={{
                cursor: "pointer",
                transition: "opacity 0.15s ease, stroke-width 0.15s ease",
              }}
            />
          );
        })}
      </svg>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {series.map((s) => (
          <li key={s.name}>
            <button
              type="button"
              onClick={() => onToggle(s.name)}
              className={`flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-wide transition-colors ${
                active === s.name
                  ? "text-cream"
                  : active
                    ? "text-muted-dim/50"
                    : "text-muted-dim"
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
