import { niceTicks, pickTickIndices } from "@/lib/chart";
import { formatGross } from "@/lib/format";

const WIDTH = 720;
const HEIGHT = 260;
const PADDING = { top: 16, right: 16, bottom: 28, left: 60 };

function formatAxisGross(value: number): string {
  return value === 0 ? "$0" : formatGross(value);
}

export function TrendChart({
  weeks,
  values,
}: {
  weeks: number[];
  values: (number | null)[];
}) {
  const pairs = weeks
    .map((week, i) => ({ week, value: values[i] }))
    .filter((p): p is { week: number; value: number } => p.value != null);

  if (pairs.length < 2) {
    return (
      <p className="font-mono text-xs text-muted-dim">
        Not enough weeks tracked yet to plot a trend.
      </p>
    );
  }

  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const pairWeeks = pairs.map((p) => p.week);
  const maxValue = Math.max(...pairs.map((p) => p.value));
  const yTicks = niceTicks(maxValue, 4);
  const scaleMax = yTicks[yTicks.length - 1] || 1;

  const minWeek = pairWeeks[0];
  const maxWeek = pairWeeks[pairWeeks.length - 1];
  const weekSpan = Math.max(1, maxWeek - minWeek);

  const points = pairs.map(({ week, value }) => ({
    x: PADDING.left + ((week - minWeek) / weekSpan) * plotW,
    y: PADDING.top + plotH - (value / scaleMax) * plotH,
    week,
    value,
  }));

  const baseline = PADDING.top + plotH;
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${baseline.toFixed(1)} L${points[0].x.toFixed(1)},${baseline.toFixed(1)} Z`;

  const xTickIdx = pickTickIndices(points.length, 8);
  const last = points[points.length - 1];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-dim">
          Cumulative gross by week in theatres
        </p>
        <p className="shrink-0 font-mono text-[0.65rem] text-muted-dim">
          Week {last.week} ·{" "}
          <span className="text-gold-soft">{formatGross(last.value)}</span>
        </p>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`Weekly cumulative worldwide gross, from ${formatGross(points[0].value)} at week ${minWeek} to ${formatGross(last.value)} at week ${last.week}`}
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = PADDING.top + plotH - (tick / scaleMax) * plotH;
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

        {xTickIdx.map((i) => (
          <text
            key={i}
            x={points[i].x}
            y={HEIGHT - PADDING.bottom + 16}
            textAnchor="middle"
            fill="var(--muted-dim)"
            fontFamily="var(--font-ledger)"
            fontSize={9}
          >
            Wk {points[i].week}
          </text>
        ))}

        <path d={areaPath} fill="url(#trend-fill)" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--gold)" strokeWidth={2} />
        <circle cx={last.x} cy={last.y} r={3.5} fill="var(--gold-soft)" />
      </svg>
    </div>
  );
}
