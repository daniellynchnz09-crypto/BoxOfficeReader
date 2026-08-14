import { toLinePath } from "@/lib/chart";
import { formatGross } from "@/lib/format";

const WIDTH = 320;
const HEIGHT = 72;
const PADDING = 6;

export function Sparkline({
  weeks,
  values,
}: {
  weeks: number[];
  values: (number | null)[];
}) {
  const recorded = values.filter((v): v is number => v != null);

  if (recorded.length < 2) {
    return (
      <p className="font-mono text-xs text-muted-dim">
        Not enough weeks tracked yet to plot a trend.
      </p>
    );
  }

  const maxValue = Math.max(...recorded);
  const { path, points } = toLinePath(
    weeks,
    values,
    WIDTH,
    HEIGHT,
    PADDING,
    maxValue,
  );
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-16 w-full max-w-xs"
      role="img"
      aria-label={`Weekly cumulative worldwide gross trend, currently ${formatGross(last.value)} at week ${last.week}`}
    >
      <path d={path} fill="none" stroke="var(--gold)" strokeWidth={1.75} />
      <circle cx={last.x} cy={last.y} r={2.5} fill="var(--gold-soft)" />
    </svg>
  );
}
