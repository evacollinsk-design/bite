"use client";

import { Avatar } from "@/components/Avatar";
import { formatTime, normalizeNutrition } from "@/lib/nutrition";
import type { FamilyMember, MealEntry } from "@/lib/types";

const MEAL_TINT: Record<MealEntry["mealType"], string> = {
  breakfast: "from-[#fff4cc] to-[#ffe082]",
  lunch: "from-[#dff8ea] to-[#b8f23d]/70",
  dinner: "from-[#ffe4ec] to-[#ffb3c9]/55",
  snack: "from-[#ffe8e0] to-[#ffc4b0]/60",
};

export function BiteCard({
  meal,
  member,
  showMember = false,
}: {
  meal: MealEntry;
  member?: FamilyMember;
  showMember?: boolean;
}) {
  const n = normalizeNutrition(meal.nutrition);
  const title = meal.items.map((i) => i.name).join(", ") || meal.mealType;
  const tint = MEAL_TINT[meal.mealType];

  return (
    <article className="bite-card flex gap-3 rounded-[1.25rem] bg-white/80 p-3 backdrop-blur-sm">
      <div
        className={`relative flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${tint}`}
      >
        {meal.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meal.photoDataUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center px-1 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--ink)]/55">
              {meal.mealType.slice(0, 4)}
            </span>
            <span className="font-[family-name:var(--font-display)] text-sm tabular-nums text-[var(--ink)]">
              {n.calories}
            </span>
          </div>
        )}
        {showMember && member && (
          <span className="absolute -bottom-1 -right-1 rounded-full ring-2 ring-white">
            <Avatar member={member} size={22} />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--ink)]">{title}</p>
            <p className="text-xs capitalize text-[var(--muted)]">
              {showMember && member ? `${member.name} · ` : ""}
              {meal.mealType} · {formatTime(meal.loggedAt)}
              {meal.incomplete ? " · open" : ""}
            </p>
          </div>
          <p className="shrink-0 text-sm font-bold tabular-nums text-[var(--forest)]">
            ~{n.calories}
          </p>
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1">
          <MacroChip label="P" value={n.protein} color="var(--forest)" />
          <MacroChip label="C" value={n.carbs} color="var(--citrus)" />
          <MacroChip label="F" value={n.fat} color="var(--coral)" />
          <MacroChip label="Fi" value={n.fiber} color="var(--berry)" />
        </div>
      </div>
    </article>
  );
}

function MacroChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-lg px-1.5 py-1 text-center"
      style={{ background: `color-mix(in srgb, ${color} 14%, white)` }}
    >
      <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color }}>
        {label}
      </p>
      <p className="text-[11px] font-semibold tabular-nums text-[var(--ink)]">{value}g</p>
    </div>
  );
}

/** Compact intake summary for a day/week report */
export function MacroSummaryChips({
  protein,
  carbs,
  fat,
  fiber,
  proteinMax,
  carbsMax,
  fatMax,
  fiberMax,
}: {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  proteinMax: number;
  carbsMax: number;
  fatMax: number;
  fiberMax: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <GoalChip label="Protein" value={protein} max={proteinMax} color="#0d9f6e" />
      <GoalChip label="Carbs" value={carbs} max={carbsMax} color="#e09f3e" />
      <GoalChip label="Fats" value={fat} max={fatMax} color="#ff5c3a" />
      <GoalChip label="Fiber" value={fiber} max={fiberMax} color="#ff3d7f" />
    </div>
  );
}

function GoalChip({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="rounded-2xl bg-white/80 px-2 py-2.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-0.5 font-[family-name:var(--font-display)] text-lg tabular-nums leading-none text-[var(--ink)]">
        {Math.round(value)}
      </p>
      <p className="mt-0.5 text-[10px] tabular-nums text-[var(--muted)]">/{max}g</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
