"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { formatTime } from "@/lib/nutrition";
import type { FamilyMember } from "@/lib/types";

export type MacroTimePoint = {
  id: string;
  loggedAt: string;
  minute: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type MemberMacroSeries = {
  member: Pick<
    FamilyMember,
    "id" | "name" | "avatarColor" | "age" | "role" | "personality"
  >;
  points: MacroTimePoint[];
};

const MACROS = [
  { key: "protein" as const, label: "Protein", unit: "g", color: "#0d9f6e" },
  { key: "carbs" as const, label: "Carbs", unit: "g", color: "#e09f3e" },
  { key: "fat" as const, label: "Fats", unit: "g", color: "#ff5c3a" },
  { key: "fiber" as const, label: "Fiber", unit: "g", color: "#ff3d7f" },
];

const DAY_START = 6 * 60;
const DAY_END = 21 * 60;
const DAY_SPAN = DAY_END - DAY_START;
const HOUR_TICKS = [7, 10, 13, 16, 19];

const W = 360;
const H = 200;
const PAD = { top: 18, right: 18, bottom: 30, left: 36 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;
const DOT = 26;

function niceMax(value: number): number {
  if (value <= 0) return 40;
  const padded = value * 1.2;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  const normalized = padded / magnitude;
  const step = normalized <= 1.5 ? 1.5 : normalized <= 3 ? 3 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function clampMinute(minute: number): number {
  return Math.min(DAY_END, Math.max(DAY_START, minute));
}

function hourLabel(hour: number): string {
  if (hour === 12) return "12p";
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

function linePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function areaPath(points: { x: number; y: number }[], baselineY: number): string {
  if (points.length === 0) return "";
  const line = linePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

export function MacroLineChart({
  memberSeries,
  caption,
}: {
  memberSeries: MemberMacroSeries[];
  caption?: string;
}) {
  const [macroIndex, setMacroIndex] = useState(0);
  const macro = MACROS[macroIndex];

  const peak = Math.max(
    0,
    ...memberSeries.flatMap((s) => s.points.map((p) => p[macro.key])),
  );
  const yMax = niceMax(peak);
  const ticks = [0, yMax / 2, yMax];
  const baselineY = PAD.top + INNER_H;

  const xAtMinute = (minute: number) =>
    PAD.left + ((clampMinute(minute) - DAY_START) / DAY_SPAN) * INNER_W;
  const yAt = (v: number) =>
    PAD.top + INNER_H - (Math.min(v, yMax) / yMax) * INNER_H;

  const plotted = memberSeries
    .map((series, memberIndex) => {
      if (series.points.length === 0) return null;
      const nodes = [
        { x: xAtMinute(DAY_START), y: yAt(0), meal: false as const },
        ...series.points.map((p) => ({
          x: xAtMinute(p.minute),
          y: yAt(p[macro.key]),
          meal: true as const,
          point: p,
          nudgeX: ((memberIndex % 3) - 1) * 5,
          nudgeY: -((memberIndex % 2) * 4),
        })),
      ];
      return {
        series,
        color: series.member.avatarColor || macro.color,
        nodes,
        mealNodes: nodes.filter((n) => n.meal),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const hasData = plotted.length > 0;

  return (
    <div className="rounded-[1.5rem] bg-white/80 p-4 backdrop-blur-sm">
      <div className="px-0.5">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Macros
        </h2>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          {caption ? `${caption} · ` : ""}
          through the day
        </p>
      </div>

      <div
        className="mt-3 flex gap-1 rounded-2xl bg-[var(--mist)] p-1"
        role="tablist"
        aria-label="Choose macro"
      >
        {MACROS.map((m, i) => {
          const active = i === macroIndex;
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMacroIndex(i)}
              className="min-w-0 flex-1 rounded-xl px-2 py-2 text-center text-[11px] font-bold transition"
              style={
                active
                  ? {
                      background: "white",
                      color: m.color,
                      boxShadow: "0 1px 3px rgba(26, 47, 40, 0.08)",
                    }
                  : { color: "var(--muted)" }
              }
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${macro.label} through the day by family member`}
        >
          <defs>
            {plotted.map(({ series, color }) => (
              <linearGradient
                key={`grad-${series.member.id}`}
                id={`macro-fill-${series.member.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

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
                  strokeDasharray={tick === 0 ? undefined : "2 5"}
                />
                <text
                  x={PAD.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[var(--muted)]"
                  style={{ fontSize: 9, fontWeight: 700 }}
                >
                  {Math.round(tick)}
                  {tick === yMax ? macro.unit : ""}
                </text>
              </g>
            );
          })}

          {HOUR_TICKS.map((hour) => {
            const x = xAtMinute(hour * 60);
            return (
              <text
                key={hour}
                x={x}
                y={H - 8}
                textAnchor="middle"
                className="fill-[var(--muted)]"
                style={{ fontSize: 10, fontWeight: 700 }}
              >
                {hourLabel(hour)}
              </text>
            );
          })}

          {hasData ? (
            plotted.map(({ series, color, nodes }) => {
              const coords = nodes.map((n) => ({ x: n.x, y: n.y }));
              return (
                <g key={series.member.id}>
                  <path
                    d={areaPath(coords, baselineY)}
                    fill={`url(#macro-fill-${series.member.id})`}
                  />
                  <path
                    d={linePath(coords)}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="macro-line"
                  />
                </g>
              );
            })
          ) : (
            <text
              x={W / 2}
              y={PAD.top + INNER_H / 2}
              textAnchor="middle"
              className="fill-[var(--muted)]"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Log a bite to see today&apos;s {macro.label.toLowerCase()}
            </text>
          )}
        </svg>

        {hasData ? (
          <div className="pointer-events-none absolute inset-0">
            {plotted.map(({ series, mealNodes }) =>
              mealNodes.map((n) => {
                if (!n.point) return null;
                const left = ((n.x + (n.nudgeX ?? 0)) / W) * 100;
                const top = ((n.y + (n.nudgeY ?? 0)) / H) * 100;
                return (
                  <div
                    key={`${series.member.id}-${n.point.id}`}
                    className="absolute"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: DOT,
                      height: DOT,
                      transform: "translate(-50%, -50%)",
                    }}
                    title={`${series.member.name} · ${formatTime(n.point.loggedAt)} · ${n.point[macro.key]}${macro.unit}`}
                  >
                    <Avatar
                      member={series.member}
                      size={DOT}
                      animated={false}
                      className="ring-[2.5px] ring-white shadow-[0_2px_8px_rgba(26,47,40,0.18)]"
                    />
                  </div>
                );
              }),
            )}
          </div>
        ) : null}
      </div>

      {memberSeries.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-2 px-0.5">
          {memberSeries.map((s) => {
            const last = s.points[s.points.length - 1];
            const total = last ? last[macro.key] : 0;
            return (
              <li
                key={s.member.id}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink)]"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: s.member.avatarColor }}
                  aria-hidden
                />
                {s.member.name.split(" ")[0]}
                <span className="font-bold tabular-nums text-[var(--muted)]">
                  {total}
                  {macro.unit}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
