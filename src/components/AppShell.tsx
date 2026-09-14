"use client";

import { useCallback, useState } from "react";
import { BiteLoader, BiteMark } from "@/components/BiteLogo";
import { useFamily } from "@/context/FamilyContext";
import { Dashboard } from "@/components/Dashboard";
import { MealLogger } from "@/components/MealLogger";
import { FamilyManager } from "@/components/FamilyManager";
import { InsightsPanel } from "@/components/InsightsPanel";
import { MealPlanner } from "@/components/MealPlanner";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Onboarding } from "@/components/Onboarding";
import { AuthenticatedAppShell } from "@/components/AuthenticatedAppShell";
import { isAuthConfigured } from "@/lib/auth-config";
import type { AppTab } from "@/lib/types";

export function AppShell() {
  if (isAuthConfigured()) {
    return <AuthenticatedAppShell />;
  }
  return <AppShellCore />;
}

export function AppShellCore() {
  const { ready, onboardingComplete } = useFamily();
  const [tab, setTab] = useState<AppTab>("home");
  const [focusMemberId, setFocusMemberId] = useState<string | null>(null);

  const openMember = useCallback((id: string) => {
    setFocusMemberId(id);
    setTab("family");
  }, []);

  const clearFocus = useCallback(() => setFocusMemberId(null), []);

  const goHome = useCallback(() => {
    setFocusMemberId(null);
    setTab("home");
  }, []);

  const goTab = useCallback((next: AppTab) => {
    setTab(next);
    if (next !== "family") setFocusMemberId(null);
  }, []);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <BiteLoader size={64} label="Loading Bite…" />
      </div>
    );
  }

  if (!onboardingComplete) {
    return <Onboarding />;
  }

  const darkNav = tab === "log";

  return (
    <div
      className={`relative mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col ${
        tab === "log" ? "px-0 pt-0" : "px-4 pt-6"
      }`}
    >
      <main className="flex-1">
        {tab === "home" && (
          <Dashboard onOpenMember={openMember} onOpenPlan={() => goTab("plan")} />
        )}
        {tab === "insights" && <InsightsPanel />}
        {tab === "log" && <MealLogger onLogged={goHome} onHome={goHome} />}
        {tab === "family" && (
          <FamilyManager
            focusMemberId={focusMemberId}
            onOpenMember={openMember}
            onClearedFocus={clearFocus}
          />
        )}
        {tab === "settings" && (
          <SettingsPanel onOpenPlan={() => goTab("plan")} />
        )}
        {tab === "plan" && <MealPlanner />}
      </main>

      <nav
        className={`fixed bottom-0 left-0 right-0 z-20 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md ${
          darkNav
            ? "border-t border-white/10 bg-[rgba(18,18,18,0.92)]"
            : "border-t border-[var(--line)]/80 bg-[rgba(245,255,248,0.92)]"
        }`}
      >
        <div className="mx-auto flex max-w-lg items-end justify-between">
          <NavButton
            active={tab === "home"}
            onClick={goHome}
            label="Home"
            dark={darkNav}
          >
            <BiteMark size={22} animated={tab === "home"} />
          </NavButton>
          <NavButton
            active={tab === "insights"}
            onClick={() => goTab("insights")}
            label="Insights"
            dark={darkNav}
          >
            <InsightsIcon />
          </NavButton>
          <button
            type="button"
            onClick={() => goTab("log")}
            aria-label="Log meal"
            className="-mt-9 flex h-[4.25rem] w-[4.25rem] min-h-12 min-w-12 shrink-0 items-center justify-center rounded-[1.35rem] bg-[var(--coral)] text-white shadow-[0_10px_26px_-10px_rgba(255,92,58,0.7)] active:opacity-90"
          >
            <CameraIcon />
          </button>
          <NavButton
            active={tab === "family"}
            onClick={() => {
              clearFocus();
              goTab("family");
            }}
            label="Family"
            dark={darkNav}
          >
            <FamilyIcon />
          </NavButton>
          <NavButton
            active={tab === "settings" || tab === "plan"}
            onClick={() => goTab("settings")}
            label="Settings"
            dark={darkNav}
          >
            <SettingsIcon />
          </NavButton>
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  label,
  children,
  dark = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-bounce flex min-w-[58px] flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[10px] font-semibold ${
        active
          ? dark
            ? "bg-white/15 text-white"
            : "bg-[var(--mist)] text-[var(--forest-deep)]"
          : dark
            ? "text-white/55"
            : "text-[var(--muted)]"
      }`}
    >
      {children}
      {label}
    </button>
  );
}

function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l1.2-1.8A1 1 0 0 1 10.5 4h3a1 1 0 0 1 .8.4L15.5 6h2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 19V10M12 19V5M19 19v-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FamilyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="9" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 18c.5-2.8 2.6-4.5 5-4.5s4.5 1.7 5 4.5M13.5 18c.3-1.8 1.6-3 3.3-3 1.5 0 2.7.9 3.2 2.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M4.6 7.5l1.9 1.1M17.5 15.4l1.9 1.1M4.6 16.5l1.9-1.1M17.5 8.6l1.9-1.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
