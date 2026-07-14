"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useFamily } from "@/context/FamilyContext";
import { Avatar } from "@/components/Avatar";
import { BiteCard, MacroSummaryChips } from "@/components/BiteCard";
import { CalorieRing } from "@/components/NutritionBars";
import { WeekCalendar } from "@/components/WeekCalendar";
import { canEditProfiles, canLogMeals, weeklyPatternSummary } from "@/lib/insights";
import {
  averagesFromTotals,
  dailyTotals,
  formatTime,
  mealsForMemberInWeek,
  mealsForMemberToday,
  missingMealsForMember,
  permissionLabel,
  roleLabel,
  todayKey,
  waterForMember,
  weekDayKeys,
  type ReportRange,
} from "@/lib/nutrition";
import {
  PERSONALITIES,
  PERSONALITY_LABELS,
  ageBandForAge,
  ageBandLabel,
  defaultPersonality,
  resolvePersonality,
} from "@/lib/pixelCharacter";
import type { Personality } from "@/lib/types";

export function MemberProfile({
  memberId,
  onBack,
}: {
  memberId: string;
  onBack: () => void;
}) {
  const {
    members,
    meals,
    notes,
    waterLogs,
    bumpWater,
    addCaregiverNote,
    updateMember,
    removeMember,
    activeLogger,
    activeLoggerId,
    setActiveLoggerId,
  } = useFamily();

  const member = members.find((m) => m.id === memberId);
  const canEdit = canEditProfiles(activeLogger?.permissionLevel);
  const canNote = canLogMeals(activeLogger?.permissionLevel);

  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [range, setRange] = useState<ReportRange>("daily");
  const [noteText, setNoteText] = useState("");
  const [allergies, setAllergies] = useState("");
  const [prefs, setPrefs] = useState("");
  const [avoid, setAvoid] = useState("");
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [fiber, setFiber] = useState(0);
  const [calories, setCalories] = useState(0);
  const [waterGoal, setWaterGoal] = useState(0);
  const [personality, setPersonality] = useState<Personality>("playful");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!member) return;
    setAllergies(member.allergies.join(", "));
    setPrefs(member.dietaryPreferences.join(", "));
    setAvoid(member.foodsToAvoid.join(", "));
    setProtein(member.nutritionGoals.protein);
    setCarbs(member.nutritionGoals.carbs);
    setFat(member.nutritionGoals.fat);
    setFiber(member.nutritionGoals.fiber);
    setCalories(member.nutritionGoals.calories);
    setWaterGoal(member.nutritionGoals.waterGlasses);
    setPersonality(
      member.personality ?? defaultPersonality(member.name, member.role, member.age),
    );
  }, [member]);

  const activityByDay = useMemo(() => {
    if (!member) return {};
    const map: Record<string, number> = {};
    for (const day of weekDayKeys(selectedDay)) {
      map[day] = mealsForMemberToday(meals, member.id, day).length;
    }
    return map;
  }, [meals, member, selectedDay]);

  if (!member) {
    return (
      <div className="space-y-4 pb-28">
        <button
          type="button"
          onClick={onBack}
          className="btn-bounce text-sm font-semibold text-[var(--forest-deep)]"
        >
          ← Back to family
        </button>
        <p className="rounded-2xl bg-white/75 px-4 py-8 text-center text-[var(--muted)]">
          That person isn’t in the household anymore.
        </p>
      </div>
    );
  }

  const dayMeals =
    range === "weekly"
      ? mealsForMemberInWeek(meals, member.id, selectedDay)
      : mealsForMemberToday(meals, member.id, selectedDay);
  const totals = dailyTotals(dayMeals);
  const displayTotals =
    range === "weekly" ? averagesFromTotals(totals, 7) : totals;
  const goals = member.nutritionGoals;
  const water = waterForMember(waterLogs, member.id, selectedDay);
  const missing =
    range === "daily" ? missingMealsForMember(meals, member.id, selectedDay) : [];
  const resolvedPersonality = resolvePersonality({ ...member, personality });
  const memberNotes = notes.filter((n) => n.memberId === member.id);
  const weekSummary = weeklyPatternSummary(member, meals);
  const accent = member.avatarColor || "#0d9f6e";
  const isToday = selectedDay === todayKey();
  const sortedMeals = [...dayMeals].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));

  function saveProfile() {
    updateMember(member!.id, {
      allergies: splitList(allergies),
      dietaryPreferences: splitList(prefs),
      foodsToAvoid: splitList(avoid),
      personality,
      nutritionGoals: {
        ...member!.nutritionGoals,
        protein,
        carbs,
        fat,
        fiber,
        calories,
        waterGlasses: waterGoal,
      },
      dailyCalorieTarget: calories,
    });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  }

  function onAddNote(e: FormEvent) {
    e.preventDefault();
    if (!noteText.trim() || !canNote) return;
    addCaregiverNote({ memberId: member!.id, text: noteText.trim() });
    setNoteText("");
  }

  return (
    <div className="space-y-6 pb-28">
      <button
        type="button"
        onClick={onBack}
        className="btn-bounce inline-flex items-center gap-1 text-sm font-semibold text-[var(--forest-deep)]"
      >
        ← Family
      </button>

      <header
        className="profile-hero relative overflow-hidden rounded-[1.75rem] px-5 pb-6 pt-6 text-white"
        style={{
          background: `linear-gradient(145deg, ${accent} 0%, color-mix(in srgb, ${accent} 55%, #0a8a6a) 55%, #087a54 100%)`,
        }}
      >
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="relative flex items-center gap-4">
          <Avatar
            member={{ ...member, personality }}
            size={88}
            className="ring-4 ring-white/35"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">
              {PERSONALITY_LABELS[resolvedPersonality]}
            </p>
            <h1 className="brand-pop font-[family-name:var(--font-display)] text-4xl tracking-tight">
              {member.name}
            </h1>
            <p className="mt-1 text-sm text-white/85">
              {roleLabel(member.role)} · {member.age}y ·{" "}
              {ageBandLabel(ageBandForAge(member.age))}
              {member.permissionLevel ? ` · ${permissionLabel(member.permissionLevel)}` : ""}
            </p>
          </div>
        </div>
      </header>

      <section className="section-in space-y-3 rounded-[1.5rem] bg-white/70 p-4">
        <WeekCalendar
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          range={range}
          onRangeChange={setRange}
          activityByDay={activityByDay}
        />
      </section>

      <section className="section-in space-y-4" style={{ animationDelay: "60ms" }}>
        <div className="flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--berry)]">
              {range === "weekly" ? "Week avg" : isToday ? "Today" : "Day"}
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {member.name}&apos;s bites
            </h2>
          </div>
          <CalorieRing
            current={displayTotals.calories}
            target={goals.calories}
            size={78}
          />
        </div>

        {missing.length > 0 ? (
          <p className="rounded-2xl border border-[var(--citrus)]/45 bg-[#FFF8E8] px-4 py-2.5 text-sm text-[var(--ink)]">
            Open: <span className="font-semibold capitalize">{missing.join(", ")}</span>
          </p>
        ) : null}

        <MacroSummaryChips
          protein={displayTotals.protein}
          carbs={displayTotals.carbs}
          fat={displayTotals.fat}
          fiber={displayTotals.fiber}
          proteinMax={goals.protein}
          carbsMax={goals.carbs}
          fatMax={goals.fat}
          fiberMax={goals.fiber}
        />

        <div className="flex items-center justify-between gap-3 rounded-[1.35rem] bg-white/75 px-4 py-3">
          <div className="text-sm text-[var(--muted)]">
            <p>
              Water{" "}
              <span className="font-semibold text-[var(--ink)]">
                {water}/{goals.waterGlasses}
              </span>
            </p>
            <p className="mt-0.5">
              Fruit {displayTotals.fruitServings ?? 0}/{goals.fruitServings}
              {" · "}
              Veg {displayTotals.vegServings ?? 0}/{goals.vegServings}
            </p>
          </div>
          {isToday && range === "daily" && (
            <button
              type="button"
              onClick={() => bumpWater(member.id)}
              className="btn-bounce rounded-2xl bg-[var(--mist)] px-3 py-2 text-xs font-bold text-[var(--forest-deep)]"
            >
              + water
            </button>
          )}
        </div>
      </section>

      <section className="section-in space-y-3" style={{ animationDelay: "100ms" }}>
        <div className="flex items-baseline justify-between px-1">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Meals
          </h2>
          <span className="text-xs text-[var(--muted)]">{sortedMeals.length}</span>
        </div>
        {sortedMeals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No meals for this {range === "weekly" ? "week" : "day"}.
          </p>
        ) : (
          <ul className="space-y-2">
            {sortedMeals.map((meal) => (
              <li key={meal.id}>
                <BiteCard meal={meal} member={member} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-in space-y-2" style={{ animationDelay: "140ms" }}>
        <h2 className="px-1 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Week pattern
        </h2>
        <p className="rounded-2xl bg-white/75 px-4 py-3 text-sm leading-relaxed text-[var(--ink)]">
          {weekSummary}
        </p>
      </section>

      {(member.allergies.length > 0 ||
        member.foodsToAvoid.length > 0 ||
        member.dietaryPreferences.length > 0) && (
        <section className="section-in flex flex-wrap gap-2 px-1" style={{ animationDelay: "160ms" }}>
          {[
            ...member.allergies.map((a) => `Allergy · ${a}`),
            ...member.foodsToAvoid.map((f) => `Avoid · ${f}`),
            ...member.dietaryPreferences.map((p) => p),
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--mist)] px-3 py-1 text-xs font-semibold text-[var(--forest-deep)]"
            >
              {tag}
            </span>
          ))}
        </section>
      )}

      <section
        className="section-in space-y-3 rounded-[1.75rem] bg-white/80 p-5"
        style={{ animationDelay: "180ms" }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl">Personality</h2>
        <div className="flex flex-wrap gap-2">
          {PERSONALITIES.map((p) => (
            <button
              key={p}
              type="button"
              disabled={!canEdit}
              onClick={() => setPersonality(p)}
              className={`btn-bounce rounded-2xl px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${
                personality === p
                  ? "bg-[var(--forest)] text-white"
                  : "bg-[var(--mist)] text-[var(--forest-deep)]"
              }`}
            >
              {PERSONALITY_LABELS[p]}
            </button>
          ))}
        </div>
      </section>

      <section
        className="section-in space-y-3 rounded-[1.75rem] bg-white/80 p-5"
        style={{ animationDelay: "200ms" }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl">Dietary notes</h2>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Allergies</span>
          <input
            value={allergies}
            disabled={!canEdit}
            onChange={(e) => setAllergies(e.target.value)}
            className="w-full rounded-2xl border border-[var(--line)] px-4 py-3 disabled:opacity-50"
            placeholder="peanuts, dairy…"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Preferences</span>
          <input
            value={prefs}
            disabled={!canEdit}
            onChange={(e) => setPrefs(e.target.value)}
            className="w-full rounded-2xl border border-[var(--line)] px-4 py-3 disabled:opacity-50"
            placeholder="mild spices, vegetarian-friendly…"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Foods to avoid</span>
          <input
            value={avoid}
            disabled={!canEdit}
            onChange={(e) => setAvoid(e.target.value)}
            className="w-full rounded-2xl border border-[var(--line)] px-4 py-3 disabled:opacity-50"
          />
        </label>
      </section>

      <section
        className="section-in space-y-3 rounded-[1.75rem] bg-white/80 p-5"
        style={{ animationDelay: "220ms" }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl">Goals</h2>
        <div className="grid grid-cols-2 gap-3">
          <Num label="Calories" value={calories} set={setCalories} disabled={!canEdit} />
          <Num label="Protein (g)" value={protein} set={setProtein} disabled={!canEdit} />
          <Num label="Carbs (g)" value={carbs} set={setCarbs} disabled={!canEdit} />
          <Num label="Fats (g)" value={fat} set={setFat} disabled={!canEdit} />
          <Num label="Fiber (g)" value={fiber} set={setFiber} disabled={!canEdit} />
          <Num label="Water (glasses)" value={waterGoal} set={setWaterGoal} disabled={!canEdit} />
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={saveProfile}
            className="btn-bounce w-full rounded-2xl bg-[var(--forest)] py-3 text-sm font-semibold text-white"
          >
            {savedFlash ? "Saved" : "Save profile"}
          </button>
        )}
      </section>

      <section className="section-in space-y-3" style={{ animationDelay: "240ms" }}>
        <h2 className="px-1 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Notes
        </h2>
        {memberNotes.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No caregiver notes yet.</p>
        ) : (
          <ul className="space-y-2">
            {memberNotes.slice(0, 6).map((n) => {
              const author = members.find((m) => m.id === n.authorId);
              return (
                <li key={n.id} className="rounded-2xl bg-white/75 px-4 py-3 text-sm">
                  <p className="text-[var(--ink)]">{n.text}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {author?.name ?? "Someone"} · {formatTime(n.createdAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        <form onSubmit={onAddNote} className="space-y-2">
          <textarea
            value={noteText}
            disabled={!canNote}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            placeholder='e.g. "Ate only half lunch"'
            className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!canNote || !noteText.trim()}
            className="btn-bounce w-full rounded-2xl bg-[var(--citrus)] py-3 text-sm font-semibold text-[var(--ink)] disabled:opacity-40"
          >
            Add note
          </button>
        </form>
      </section>

      {member.role !== "child" && (
        <button
          type="button"
          onClick={() => setActiveLoggerId(member.id)}
          className="btn-bounce w-full rounded-2xl bg-[var(--mist)] py-3 text-sm font-bold text-[var(--forest-deep)]"
        >
          {activeLoggerId === member.id
            ? `Logging as ${member.name}`
            : `Use ${member.name} to log meals`}
        </button>
      )}

      {canEdit && (
        <button
          type="button"
          onClick={() => {
            removeMember(member.id);
            onBack();
          }}
          className="w-full text-sm text-[#9B2226] underline-offset-2 hover:underline"
        >
          Remove from household
        </button>
      )}
    </div>
  );
}

function Num({
  label,
  value,
  set,
  disabled,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <input
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => set(Number(e.target.value))}
        className="w-full rounded-2xl border border-[var(--line)] px-3 py-2.5 disabled:opacity-50"
      />
    </label>
  );
}

function splitList(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
