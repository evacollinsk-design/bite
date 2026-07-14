"use client";

import { useMemo, useState } from "react";
import { useFamily } from "@/context/FamilyContext";
import { BiteCard } from "@/components/BiteCard";
import { Avatar } from "@/components/Avatar";
import { HomeLogoButton } from "@/components/HomeLogoButton";
import { CalorieRing, MacroBar } from "@/components/NutritionBars";
import {
  dayKeysLastWeek,
  encouragingGaps,
  weeklyPatternSummary,
} from "@/lib/insights";
import {
  dailyTotals,
  formatDayLabel,
  mealsForMemberToday,
  progressPercent,
  waterForMember,
} from "@/lib/nutrition";

export function InsightsPanel({ onHome }: { onHome?: () => void }) {
  const { members, meals, waterLogs, ready } = useFamily();
  const [memberId, setMemberId] = useState(
    () => members.find((m) => m.role === "child")?.id ?? members[0]?.id ?? "",
  );
  const member = members.find((m) => m.id === memberId) ?? members[0];
  const days = dayKeysLastWeek();

  const weekBars = useMemo(() => {
    if (!member) return [];
    return days.map((day) => {
      const dayMeals = mealsForMemberToday(meals, member.id, day);
      const totals = dailyTotals(dayMeals);
      return {
        day,
        calories: totals.calories,
        protein: totals.protein,
        count: dayMeals.length,
      };
    });
  }, [days, meals, member]);

  if (!ready || !member) {
    return <div className="p-6 text-[var(--muted)]">Loading insights…</div>;
  }

  const todayMeals = mealsForMemberToday(meals, member.id);
  const totals = dailyTotals(todayMeals);
  const water = waterForMember(waterLogs, member.id);
  const tips = encouragingGaps(member, totals, water);
  const timeline = meals
    .filter((m) => m.memberId === member.id)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
    .slice(0, 12);

  return (
    <div className="space-y-7 pb-28">
      <header className="space-y-2 px-1">
        {onHome && <HomeLogoButton onHome={onHome} size={34} />}
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral)]">
          Insights
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Weekly patterns
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Soft trends — not scores. Every value is an estimate you can refine anytime.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMemberId(m.id)}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
              member.id === m.id
                ? "bg-[var(--forest)] text-white"
                : "bg-white/70 text-[var(--ink)]"
            }`}
          >
            <Avatar member={m} size={28} />
            {m.name}
          </button>
        ))}
      </div>

      <section className="rounded-[1.75rem] bg-white/80 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Today</p>
            <p className="font-[family-name:var(--font-display)] text-2xl">{member.name}</p>
          </div>
          <CalorieRing
            current={totals.calories}
            target={member.nutritionGoals.calories}
            size={76}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MacroBar
            label="Protein"
            value={totals.protein}
            max={member.nutritionGoals.protein}
            color="#0d9f6e"
          />
          <MacroBar
            label="Carbs"
            value={totals.carbs}
            max={member.nutritionGoals.carbs}
            color="#e09f3e"
          />
          <MacroBar
            label="Fats"
            value={totals.fat}
            max={member.nutritionGoals.fat}
            color="#ff5c3a"
          />
          <MacroBar
            label="Fiber"
            value={totals.fiber}
            max={member.nutritionGoals.fiber}
            color="#ff3d7f"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MacroBar
            label="Fruit"
            value={totals.fruitServings ?? 0}
            unit=""
            max={member.nutritionGoals.fruitServings}
            color="#ff5c3a"
          />
          <MacroBar
            label="Veggies"
            value={totals.vegServings ?? 0}
            unit=""
            max={member.nutritionGoals.vegServings}
            color="#2a9d8f"
          />
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Water {water}/{member.nutritionGoals.waterGlasses} glasses · Sugar ~{totals.sugar}g
          (estimate)
        </p>
        {tips.length > 0 && (
          <ul className="mt-4 space-y-2">
            {tips.map((tip) => (
              <li
                key={tip}
                className="rounded-2xl bg-[#FFF8E8] px-3 py-2 text-sm leading-relaxed text-[var(--ink)]"
              >
                {tip}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[1.75rem] bg-white/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl">This week</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{weeklyPatternSummary(member, meals)}</p>
        <div className="mt-4 flex items-end justify-between gap-1.5">
          {weekBars.map((bar) => {
            const pct = progressPercent(bar.calories, member.nutritionGoals.calories);
            return (
              <div key={bar.day} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end rounded-lg bg-[var(--mist)]/80 px-1 pb-1">
                  <div
                    className="w-full rounded-md bg-[var(--forest)] transition-all duration-500"
                    style={{ height: `${Math.max(6, pct)}%` }}
                    title={`${bar.calories} kcal`}
                  />
                </div>
                <span className="text-[10px] text-[var(--muted)]">
                  {formatDayLabel(bar.day).split(",")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="px-1 font-[family-name:var(--font-display)] text-xl">
          Nutrition timeline
        </h2>
        {timeline.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-[var(--muted)]">
            No meals yet for {member.name}.
          </p>
        ) : (
          <ul className="space-y-2">
            {timeline.map((meal) => (
              <li key={meal.id}>
                <BiteCard meal={meal} member={member} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
