"use client";

import { useMemo } from "react";
import { useFamily } from "@/context/FamilyContext";
import { Avatar } from "@/components/Avatar";
import { HomeLogoButton } from "@/components/HomeLogoButton";
import { buildMealSuggestions } from "@/lib/insights";

export function MealPlanner({ onHome }: { onHome?: () => void }) {
  const { members, meals, ready } = useFamily();

  const suggestions = useMemo(
    () => buildMealSuggestions(members, meals),
    [members, meals],
  );

  const pantryHints = [
    "dal + rice",
    "roti flour",
    "seasonal veg",
    "dahi / curd",
    "eggs or paneer",
    "fruit for snacks",
  ];

  if (!ready) return <div className="p-6 text-[var(--muted)]">Loading…</div>;

  return (
    <div className="space-y-7 pb-28">
      <header className="space-y-2 px-1">
        {onHome && <HomeLogoButton onHome={onHome} size={34} />}
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral)]">
          Plan
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Practical meal ideas
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Based on recent logs, gaps, and local home cooking — not a strict diet plan.
        </p>
      </header>

      <section className="rounded-[1.75rem] bg-gradient-to-br from-[var(--forest)] to-[#0a8a6a] p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lime)]">
          Tonight’s vibe
        </p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-2xl">
          Keep it simple and familiar
        </p>
        <p className="mt-2 text-sm text-white/80">
          Suggestions favour school lunches, mild spices, and meals caregivers can finish in under
          35 minutes.
        </p>
      </section>

      <section className="space-y-3">
        {suggestions.map((s) => {
          const forWho = members.filter((m) => s.forMemberIds.includes(m.id));
          return (
            <article
              key={s.id}
              className="rounded-[1.5rem] bg-white/80 p-4 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {s.mealType} · ~{s.estimatedMinutes} min
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                    {s.title}
                  </h2>
                </div>
                <div className="flex -space-x-2">
                  {forWho.slice(0, 3).map((m) => (
                    <Avatar key={m.id} member={m} size={28} className="ring-2 ring-white" />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{s.reason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--mist)] px-2.5 py-1 text-xs font-medium text-[var(--forest-deep)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-[1.75rem] border border-dashed border-[var(--line)] p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Handy staples</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ideas assume a typical Indian home pantry. Adjust for your allergies and preferences.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {pantryHints.map((h) => (
            <span
              key={h}
              className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--ink)]"
            >
              {h}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Always cross-check allergens on each profile before cooking for the kids.
        </p>
      </section>
    </div>
  );
}
