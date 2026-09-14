"use client";

import { useFamily } from "@/context/FamilyContext";

/** Compact “who is using the app to log” — only when multiple adults exist. */
export function LoggerPicker({ className = "" }: { className?: string }) {
  const { members, activeLoggerId, setActiveLoggerId } = useFamily();
  const adults = members.filter((m) => m.role !== "child");
  if (adults.length <= 1) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-medium text-[var(--muted)]">Logging as</span>
      {adults.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setActiveLoggerId(m.id)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            activeLoggerId === m.id
              ? "bg-[var(--forest)] text-white"
              : "bg-white/80 text-[var(--ink)] ring-1 ring-[var(--line)]"
          }`}
        >
          {m.name}
        </button>
      ))}
    </div>
  );
}
