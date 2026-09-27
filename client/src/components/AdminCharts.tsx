/**
 * Small dependency-free charts for the admin Overview, drawn in the admin palette.
 */
import { useId } from "react";

/** Keys and short labels for the last `count` months, oldest first ("2026-04" → "Apr"). */
export function lastMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (count - 1 - index),
      1
    );
    return {
      key: monthKey(date),
      label: date.toLocaleDateString("en-GB", { month: "short" }),
    };
  });
}

export const monthKey = (value: Date | string) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

/** A tiny trend line with a soft fill, for stat cards. */
export function Sparkline({
  values,
  color,
  width = 88,
  height = 34,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const id = useId();
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map(
    (value, index) =>
      [index * step, height - 3 - (value / max) * (height - 6)] as const
  );
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${line} ${width},${height}`}
        fill={`url(#${id})`}
      />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points.at(-1)?.[0]}
        cy={points.at(-1)?.[1]}
        r="3"
        fill={color}
      />
    </svg>
  );
}

/** Vertical stacked bars per month, with an optional caption under each label. */
export function MonthlyBars({
  months,
  series,
  caption,
  height = 180,
}: {
  months: { key: string; label: string }[];
  series: { label: string; color: string; values: number[] }[];
  caption?: (index: number) => string;
  height?: number;
}) {
  const totals = months.map((_, index) =>
    series.reduce((sum, item) => sum + item.values[index], 0)
  );
  const max = Math.max(...totals, 1);
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-4 text-xs text-[var(--admin-body)]">
        {series.map(item => (
          <span key={item.label} className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div
        className="relative grid items-end gap-3"
        style={{
          height,
          gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
        }}
      >
        {/* Guide lines at 0, 50% and 100% */}
        {[0, 0.5, 1].map(level => (
          <div
            key={level}
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[var(--admin-border)]"
            style={{ bottom: `${level * 100}%` }}
          />
        ))}
        {months.map((month, index) => (
          <div
            key={month.key}
            className="group relative flex h-full flex-col items-center justify-end"
            title={`${month.label}: ${series.map(item => `${item.values[index]} ${item.label.toLowerCase()}`).join(", ")}`}
          >
            <span
              className="absolute text-xs font-semibold text-[var(--admin-heading)] opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                bottom: `calc(${(totals[index] / max) * 100}% + 4px)`,
              }}
            >
              {totals[index]}
            </span>
            <div
              className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-[6px] transition-[height] duration-500"
              style={{ height: `${(totals[index] / max) * 100}%` }}
            >
              {series.map(item => (
                <div
                  key={item.label}
                  style={{
                    height: totals[index]
                      ? `${(item.values[index] / totals[index]) * 100}%`
                      : 0,
                    background: item.color,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-3 grid gap-3 text-center"
        style={{
          gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
        }}
      >
        {months.map((month, index) => (
          <div key={month.key}>
            <p className="text-xs font-medium text-[var(--admin-heading)]">
              {month.label}
            </p>
            {caption && (
              <p className="mt-0.5 truncate text-[11px] text-[var(--admin-body)]">
                {caption(index)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
