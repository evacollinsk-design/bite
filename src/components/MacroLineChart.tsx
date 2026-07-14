"use client";

import { weekdayLetter } from "@/lib/nutrition";

export type MacroDayPoint = {
  day: string;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

const SERIES = [
  { key: "protein" as const, label: "Protein", color: "#0d9f6e" },
  { key: "carbs" as const, label: "Carbs", color: "#e09f3e" },
  { key: "fat" as const, label: "Fats", color: "#ff5c3a" },
  { key: "fiber" as const, label: "Fiber", color: "#ff3d7f" },
];

const W = 320;
const H = 168;
const PAD = { top: 12, right: 10, bottom: 28, left: 34 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function niceMax(value: number): number {
  if (value <= 0) return 40;
  const padded = value * 1.15;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  const normalized = padded / magnitude;
  const step = normalized <= 1.5 ? 1.5 : normalized <= 3 ? 3 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function linePath(
  points: { x: number; y: number }[],
): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export function MacroLineChart({
  series,
  selectedDay,
  caption,
}: {
  series: MacroDayPoint[];
  selectedDay?: string;
  caption?: string;
}) {
  const peak = Math.max(
    0,
    ...series.flatMap((d) => [d.protein, d.carbs, d.fat, d.fiber]),
  );
  const yMax = niceMax(peak);
  const ticks = [0, yMax / 2, yMax];
  const n = Math.max(1, series.length);

  const xAt = (i: number) =>
    PAD.left + (n === 1 ? INNER_W / 2 : (i / (n - 1)) * INNER_W);
  const yAt = (v: number) => PAD.top + INNER_H - (Math.min(v, yMax) / yMax) * INNER_H;

  const hasData = peak > 0;

  return (
    <div className="rounded-[1.5rem] bg-white/80 p-4 backdrop-blur-sm">
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Macros
        </h2>
        {caption ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {caption}
          </span>
        ) : null}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 px-0.5">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink)]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: s.color }}
              aria-hidden
            />
            {s.label}
          </li>
        ))}
      </ul>

      <div className="mt-2 -mx-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="Weekly macro totals line chart"
        >
          {ticks.map((tick) => {
            const y = yAt(tick);
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth={1}
                  strokeDasharray={tick === 0 ? undefined : "3 4"}
                />
                <text
                  x={PAD.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[var(--muted)]"
                  style={{ fontSize: 9, fontWeight: 600 }}
                >
                  {Math.round(tick)}
                </text>
              </g>
            );
          })}

          {series.map((point, i) => {
            const x = xAt(i);
            const selected = point.day === selectedDay;
            return (
              <g key={point.day}>
                {selected ? (
                  <line
                    x1={x}
                    x2={x}
                    y1={PAD.top}
                    y2={PAD.top + INNER_H}
                    stroke="var(--forest)"
                    strokeOpacity={0.22}
                    strokeWidth={8}
                    strokeLinecap="round"
                  />
                ) : null}
                <text
                  x={x}
                  y={H - 8}
                  textAnchor="middle"
                  className={selected ? "fill-[var(--forest-deep)]" : "fill-[var(--muted)]"}
                  style={{ fontSize: 10, fontWeight: selected ? 700 : 600 }}
                >
                  {weekdayLetter(point.day)}
                </text>
              </g>
            );
          })}

          {hasData
            ? SERIES.map((s) => {
                const points = series.map((d, i) => ({
                  x: xAt(i),
                  y: yAt(d[s.key]),
                }));
                return (
                  <g key={s.key}>
                    <path
                      d={linePath(points)}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2.25}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="macro-line"
                    />
                    {points.map((p, i) => (
                      <circle
                        key={`${s.key}-${series[i].day}`}
                        cx={p.x}
                        cy={p.y}
                        r={series[i].day === selectedDay ? 4 : 3}
                        fill={s.color}
                        stroke="white"
                        strokeWidth={1.5}
                      >
                        <title>
                          {s.label} · {series[i][s.key]}g
                        </title>
                      </circle>
                    ))}
                  </g>
                );
              })
            : (
              <text
                x={W / 2}
                y={PAD.top + INNER_H / 2}
                textAnchor="middle"
                className="fill-[var(--muted)]"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                No macros yet this week
              </text>
            )}
        </svg>
      </div>
    </div>
  );
}
