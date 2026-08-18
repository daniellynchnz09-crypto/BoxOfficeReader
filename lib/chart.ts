export const CHART_PALETTE = [
  "#d9a441", // gold
  "#b3242c", // crimson
  "#e8c97f", // pale gold
  "#7a6ff0", // marquee neon violet
  "#4fa6a6", // projector teal
  "#d97b4f", // burnt orange
  "#9c97b3", // dusty lavender
  "#c75146", // rust red
];

export interface Point {
  x: number;
  y: number;
}

/**
 * Maps a series of (week, value) pairs onto an SVG viewBox, dropping
 * leading/trailing gaps (a film's weeklyGross array is null before release
 * and past the last recorded week).
 */
export function toLinePath(
  weeks: number[],
  values: (number | null)[],
  width: number,
  height: number,
  padding: number,
  maxValue: number,
): { path: string; points: (Point & { week: number; value: number })[] } {
  const pairs = weeks
    .map((week, i) => ({ week, value: values[i] }))
    .filter((p): p is { week: number; value: number } => p.value != null);

  if (pairs.length === 0) return { path: "", points: [] };

  const minWeek = weeks[0];
  const maxWeek = weeks[weeks.length - 1] || 1;
  const weekSpan = Math.max(1, maxWeek - minWeek);

  const points = pairs.map(({ week, value }) => {
    const x = padding + ((week - minWeek) / weekSpan) * (width - padding * 2);
    const y =
      height -
      padding -
      (maxValue > 0 ? value / maxValue : 0) * (height - padding * 2);
    return { x, y, week, value };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return { path, points };
}

/** Rounds up to a "nice" step (1/2/5 × a power of ten) and returns evenly spaced ticks from 0 to that step's ceiling of maxValue. */
export function niceTicks(maxValue: number, tickCount = 4): number[] {
  if (maxValue <= 0) return [0];
  const rawStep = maxValue / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const niceStep =
    (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude;

  // The top tick must be >= maxValue, not just <= it - otherwise a data
  // point can fall above the last gridline and render outside the plot area.
  const topTick = Math.ceil(maxValue / niceStep) * niceStep;

  const ticks: number[] = [];
  for (let v = 0; v <= topTick + niceStep * 0.001; v += niceStep) {
    ticks.push(Math.round(v));
  }
  return ticks;
}

/** Picks up to maxLabels evenly spaced indices from a series of `count` items, always including the first and last. */
export function pickTickIndices(count: number, maxLabels = 7): number[] {
  if (count <= maxLabels) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (maxLabels - 1);
  const indices = new Set<number>();
  for (let i = 0; i < maxLabels; i++) indices.add(Math.round(i * step));
  return Array.from(indices).sort((a, b) => a - b);
}
