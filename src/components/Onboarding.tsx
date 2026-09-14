"use client";

import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { BiteLogo } from "@/components/BiteLogo";
import { useFamily } from "@/context/FamilyContext";
import { isAuthConfigured } from "@/lib/auth-config";
import { defaultGoals } from "@/lib/nutrition";
import type { FamilyMember, MemberRole, NutritionGoals } from "@/lib/types";

type Draft = {
  name: string;
  age: number;
  role: MemberRole;
  preferredLanguage: string;
  allergies: string;
  foodsToAvoid: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  age: 8,
  role: "child",
  preferredLanguage: "en",
  allergies: "",
  foodsToAvoid: "",
});

type Step = "welcome" | "family" | "goals" | "camera";

export function Onboarding() {
  const { completeOnboarding, skipOnboardingWithDemo } = useFamily();
  const authOn = isAuthConfigured();
  const [step, setStep] = useState<Step>("welcome");
  const [familyName, setFamilyName] = useState("Our family");
  const [adult, setAdult] = useState<Draft>({
    name: "",
    age: 34,
    role: "parent",
    preferredLanguage: "en",
    allergies: "",
    foodsToAvoid: "",
  });
  const [kids, setKids] = useState<Draft[]>([emptyDraft()]);
  const [goals, setGoals] = useState<NutritionGoals>(() => defaultGoals(34, "parent"));

  const previewAge = adult.age || 34;

  function autoGenerate() {
    const focusAge = kids.find((k) => k.name.trim())?.age ?? previewAge;
    const focusRole: MemberRole = kids.some((k) => k.name.trim()) ? "child" : "parent";
    setGoals(defaultGoals(focusAge, focusRole));
  }

  function bump(key: keyof NutritionGoals, delta: number) {
    setGoals((g) => ({
      ...g,
      [key]: Math.max(0, Math.round((Number(g[key]) + delta) * 10) / 10),
    }));
  }

  function finish() {
    const members: Omit<FamilyMember, "id" | "avatarColor">[] = [];
    if (adult.name.trim()) {
      const g = { ...goals };
      members.push({
        name: adult.name.trim(),
        age: adult.age,
        role: "parent",
        preferredLanguage: adult.preferredLanguage,
        allergies: splitList(adult.allergies),
        dietaryPreferences: [],
        foodsToAvoid: splitList(adult.foodsToAvoid),
        nutritionGoals: g,
        dailyCalorieTarget: g.calories,
        permissionLevel: "admin",
        canReceiveNotifications: true,
      });
    }
    for (const kid of kids) {
      if (!kid.name.trim()) continue;
      const kidGoals = defaultGoals(kid.age, "child");
      members.push({
        name: kid.name.trim(),
        age: kid.age,
        role: "child",
        preferredLanguage: kid.preferredLanguage,
        allergies: splitList(kid.allergies),
        dietaryPreferences: [],
        foodsToAvoid: splitList(kid.foodsToAvoid),
        nutritionGoals: kidGoals,
        dailyCalorieTarget: kidGoals.calories,
        canReceiveNotifications: false,
      });
    }
    if (members.length === 0) {
      skipOnboardingWithDemo();
      return;
    }
    // Apply parent goals from adjust-goals screen
    if (members[0]?.role === "parent") {
      members[0] = {
        ...members[0],
        nutritionGoals: goals,
        dailyCalorieTarget: goals.calories,
      };
    }
    completeOnboarding(members, { householdName: familyName });
  }

  const stepIndex = useMemo(() => {
    const order: Step[] = ["welcome", "family", "goals", "camera"];
    return order.indexOf(step);
  }, [step]);

  return (
    <div className="scan-shell relative mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col bg-[#121212] text-white">
      <header className="flex items-center justify-between px-5 pb-2 pt-6">
        {step !== "welcome" ? (
          <button
            type="button"
            onClick={() => {
              if (step === "family") setStep("welcome");
              else if (step === "goals") setStep("family");
              else if (step === "camera") setStep("goals");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            aria-label="Back"
          >
            <BackIcon />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <BiteLogo size={36} showDots={false} animated />
            <span className="font-[family-name:var(--font-display)] text-xl">Bite</span>
          </div>
        )}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
          aria-label="Notifications"
        >
          <BellIcon />
        </button>
      </header>

      <div className="px-5 pb-3">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-[var(--coral)]" : "bg-white/15"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {step === "welcome" && (
          <section className="flex flex-1 flex-col px-5 pb-8 pt-4">
            <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight">
              Welcome to Bite
            </h1>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/65">
              Snap meals for the whole family. We’ll estimate nutrition, ask when unsure, and keep
              language warm — never judgmental.
            </p>
            {authOn && <OnboardingAccountNote />}
            <label className="mt-8 block space-y-2 text-sm">
              <span className="text-white/55">Household nickname</span>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full rounded-2xl border-0 bg-white/10 px-4 py-3.5 text-white outline-none ring-0 placeholder:text-white/35 focus:bg-white/15"
                placeholder="Our family"
              />
            </label>
            <div className="mt-auto space-y-3 pt-10">
              <button
                type="button"
                onClick={() => setStep("family")}
                className="w-full rounded-[1.35rem] bg-[var(--coral)] py-4 text-base font-bold text-white"
              >
                Get started
              </button>
              {!authOn && (
                <button
                  type="button"
                  onClick={skipOnboardingWithDemo}
                  className="w-full py-2 text-sm font-medium text-white/55 underline-offset-2 hover:underline"
                >
                  Skip — try demo household
                </button>
              )}
            </div>
          </section>
        )}

        {step === "family" && (
          <section className="flex flex-1 flex-col">
            <div className="px-5 pb-4">
              <h1 className="font-[family-name:var(--font-display)] text-3xl">Your household</h1>
              <p className="mt-1 text-sm text-white/55">Parents, kids, and caregivers you cook for.</p>
            </div>
            <div className="flex flex-1 flex-col rounded-t-[2rem] bg-white px-5 pb-10 pt-6 text-[var(--ink)]">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">You</h2>
              <div className="mt-3 space-y-3">
                <FieldLight
                  label="Name"
                  value={adult.name}
                  onChange={(v) => setAdult({ ...adult, name: v })}
                  placeholder="Maya"
                />
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-sm">
                    <span className="text-[var(--muted)]">Age</span>
                    <input
                      type="number"
                      value={adult.age}
                      onChange={(e) => {
                        const age = Number(e.target.value);
                        setAdult({ ...adult, age });
                        setGoals(defaultGoals(age || 34, "parent"));
                      }}
                      className="w-full rounded-2xl border border-[#ececec] bg-[#f7f7f7] px-3 py-2.5 outline-none"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-[var(--muted)]">Language</span>
                    <select
                      value={adult.preferredLanguage}
                      onChange={(e) => setAdult({ ...adult, preferredLanguage: e.target.value })}
                      className="w-full rounded-2xl border border-[#ececec] bg-[#f7f7f7] px-3 py-2.5 outline-none"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="ta">Tamil</option>
                      <option value="bn">Bengali</option>
                    </select>
                  </label>
                </div>
              </div>

              <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-[var(--muted)]">
                Children
              </h2>
              <div className="mt-3 space-y-3">
                {kids.map((kid, idx) => (
                  <div key={idx} className="space-y-2 rounded-2xl bg-[#f7f7f7] p-3">
                    <FieldLight
                      label="Name"
                      value={kid.name}
                      onChange={(v) =>
                        setKids((prev) => prev.map((k, i) => (i === idx ? { ...k, name: v } : k)))
                      }
                      placeholder="Kira"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1 text-sm">
                        <span className="text-[var(--muted)]">Age</span>
                        <input
                          type="number"
                          value={kid.age}
                          onChange={(e) =>
                            setKids((prev) =>
                              prev.map((k, i) =>
                                i === idx ? { ...k, age: Number(e.target.value) } : k,
                              ),
                            )
                          }
                          className="w-full rounded-2xl border border-white bg-white px-3 py-2.5 outline-none"
                        />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="text-[var(--muted)]">Allergies</span>
                        <input
                          value={kid.allergies}
                          onChange={(e) =>
                            setKids((prev) =>
                              prev.map((k, i) =>
                                i === idx ? { ...k, allergies: e.target.value } : k,
                              ),
                            )
                          }
                          placeholder="peanuts"
                          className="w-full rounded-2xl border border-white bg-white px-3 py-2.5 outline-none"
                        />
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setKids((prev) => [...prev, emptyDraft()])}
                  className="w-full rounded-2xl border border-dashed border-[#d0d0d0] py-2.5 text-sm font-semibold text-[var(--muted)]"
                >
                  + Another child
                </button>
              </div>

              <button
                type="button"
                disabled={!adult.name.trim()}
                onClick={() => {
                  setGoals(defaultGoals(adult.age || 34, "parent"));
                  setStep("goals");
                }}
                className="mt-8 w-full rounded-[1.35rem] bg-[var(--coral)] py-4 text-base font-bold text-white disabled:opacity-40"
              >
                Continue to goals
              </button>
            </div>
          </section>
        )}

        {step === "goals" && (
          <section className="flex flex-1 flex-col">
            <div className="px-5 pb-5">
              <h1 className="font-[family-name:var(--font-display)] text-3xl">Adjust goals</h1>
              <p className="mt-1 text-sm text-white/55">
                Calories, carbs, fats, and protein.
              </p>
            </div>
            <div className="flex flex-1 flex-col rounded-t-[2rem] bg-white px-5 pb-10 pt-6 text-[var(--ink)]">
              <div className="grid grid-cols-2 gap-3">
                <GoalCard
                  title="Calories"
                  value={goals.calories}
                  unit="kcal"
                  tone="dark"
                  icon={<FlameIcon />}
                  onDec={() => bump("calories", -50)}
                  onInc={() => bump("calories", 50)}
                />
                <GoalCard
                  title="Protein goal"
                  value={goals.protein}
                  unit="gram"
                  tone="lime"
                  icon={<BoltIcon />}
                  onDec={() => bump("protein", -5)}
                  onInc={() => bump("protein", 5)}
                />
                <GoalCard
                  title="Carb goal"
                  value={goals.carbs}
                  unit="gram"
                  tone="lilac"
                  icon={<LeafIcon />}
                  onDec={() => bump("carbs", -10)}
                  onInc={() => bump("carbs", 10)}
                />
                <GoalCard
                  title="Fat goal"
                  value={goals.fat}
                  unit="gram"
                  tone="butter"
                  icon={<CycleIcon />}
                  onDec={() => bump("fat", -2)}
                  onInc={() => bump("fat", 2)}
                />
              </div>

              <p className="mt-4 text-center text-xs text-[var(--muted)]">
                Starting estimates for {adult.name || "you"}
                {kids.some((k) => k.name.trim())
                  ? ` · kids get age-aware targets automatically`
                  : ""}
                . You can refine anytime.
              </p>

              <div className="mt-auto space-y-3 pt-8">
                <button
                  type="button"
                  onClick={autoGenerate}
                  className="w-full rounded-[1.35rem] bg-[var(--coral)] py-4 text-base font-bold text-white"
                >
                  Auto generate goals
                </button>
                <button
                  type="button"
                  onClick={() => setStep("camera")}
                  className="w-full rounded-[1.35rem] bg-[#f2f2f2] py-4 text-base font-bold text-[var(--ink)]"
                >
                  Continue
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "camera" && (
          <section className="relative flex flex-1 flex-col px-5 pb-10 pt-2">
            <h1 className="font-[family-name:var(--font-display)] text-3xl">Almost ready</h1>
            <p className="mt-2 text-sm text-white/55">
              Bite uses the camera to identify meals. You can change this later in system settings.
            </p>

            <div className="relative mt-8 flex flex-1 items-center justify-center">
              <div className="absolute inset-0 rounded-[2rem] bg-white/5" />
              <div className="relative z-10 w-full max-w-sm rounded-[1.75rem] bg-white p-5 text-center text-[var(--ink)] shadow-2xl">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2f2f2]">
                  <CameraGlyph />
                </div>
                <p className="text-[15px] font-semibold leading-snug">
                  Allow Bite to take pictures and record video?
                </p>
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={finish}
                    className="w-full rounded-2xl bg-[var(--coral)] py-3.5 text-sm font-bold text-white"
                  >
                    While using the app
                  </button>
                  <button
                    type="button"
                    onClick={finish}
                    className="w-full rounded-2xl bg-[#eef1f4] py-3.5 text-sm font-semibold text-[var(--ink)]"
                  >
                    Only this time
                  </button>
                  <button
                    type="button"
                    onClick={finish}
                    className="w-full py-3 text-sm font-medium text-[var(--muted)]"
                  >
                    Don&apos;t allow
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-white/40">
              Estimates only — not a substitute for a doctor or dietitian. Family data stays on this
              device in the demo.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function GoalCard({
  title,
  value,
  unit,
  tone,
  icon,
  onDec,
  onInc,
}: {
  title: string;
  value: number;
  unit: string;
  tone: "dark" | "lime" | "lilac" | "butter";
  icon: React.ReactNode;
  onDec: () => void;
  onInc: () => void;
}) {
  const tones = {
    dark: "bg-[#1c1c1c] text-white",
    lime: "bg-[#d8f5a2] text-[#1a2f28]",
    lilac: "bg-[#e4d7ff] text-[#2a1f3d]",
    butter: "bg-[#ffe9a8] text-[#3a2f12]",
  };
  return (
    <div className={`relative flex min-h-[148px] flex-col justify-between rounded-[1.6rem] p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between">
        <span className="opacity-80">{icon}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onDec}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-sm font-bold"
            aria-label={`Decrease ${title}`}
          >
            −
          </button>
          <button
            type="button"
            onClick={onInc}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-sm font-bold"
            aria-label={`Increase ${title}`}
          >
            +
          </button>
        </div>
      </div>
      <div>
        <p className="font-[family-name:var(--font-display)] text-3xl tabular-nums leading-none">
          {value}
          <span className="ml-1 text-sm font-semibold opacity-70">{unit}</span>
        </p>
        <p className="mt-1 text-sm font-medium opacity-75">{title}</p>
      </div>
    </div>
  );
}

function FieldLight({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#ececec] bg-[#f7f7f7] px-4 py-3 outline-none focus:border-[var(--coral)]"
      />
    </label>
  );
}

function OnboardingAccountNote() {
  const { user } = useUser();
  const { cloudSyncStatus } = useFamily();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email) return null;
  return (
    <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
      Signed in as <span className="font-semibold text-white">{email}</span>
      <span className="mt-1 block text-xs text-white/50">
        {cloudSyncStatus === "error"
          ? "Cloud sync unavailable — data stays on this device until storage is configured."
          : "Your household saves to your account as you go."}
      </span>
    </p>
  );
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3s4 4 4 8a4 4 0 1 1-8 0c0-2 2-4 2-4s1 2 2 3c0-4 0-7 0-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2 4 14h7l-1 8 10-14h-7l0-6Z" fill="currentColor" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 14c6 0 10-5 12-11-6 1-12 5-12 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M7 17c3-1 6-4 8-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CycleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12a8 8 0 0 1 13-6l2-2v6h-6l2.2-2.2A6 6 0 1 0 18 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l1.2-1.8A1 1 0 0 1 10.5 4h3a1 1 0 0 1 .8.4L15.5 6h2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
