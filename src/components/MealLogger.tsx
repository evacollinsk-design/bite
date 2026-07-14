"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useFamily } from "@/context/FamilyContext";
import { Avatar } from "@/components/Avatar";
import { BiteLoader } from "@/components/BiteLogo";
import { HomeLogoButton } from "@/components/HomeLogoButton";
import { VoiceTextInput } from "@/components/VoiceTextInput";
import { canLogMeals } from "@/lib/insights";
import { normalizeNutrition, roleLabel } from "@/lib/nutrition";
import type { AnalysisResult, MealType } from "@/lib/types";

type ScanMode = "scan" | "barcode" | "label" | "library";
type Step = "scan" | "assign" | "review";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const CAMERA_PREF_KEY = "bite-camera-pref";

export function MealLogger({
  onLogged,
  onHome,
}: {
  onLogged?: () => void;
  onHome?: () => void;
}) {
  const {
    members,
    activeLogger,
    activeLoggerId,
    setActiveLoggerId,
    addMeal,
    notificationPrefs,
  } = useFamily();
  const [step, setStep] = useState<Step>("scan");
  const [mode, setMode] = useState<ScanMode>("scan");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>(guessMealType());
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [source, setSource] = useState("");
  const [clarifyText, setClarifyText] = useState("");
  const [caregiverNote, setCaregiverNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [analyzing, setAnalyzing] = useState(false);
  const [showPermission, setShowPermission] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const pendingAction = useRef<"camera" | "library" | null>(null);

  const member = useMemo(
    () => (memberId ? members.find((m) => m.id === memberId) : undefined),
    [members, memberId],
  );
  const loggerLang = activeLogger?.preferredLanguage ?? "en";
  const allowed = canLogMeals(activeLogger?.permissionLevel);

  useEffect(() => {
    try {
      const pref = localStorage.getItem(CAMERA_PREF_KEY);
      if (pref === "allow" || pref === "once") setCameraAllowed(true);
    } catch {
      // ignore
    }
  }, []);

  async function analyzePhoto(dataUrl: string) {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: dataUrl,
          preferredLanguage: member?.preferredLanguage ?? loggerLang,
        }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setAnalysis(data);
      setSource(data.source ?? "demo");
      setMemberId(null);
      setStep("assign");
    } catch {
      setError("Couldn’t read that plate. Try another photo or describe it.");
    } finally {
      setAnalyzing(false);
    }
  }

  function onFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhoto(dataUrl);
      void analyzePhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function requestCapture(kind: "camera" | "library") {
    if (kind === "library") {
      libraryRef.current?.click();
      return;
    }
    if (cameraAllowed) {
      fileRef.current?.click();
      return;
    }
    pendingAction.current = kind;
    setShowPermission(true);
  }

  function respondPermission(choice: "allow" | "once" | "deny") {
    setShowPermission(false);
    try {
      if (choice === "allow") localStorage.setItem(CAMERA_PREF_KEY, "allow");
      if (choice === "once") localStorage.setItem(CAMERA_PREF_KEY, "once");
      if (choice === "deny") localStorage.setItem(CAMERA_PREF_KEY, "deny");
    } catch {
      // ignore
    }
    if (choice === "deny") {
      pendingAction.current = null;
      return;
    }
    setCameraAllowed(true);
    const next = pendingAction.current;
    pendingAction.current = null;
    if (next === "camera") fileRef.current?.click();
    if (next === "library") libraryRef.current?.click();
  }

  async function applyClarification(text: string) {
    if (!analysis || !text.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          items: analysis.items,
          nutrition: analysis.nutrition,
          preferredLanguage: member?.preferredLanguage ?? loggerLang,
        }),
      });
      if (!res.ok) throw new Error("Clarify failed");
      const data = await res.json();
      setAnalysis({
        ...analysis,
        items: data.items,
        nutrition: data.nutrition,
        confidence: data.confidence,
        needsClarification: (data.remainingQuestions?.length ?? 0) > 0,
        questions: data.remainingQuestions ?? [],
        summary: data.interpretation,
        summaryLocal: data.interpretationLocal,
        language: data.detectedLanguage,
      });
      setSource(data.source ?? source);
      setClarifyText("");
    } catch {
      setError("Couldn’t apply that correction. Try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  function saveMeal() {
    if (!analysis || !memberId || !activeLoggerId || !allowed) return;
    startTransition(() => {
      addMeal({
        memberId,
        mealType,
        loggedAt: new Date().toISOString(),
        loggedBy: activeLoggerId,
        photoDataUrl: photo ?? undefined,
        items: analysis.items,
        nutrition: normalizeNutrition(analysis.nutrition),
        confidence: analysis.confidence,
        clarified: Boolean(clarifyText) || analysis.confidence > 0.8,
        language: analysis.language,
        notes: clarifyText || analysis.summaryLocal || analysis.summary,
        caregiverNote: caregiverNote.trim() || undefined,
        incomplete: analysis.needsClarification && analysis.confidence < 0.7,
      });
      setStep("scan");
      setPhoto(null);
      setAnalysis(null);
      setMemberId(null);
      setClarifyText("");
      setCaregiverNote("");
      onLogged?.();
    });
  }

  function selectProfile(id: string) {
    setMemberId(id);
    setStep("review");
  }

  function selectMode(next: ScanMode) {
    setMode(next);
    if (next === "library") requestCapture("library");
    if (next === "scan") {
      // stay on scan — tap viewfinder / shutter to capture
    }
    if (next === "barcode" || next === "label") {
      setError("Coming soon — use Scan food or Library for now.");
    }
  }

  return (
    <div className="scan-shell relative min-h-[calc(100vh-5.5rem)] bg-[#121212] pb-28 text-white">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />

      {step === "scan" && (
        <div className="flex min-h-full flex-col px-4 pt-5">
          <header className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onHome && <HomeLogoButton onHome={onHome} light size={32} showWordmark={false} />}
              <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
                Scanner
              </h1>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
              aria-label="More"
            >
              <MoreIcon />
            </button>
          </header>

          {!allowed && (
            <p className="mb-3 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
              View-only account — ask a parent for “Can log” in Settings.
            </p>
          )}

          {/* Viewfinder */}
          <button
            type="button"
            disabled={!allowed || analyzing}
            onClick={() => requestCapture(mode === "library" ? "library" : "camera")}
            className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-[1.75rem] border-[3px] border-white bg-[#1a1a1a] disabled:opacity-60"
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Scan preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="rounded-full bg-white/10 p-4">
                  <ScanFrameIcon />
                </div>
                <p className="text-sm text-white/70">
                  Tap to {mode === "library" ? "choose from library" : "scan food"}
                </p>
                <p className="text-xs text-white/45">
                  We’ll ask whose plate it is after the scan.
                </p>
              </div>
            )}
            {(analyzing || photo) && <div className="scan-laser" aria-hidden />}
            {analyzing && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <BiteLoader
                  size={48}
                  label="Scanning meal…"
                  className="[&_p]:text-white/90"
                />
              </div>
            )}
          </button>

          {/* Mode chips */}
          <div className="mt-5 grid grid-cols-4 gap-2">
            <ModeChip
              active={mode === "scan"}
              label="Scan food"
              onClick={() => selectMode("scan")}
              icon={<AppleIcon />}
            />
            <ModeChip
              active={mode === "barcode"}
              label="Barcode"
              onClick={() => selectMode("barcode")}
              icon={<BarcodeIcon />}
            />
            <ModeChip
              active={mode === "label"}
              label="Food label"
              onClick={() => selectMode("label")}
              icon={<TagIcon />}
            />
            <ModeChip
              active={mode === "library"}
              label="Library"
              onClick={() => selectMode("library")}
              icon={<GalleryIcon />}
            />
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto">
            {MEAL_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMealType(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                  mealType === t ? "bg-white text-[#121212]" : "bg-white/10 text-white/70"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-[#ffe8e4] px-4 py-3 text-sm font-medium text-[#c23118]">
              {error}
            </p>
          )}
        </div>
      )}

      {step === "assign" && analysis && (
        <div className="flex min-h-full flex-col">
          <div className="relative h-44 overflow-hidden bg-black">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Scanned meal" className="h-full w-full object-cover opacity-90" />
            )}
            <div className="absolute left-4 top-4 flex items-center gap-2">
              {onHome && <HomeLogoButton onHome={onHome} light size={28} showWordmark={false} />}
              <button
                type="button"
                onClick={() => {
                  setStep("scan");
                  setPhoto(null);
                  setAnalysis(null);
                  setMemberId(null);
                }}
                className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white"
              >
                ← Rescan
              </button>
            </div>
            <div className="absolute bottom-3 left-4 right-4 rounded-2xl bg-black/55 px-3 py-2 text-sm backdrop-blur-sm">
              ~{analysis.nutrition.calories} kcal est. ·{" "}
              {analysis.items.map((i) => i.name).join(", ") || "Meal ready"}
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-t-[2rem] bg-white px-5 pb-10 pt-6 text-[var(--ink)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--coral)]">
              Log under
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl">
              Whose plate is this?
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Pick the family member this meal belongs to.
            </p>

            <ul className="mt-5 space-y-2">
              {members.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => selectProfile(m.id)}
                    className="flex w-full items-center gap-3 rounded-[1.35rem] border border-[#eee] bg-[#fafafa] px-4 py-3.5 text-left transition active:scale-[0.99]"
                  >
                    <Avatar member={m} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[var(--ink)]">{m.name}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {roleLabel(m.role)} · {m.nutritionGoals.calories} kcal goal
                      </p>
                      {notificationPrefs.allergyReminders &&
                        (m.allergies.length > 0 || m.foodsToAvoid.length > 0) && (
                          <p className="mt-0.5 truncate text-xs text-[var(--coral)]">
                            {[
                              ...m.allergies.map((a) => `allergy: ${a}`),
                              ...m.foodsToAvoid.map((f) => `avoid: ${f}`),
                            ].join(" · ")}
                          </p>
                        )}
                    </div>
                    <span className="text-lg text-[var(--muted)]">→</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Logged by
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {members
                  .filter((m) => m.role !== "child")
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveLoggerId(m.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        activeLoggerId === m.id
                          ? "bg-[var(--coral)] text-white"
                          : "bg-[#f2f2f2] text-[var(--muted)]"
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "review" && analysis && member && (
        <div className="flex min-h-full flex-col">
          <div className="relative h-52 overflow-hidden bg-black">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Logged meal" className="h-full w-full object-cover opacity-90" />
            )}
            <button
              type="button"
              onClick={() => setStep("assign")}
              className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white"
            >
              ← Change person
            </button>
            {onHome && (
              <div className="absolute right-4 top-4">
                <HomeLogoButton onHome={onHome} light size={28} showWordmark={false} />
              </div>
            )}
          </div>

          <div className="flex-1 rounded-t-[2rem] bg-white px-5 pb-10 pt-6 text-[var(--ink)]">
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[#f7f7f7] px-3 py-2">
              <Avatar member={member} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{member.name}</p>
                <p className="text-xs text-[var(--muted)] capitalize">{mealType} · estimate</p>
              </div>
              <button
                type="button"
                onClick={() => setStep("assign")}
                className="text-xs font-semibold text-[var(--coral)]"
              >
                Change
              </button>
            </div>
            {member &&
              notificationPrefs.allergyReminders &&
              (member.allergies.length > 0 || member.foodsToAvoid.length > 0) && (
                <p className="mb-3 rounded-2xl bg-[#ffe8e4] px-3 py-2 text-xs text-[#9b2226]">
                  {[
                    ...member.allergies.map((a) => `Allergy: ${a}`),
                    ...member.foodsToAvoid.map((f) => `Avoid: ${f}`),
                  ].join(" · ")}
                </p>
              )}
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--coral)]">
              Estimate
            </p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div>
                <p className="font-[family-name:var(--font-display)] text-4xl tabular-nums">
                  {analysis.nutrition.calories}
                  <span className="ml-1 text-base text-[var(--muted)]">kcal</span>
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  ~{analysis.nutrition.estimatedWeightGrams}g ·{" "}
                  {Math.round(analysis.confidence * 100)}% confidence
                  {source === "demo" ? " · demo AI" : " · live AI"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-center text-xs font-semibold">
                <MacroPill tone="lime" label="P" value={`${analysis.nutrition.protein}g`} />
                <MacroPill tone="lilac" label="C" value={`${analysis.nutrition.carbs}g`} />
                <MacroPill tone="butter" label="F" value={`${analysis.nutrition.fat}g`} />
                <MacroPill tone="mist" label="Fi" value={`${analysis.nutrition.fiber ?? 0}g`} />
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {analysis.items.map((item, idx) => (
                <li
                  key={`${item.name}-${idx}`}
                  className="flex items-center justify-between border-b border-[#eee] py-2 text-sm last:border-b-0"
                >
                  <span>
                    {item.name}
                    <span className="text-[var(--muted)]"> · {item.portion}</span>
                  </span>
                  <span className="font-bold text-[var(--coral)]">{item.calories}</span>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">
              {analysis.summaryLocal || analysis.summary}
            </p>

            {analysis.needsClarification && analysis.questions.length > 0 && (
              <div className="mt-4 space-y-3 rounded-2xl border border-[var(--citrus)]/50 bg-[#fff8e0] p-4">
                <p className="text-sm font-bold">Quick check</p>
                {analysis.questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm">{q.questionLocal || q.question}</p>
                    {q.options && (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => void applyClarification(opt)}
                            className="rounded-2xl bg-white px-3 py-1.5 text-xs font-semibold text-[var(--forest-deep)] shadow-sm"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold">Correct or add detail</p>
              <VoiceTextInput
                value={clarifyText}
                onChange={setClarifyText}
                preferredLanguage={member?.preferredLanguage ?? loggerLang}
                placeholder='e.g. "aloo paratha with very little oil, child ate only half"'
              />
              <button
                type="button"
                disabled={!clarifyText.trim() || analyzing || !allowed}
                onClick={() => void applyClarification(clarifyText)}
                className="w-full rounded-2xl border-2 border-[var(--ink)] py-3 text-sm font-bold disabled:opacity-40"
              >
                {analyzing ? "Updating…" : "Apply correction"}
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">Caregiver note</p>
              <textarea
                value={caregiverNote}
                onChange={(e) => setCaregiverNote(e.target.value)}
                rows={2}
                disabled={!allowed}
                placeholder='e.g. "Ate only half"'
                className="w-full rounded-2xl border border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 text-sm outline-none"
              />
            </div>

            {error && (
              <p className="mt-3 rounded-2xl bg-[#ffe8e4] px-4 py-3 text-sm text-[#c23118]">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={pending || !allowed}
              onClick={saveMeal}
              className="mt-6 w-full rounded-[1.35rem] bg-[var(--coral)] py-4 text-base font-bold text-white disabled:opacity-40"
            >
              Confirm for {member?.name ?? "family"}
            </button>
          </div>
        </div>
      )}

      {showPermission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6">
          <div className="relative w-full max-w-sm rounded-[1.75rem] bg-white p-5 text-center text-[var(--ink)] shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowPermission(false);
                pendingAction.current = null;
              }}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f2f2] text-sm"
              aria-label="Close"
            >
              ×
            </button>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2f2f2]">
              <CameraGlyph />
            </div>
            <p className="text-[15px] font-semibold leading-snug">
              Allow Bite to take pictures and record video?
            </p>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => respondPermission("allow")}
                className="w-full rounded-2xl bg-[var(--coral)] py-3.5 text-sm font-bold text-white"
              >
                While using the app
              </button>
              <button
                type="button"
                onClick={() => respondPermission("once")}
                className="w-full rounded-2xl bg-[#eef1f4] py-3.5 text-sm font-semibold"
              >
                Only this time
              </button>
              <button
                type="button"
                onClick={() => respondPermission("deny")}
                className="w-full py-3 text-sm font-medium text-[var(--muted)]"
              >
                Don&apos;t allow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeChip({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-[1.15rem] px-1 text-center transition ${
        active ? "bg-[#d8f5a2] text-[#1a2f28]" : "bg-white text-[#1a2f28]"
      }`}
    >
      <span className="opacity-80">{icon}</span>
      <span className="text-[10px] font-bold leading-tight">{label}</span>
    </button>
  );
}

function MacroPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "lime" | "lilac" | "butter" | "mist";
}) {
  const map = {
    lime: "bg-[#d8f5a2]",
    lilac: "bg-[#e4d7ff]",
    butter: "bg-[#ffe9a8]",
    mist: "bg-[#dff8ea]",
  };
  return (
    <div className={`rounded-xl px-2 py-1.5 ${map[tone]}`}>
      <div className="text-[10px] opacity-60">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function guessMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 18) return "snack";
  return "dinner";
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function ScanFrameIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 12h10" stroke="var(--coral)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 7c2-3 5-3 5-3s0 3-2 4M9 20c-3-1-4-5-3-9 2-1 4 0 6 0s4-1 6 0c1 4 0 8-3 9-1 1-2 0-3 0s-2 1-3 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarcodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6v12M7 6v12M9 6v12M12 6v12M15 6v12M18 6v12M20 6v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12V4h8l10 10-8 8L3 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m3 15 5-4 4 3 3-2 6 5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" />
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
