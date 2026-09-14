"use client";

import { useState, type FormEvent } from "react";
import { useFamily } from "@/context/FamilyContext";
import { Avatar } from "@/components/Avatar";
import { HomeLogoButton } from "@/components/HomeLogoButton";
import { MemberProfile } from "@/components/MemberProfile";
import { canEditProfiles } from "@/lib/insights";
import { calorieTargetForAge, defaultGoals, roleLabel } from "@/lib/nutrition";
import {
  PERSONALITIES,
  PERSONALITY_LABELS,
  ageBandForAge,
  ageBandLabel,
  defaultPersonality,
} from "@/lib/pixelCharacter";
import type { MemberRole, Personality } from "@/lib/types";

export function FamilyManager({
  focusMemberId = null,
  onOpenMember,
  onClearedFocus,
  onHome,
}: {
  focusMemberId?: string | null;
  onOpenMember?: (id: string) => void;
  onClearedFocus?: () => void;
  onHome?: () => void;
}) {
  const {
    members,
    householdName,
    addMember,
    activeLogger,
    activeLoggerId,
    setActiveLoggerId,
  } = useFamily();
  const [name, setName] = useState("");
  const [age, setAge] = useState(8);
  const [role, setRole] = useState<MemberRole>("child");
  const [lang, setLang] = useState("en");
  const [personality, setPersonality] = useState<Personality>("playful");

  const canEdit = canEditProfiles(activeLogger?.permissionLevel);
  const viewingId =
    focusMemberId && members.some((m) => m.id === focusMemberId) ? focusMemberId : null;

  function openProfile(id: string) {
    onOpenMember?.(id);
  }

  function onRoleChange(next: MemberRole) {
    setRole(next);
    const nextAge = next === "child" ? 6 : next === "grandparent" ? 68 : 35;
    setAge(nextAge);
    setPersonality(defaultPersonality(name || "Friend", next, nextAge));
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !canEdit) return;
    const goals = defaultGoals(age, role);
    addMember({
      name: name.trim(),
      age,
      role,
      preferredLanguage: lang,
      personality,
      dailyCalorieTarget: calorieTargetForAge(age, role),
      nutritionGoals: goals,
      allergies: [],
      dietaryPreferences: [],
      foodsToAvoid: [],
    });
    setName("");
    setAge(role === "child" ? 6 : 35);
    setPersonality(defaultPersonality("Friend", role, role === "child" ? 6 : 35));
  }

  if (viewingId) {
    return <MemberProfile memberId={viewingId} onBack={() => onClearedFocus?.()} />;
  }

  return (
    <div className="space-y-8 pb-28">
      <header className="space-y-2 px-1">
        {onHome && <HomeLogoButton onHome={onHome} size={34} />}
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral)]">
          {householdName || "Family"}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          People who eat here
        </h1>
        <p className="text-[var(--muted)]">
          Each person has their own saved profile — tap to edit. Changes auto-save on this device.
        </p>
      </header>

      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => openProfile(m.id)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white/75 px-4 py-3 text-left backdrop-blur-sm"
            >
              <Avatar member={m} size={52} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[var(--ink)]">
                  {m.name}
                  {activeLoggerId === m.id && m.role !== "child" && (
                    <span className="ml-2 text-xs font-semibold text-[var(--forest)]">
                      logging
                    </span>
                  )}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {roleLabel(m.role)} · {ageBandLabel(ageBandForAge(m.age))} ·{" "}
                  {m.nutritionGoals.calories} kcal
                  {m.allergies.length ? ` · ${m.allergies.length} allerg.` : ""}
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--forest)]">Open profile →</p>
              </div>
              {m.role !== "child" && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLoggerId(m.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      setActiveLoggerId(m.id);
                    }
                  }}
                  className="btn-bounce rounded-full bg-[var(--mist)] px-3 py-1.5 text-xs font-bold text-[var(--forest-deep)]"
                >
                  Use
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={onAdd}
        className="space-y-4 rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] p-5"
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl">Add someone</h2>
        {!canEdit && (
          <p className="text-xs text-[var(--muted)]">
            Only admins/editors can add members — see Settings → Permissions.
          </p>
        )}
        <div className="flex items-center gap-3">
          <Avatar
            member={{
              name: name || "New",
              age,
              role,
              avatarColor: "#0d9f6e",
              personality,
            }}
            size={56}
          />
          <p className="text-sm text-[var(--muted)]">
            Preview · {ageBandLabel(ageBandForAge(age))} · {PERSONALITY_LABELS[personality]}
          </p>
        </div>
        <input
          value={name}
          disabled={!canEdit}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none disabled:opacity-50"
        />
        <div className="grid grid-cols-3 gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-[var(--muted)]">Age</span>
            <input
              type="number"
              min={1}
              max={100}
              value={age}
              disabled={!canEdit}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full rounded-2xl border border-[var(--line)] px-3 py-2.5"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--muted)]">Role</span>
            <select
              value={role}
              disabled={!canEdit}
              onChange={(e) => onRoleChange(e.target.value as MemberRole)}
              className="w-full rounded-2xl border border-[var(--line)] px-3 py-2.5"
            >
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="caretaker">Caregiver</option>
              <option value="grandparent">Grandparent</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--muted)]">Language</span>
            <select
              value={lang}
              disabled={!canEdit}
              onChange={(e) => setLang(e.target.value)}
              className="w-full rounded-2xl border border-[var(--line)] px-3 py-2.5"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="bn">Bengali</option>
            </select>
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm text-[var(--muted)]">Personality</legend>
          <div className="flex flex-wrap gap-2">
            {PERSONALITIES.map((p) => (
              <button
                key={p}
                type="button"
                disabled={!canEdit}
                onClick={() => setPersonality(p)}
                className={`btn-bounce rounded-2xl px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${
                  personality === p
                    ? "bg-[var(--coral)] text-white"
                    : "bg-[var(--mist)] text-[var(--forest-deep)]"
                }`}
              >
                {PERSONALITY_LABELS[p]}
              </button>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={!canEdit}
          className="btn-bounce w-full rounded-2xl bg-[var(--forest)] py-3 text-sm font-bold text-white disabled:opacity-40"
        >
          Add to family
        </button>
      </form>
    </div>
  );
}
