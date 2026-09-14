"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useFamily } from "@/context/FamilyContext";
import { isAuthConfigured } from "@/lib/auth-config";
import { Avatar } from "@/components/Avatar";
import { HomeLogoButton } from "@/components/HomeLogoButton";
import { canManagePermissions } from "@/lib/insights";
import { permissionLabel, roleLabel } from "@/lib/nutrition";
import type { PermissionLevel, SettingsTab } from "@/lib/types";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "permissions", label: "Permissions" },
  { id: "notifications", label: "Alerts" },
  { id: "privacy", label: "Privacy" },
  { id: "household", label: "Admin" },
];

const LEVELS: PermissionLevel[] = ["admin", "editor", "logger", "viewer"];

export function SettingsPanel({
  onOpenPlan,
  onHome,
}: {
  onOpenPlan?: () => void;
  onHome?: () => void;
}) {
  const {
    members,
    activeLogger,
    isAdmin,
    setPermission,
    notificationPrefs,
    setNotificationPrefs,
    resetDemo,
    clearFamilyData,
    activity,
    cloudSyncStatus,
  } = useFamily();
  const authOn = isAuthConfigured();
  const [tab, setTab] = useState<SettingsTab>("permissions");
  const canAdmin = canManagePermissions(activeLogger?.permissionLevel);

  return (
    <div className="space-y-6 pb-28">
      <header className="space-y-2 px-1">
        {onHome && <HomeLogoButton onHome={onHome} size={34} />}
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral)]">
          Settings
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Admin & household
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Permission levels, alerts, and privacy controls for parents.
          {!isAdmin && " Viewing as non-admin — some actions are locked."}
        </p>
      </header>

      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white/70 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-[var(--forest)] text-white"
                : "text-[var(--muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "permissions" && (
        <section className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Parents (admin) control who can view, log, or edit. Children never hold account permissions.
          </p>
          {members
            .filter((m) => m.role !== "child")
            .map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-2xl bg-white/80 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar member={m} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {roleLabel(m.role)} · {permissionLabel(m.permissionLevel ?? "viewer")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      disabled={!canAdmin}
                      onClick={() => setPermission(m.id, level)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${
                        m.permissionLevel === level
                          ? "bg-[var(--citrus)] text-[var(--ink)]"
                          : "bg-[var(--mist)] text-[var(--muted)]"
                      }`}
                    >
                      {permissionLabel(level)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          <div className="rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
            <p className="font-medium text-[var(--ink)]">Permission guide</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Admin — manage people, permissions, and household data</li>
              <li>Editor — edit profiles and goals</li>
              <li>Can log — snap meals and leave caregiver notes</li>
              <li>View only — see dashboards without editing</li>
            </ul>
          </div>
        </section>
      )}

      {tab === "notifications" && (
        <section className="space-y-3 rounded-[1.75rem] bg-white/80 p-5">
          <p className="text-sm text-[var(--muted)]">
            Choose gentle reminders. Alerts stay supportive — never shaming.
          </p>
          {(
            [
              ["missingMeals", "Missing meal nudges"],
              ["caregiverNotes", "New caregiver notes"],
              ["weeklySummary", "Weekly family summary"],
              ["allergyReminders", "Allergy reminders while logging"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--mist)]/50 px-4 py-3"
            >
              <span className="text-sm font-medium text-[var(--ink)]">{label}</span>
              <input
                type="checkbox"
                checked={notificationPrefs[key]}
                disabled={!canAdmin && key !== "caregiverNotes"}
                onChange={(e) => setNotificationPrefs({ [key]: e.target.checked })}
                className="h-5 w-5 accent-[var(--forest)]"
              />
            </label>
          ))}
        </section>
      )}

      {tab === "privacy" && (
        <section className="space-y-4 rounded-[1.75rem] bg-white/80 p-5 text-sm leading-relaxed text-[var(--muted)]">
          {authOn && (
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--mist)]/60 p-4">
              <div>
                <p className="font-semibold text-[var(--ink)]">Account</p>
                <p className="text-xs">
                  Sync:{" "}
                  {cloudSyncStatus === "synced"
                    ? "Up to date"
                    : cloudSyncStatus === "syncing"
                      ? "Saving…"
                      : cloudSyncStatus === "error"
                        ? "Sync issue — check Vercel Blob"
                        : cloudSyncStatus === "local"
                          ? "This device only"
                          : "Loading…"}
                </p>
              </div>
              <UserButton />
            </div>
          )}
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Privacy & care
          </h2>
          <p>
            {authOn
              ? "Signed-in households sync encrypted JSON to your account (Vercel Blob). Meal photos are sent to OpenAI only when you log a meal with live AI enabled."
              : "In local mode, family data stays in your browser (local storage). Children’s profiles, meal photos, and notes are not uploaded unless you add your own AI API key for analysis."}
          </p>
          <p>
            Bite is a supportive logging tool. Nutritional values are <strong>estimates</strong> and
            are not medical advice. It is not a replacement for a doctor or qualified dietitian.
          </p>
          <p>
            Prefer warm language: celebrate effort, suggest gentle additions (“a little more
            protein…”), and avoid labels like “bad food” or “failed goal.”
          </p>
          {canAdmin && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear all household data on this device?")) clearFamilyData();
              }}
              className="w-full rounded-full border border-[#9B2226]/40 py-3 font-semibold text-[#9B2226]"
            >
              Clear household data
            </button>
          )}
        </section>
      )}

      {tab === "household" && (
        <section className="space-y-4">
          <div className="rounded-[1.75rem] bg-white/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl">Shortcuts</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Meal planning lives with admin tools so the main nav stays clear.
            </p>
            <button
              type="button"
              onClick={() => onOpenPlan?.()}
              className="mt-3 inline-flex rounded-full bg-[var(--citrus)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
            >
              Open meal ideas
            </button>
          </div>
          <div className="rounded-[1.75rem] bg-white/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl">Caregiver activity</h2>
            <ul className="mt-3 space-y-2">
              {activity.slice(0, 8).map((a) => (
                <li key={a.id} className="rounded-xl bg-[var(--mist)]/60 px-3 py-2 text-sm">
                  <p className="text-[var(--ink)]">{a.message}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
              {activity.length === 0 && (
                <p className="text-sm text-[var(--muted)]">No activity yet.</p>
              )}
            </ul>
          </div>
          {canAdmin && (
            <button
              type="button"
              onClick={resetDemo}
              className="w-full rounded-full bg-[var(--mist)] py-3 text-sm font-semibold text-[var(--forest-deep)]"
            >
              Reload demo household
            </button>
          )}
        </section>
      )}
    </div>
  );
}
