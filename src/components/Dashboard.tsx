"use client";

import { useMemo, useState } from "react";
import { useFamily } from "@/context/FamilyContext";
import { Avatar } from "@/components/Avatar";
import { BrandLockup } from "@/components/BiteLogo";
import { BiteCard, MacroSummaryChips } from "@/components/BiteCard";
import { MacroLineChart } from "@/components/MacroLineChart";
import { CalorieRing } from "@/components/NutritionBars";
import { WeekCalendar } from "@/components/WeekCalendar";
import {
  EXPECTED_MEALS,
  averagesFromTotals,
  dailyTotals,
  familyGoals,
  formatCompactDate,
  mealsForMemberToday,
  mealsInWeek,
  mealsToday,
  missingMealsForMember,
  todayKey,
  waterForMember,
  weekDayKeys,
  type ReportRange,
} from "@/lib/nutrition";
import type { FamilyMember, MealEntry } from "@/lib/types";

export function Dashboard({
  onOpenMember,
  onOpenPlan,
}: {
  onOpenMember?: (id: string) => void;
  onOpenPlan?: () => void;
}) {
  const {
    members,
    meals,
    notes,
    waterLogs,
    activeLogger,
    bumpWater,
    ready,
    notificationPrefs,
  } = useFamily();

  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [range, setRange] = useState<ReportRange>("daily");
  const [focusMemberId, setFocusMemberId] = useState<string | null>(null);

  const activityByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const day of weekDayKeys(selectedDay)) {
      const dayMeals = focusMemberId
        ? mealsForMemberToday(meals, focusMemberId, day)
        : mealsToday(meals, day);
      map[day] = dayMeals.length;
    }
    return map;
  }, [meals, selectedDay, focusMemberId]);

  const weekMacroSeries = useMemo(() => {
    return weekDayKeys(selectedDay).map((day) => {
      const dayMeals = focusMemberId
        ? mealsForMemberToday(meals, focusMemberId, day)
        : mealsToday(meals, day);
      const totals = dailyTotals(dayMeals);
      return {
        day,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        fiber: totals.fiber,
      };
    });
  }, [meals, selectedDay, focusMemberId]);

  if (!ready) {
    return <div className="animate-pulse p-6 text-[var(--muted)]">Loading family…</div>;
  }

  const focusMember = focusMemberId
    ? members.find((m) => m.id === focusMemberId)
    : undefined;

  const scopedMeals =
    range === "weekly"
      ? focusMember
        ? mealsInWeek(meals, selectedDay).filter((m) => m.memberId === focusMember.id)
        : mealsInWeek(meals, selectedDay)
      : focusMember
        ? mealsForMemberToday(meals, focusMember.id, selectedDay)
        : mealsToday(meals, selectedDay);

  const totals = dailyTotals(scopedMeals);
  const goals = focusMember ? focusMember.nutritionGoals : familyGoals(members);
  const displayTotals =
    range === "weekly" ? averagesFromTotals(totals, 7) : totals;
  const displayGoals = goals;

  const isToday = selectedDay === todayKey();
  const missingBlocks =
    range === "daily" && notificationPrefs.missingMeals
      ? members
          .filter((m) => !focusMember || m.id === focusMember.id)
          .map((m) => ({
            member: m,
            missing: missingMealsForMember(meals, m.id, selectedDay),
          }))
          .filter((x) => x.missing.length > 0)
      : [];

  const allergyList = members.filter(
    (m) => m.allergies.length > 0 || m.foodsToAvoid.length > 0,
  );

  const dayMealsSorted = [...scopedMeals].sort((a, b) =>
    b.loggedAt.localeCompare(a.loggedAt),
  );

  return (
    <div className="space-y-6 pb-28">
      <header className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h1>
            <BrandLockup size={44} />
          </h1>
          <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {formatCompactDate(selectedDay)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {activeLogger ? (
            <Avatar member={activeLogger} size={40} className="ring-2 ring-white/80" />
          ) : members[0] ? (
            <Avatar member={members[0]} size={40} className="ring-2 ring-white/80" />
          ) : null}
          {onOpenPlan && (
            <button
              type="button"
              onClick={onOpenPlan}
              className="btn-bounce rounded-2xl bg-[var(--citrus)] px-3 py-2 text-xs font-bold text-[var(--ink)]"
            >
              Plan
            </button>
          )}
        </div>
      </header>

      <section className="home-banner relative overflow-hidden rounded-[1.75rem] px-5 py-4 text-white">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
              {range === "weekly" ? "Week avg" : isToday ? "Today" : "Day"}
              {focusMember ? ` · ${focusMember.name}` : " · Household"}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-4xl tabular-nums leading-none">
              {displayTotals.calories}
              <span className="ml-1.5 text-base text-white/70">kcal</span>
            </p>
          </div>
          <div className="rounded-full bg-white/90 p-1 shadow-sm">
            <CalorieRing
              current={displayTotals.calories}
              target={displayGoals.calories}
              size={68}
            />
          </div>
        </div>
      </section>

      <section className="section-in space-y-3 rounded-[1.5rem] bg-white/70 p-4 backdrop-blur-sm">
        <WeekCalendar
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          range={range}
          onRangeChange={setRange}
          activityByDay={activityByDay}
        />
      </section>

      <section className="section-in space-y-3" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center justify-between px-1">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Family
          </h2>
          <button
            type="button"
            onClick={() => setFocusMemberId(null)}
            className={`text-xs font-bold ${
              !focusMemberId ? "text-[var(--forest)]" : "text-[var(--muted)]"
            }`}
          >
            All
          </button>
        </div>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {members.map((member) => (
            <MemberChip
              key={member.id}
              member={member}
              meals={mealsForMemberToday(meals, member.id, selectedDay)}
              selected={focusMemberId === member.id}
              onSelect={() =>
                setFocusMemberId((id) => (id === member.id ? null : member.id))
              }
              onOpen={() => onOpenMember?.(member.id)}
              onWater={() => bumpWater(member.id)}
              water={waterForMember(waterLogs, member.id, selectedDay)}
              showWater={range === "daily" && isToday}
            />
          ))}
        </div>
      </section>

      <section className="section-in space-y-3" style={{ animationDelay: "100ms" }}>
        <MacroSummaryChips
          protein={displayTotals.protein}
          carbs={displayTotals.carbs}
          fat={displayTotals.fat}
          fiber={displayTotals.fiber}
          proteinMax={displayGoals.protein}
          carbsMax={displayGoals.carbs}
          fatMax={displayGoals.fat}
          fiberMax={displayGoals.fiber}
        />
      </section>

      {missingBlocks.length > 0 && (
        <section className="flex gap-2 overflow-x-auto pb-1">
          {missingBlocks.slice(0, 4).map(({ member, missing }) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onOpenMember?.(member.id)}
              className="btn-bounce shrink-0 rounded-2xl border border-[var(--citrus)]/50 bg-[#FFF8E8] px-3 py-2 text-left"
            >
              <div className="flex items-center gap-2">
                <Avatar member={member} size={28} />
                <div>
                  <p className="text-xs font-semibold text-[var(--ink)]">{member.name}</p>
                  <p className="text-[10px] capitalize text-[var(--muted)]">
                    {missing.join(" · ")}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </section>
      )}

      <section className="section-in space-y-3" style={{ animationDelay: "140ms" }}>
        <div className="flex items-baseline justify-between px-1">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Bites
          </h2>
          <span className="text-xs font-medium text-[var(--muted)]">
            {dayMealsSorted.length} logged
          </span>
        </div>
        {dayMealsSorted.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No bites yet — snap a plate.
          </p>
        ) : (
          <ul className="space-y-2">
            {dayMealsSorted.slice(0, 10).map((meal, i) => {
              const member = members.find((m) => m.id === meal.memberId);
              return (
                <li key={meal.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <BiteCard meal={meal} member={member} showMember={!focusMember} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="section-in" style={{ animationDelay: "180ms" }}>
        <MacroLineChart
          series={weekMacroSeries}
          selectedDay={selectedDay}
          caption={focusMember ? focusMember.name : "Household"}
        />
      </section>

      {allergyList.length > 0 && (
        <section className="flex gap-2 overflow-x-auto pb-1">
          {allergyList.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onOpenMember?.(m.id)}
              className="btn-bounce flex shrink-0 items-center gap-2 rounded-full bg-white/75 px-3 py-1.5"
            >
              <Avatar member={m} size={24} />
              <span className="max-w-[140px] truncate text-[11px] text-[var(--muted)]">
                {[...m.allergies, ...m.foodsToAvoid].join(" · ")}
              </span>
            </button>
          ))}
        </section>
      )}

      {notes.length > 0 && (
        <section className="space-y-2">
          {notes.slice(0, 2).map((n) => {
            const who = members.find((m) => m.id === n.memberId);
            return (
              <p
                key={n.id}
                className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-[var(--ink)]"
              >
                <span className="font-semibold">{who?.name}</span>
                {" — "}
                {n.text}
              </p>
            );
          })}
        </section>
      )}

      <p className="px-2 pb-2 text-center text-[11px] text-[var(--muted)]">
        Estimates only — not medical advice.
      </p>
    </div>
  );
}

function MemberChip({
  member,
  meals,
  selected,
  onSelect,
  onOpen,
  onWater,
  water,
  showWater,
}: {
  member: FamilyMember;
  meals: MealEntry[];
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onWater: () => void;
  water: number;
  showWater: boolean;
}) {
  const logged = new Set(meals.map((m) => m.mealType));

  return (
    <div
      className={`flex w-[88px] shrink-0 flex-col items-center gap-2 rounded-[1.35rem] px-2 py-3 ${
        selected ? "bg-[var(--mist)] ring-2 ring-[var(--forest)]/40" : "bg-white/70"
      }`}
    >
      <button type="button" onClick={onSelect} className="btn-bounce flex flex-col items-center gap-1.5">
        <Avatar member={member} size={56} className="ring-2 ring-white" />
        <span className="max-w-full truncate text-xs font-bold text-[var(--ink)]">
          {member.name}
        </span>
      </button>
      <div className="flex gap-1">
        {EXPECTED_MEALS.map((meal) => (
          <span
            key={meal}
            title={meal}
            className={`h-2 w-2 rounded-full ${
              logged.has(meal) ? "bg-[var(--forest)]" : "bg-[var(--line)]"
            }`}
          />
        ))}
      </div>
      <div className="flex w-full flex-col items-center gap-1">
        <button
          type="button"
          onClick={onOpen}
          className="text-[10px] font-bold text-[var(--forest-deep)]"
        >
          Profile
        </button>
        {showWater && (
          <button
            type="button"
            onClick={onWater}
            className="btn-bounce rounded-full bg-[var(--mist)] px-2 py-0.5 text-[10px] font-semibold text-[var(--forest-deep)]"
          >
            +{water}
          </button>
        )}
      </div>
    </div>
  );
}
