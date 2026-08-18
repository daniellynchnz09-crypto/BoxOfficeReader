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

  if (!hasData) {
    return (
      <p className="mt-14 font-mono text-xs text-muted-dim">
        Not enough weekly data tracked yet to compare trajectories.
      </p>
    );
  }

  return (
    <div className="mt-14">
      <TrendMultiChart
        series={series}
        weeks={weeks}
        active={active}
        onToggle={(name) =>
          setActive((cur) => (cur === name ? null : name))
        }
      />
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

  const xTickWeeks = pickTickIndices(weeks.length, 6).map((i) => weeks[i]);

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
                fontSize={12}
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
            y={HEIGHT - PADDING.bottom + 20}
            textAnchor="middle"
            fill="var(--muted-dim)"
            fontFamily="var(--font-ledger)"
            fontSize={12}
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
