"use client";

import { BiteLogo } from "@/components/BiteLogo";

/** Tappable Bite mark → Home, shown on non-home screens. */
export function HomeLogoButton({
  onHome,
  light = false,
  size = 36,
  showWordmark = true,
}: {
  onHome: () => void;
  /** For dark backgrounds (scanner). */
  light?: boolean;
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onHome}
      aria-label="Go to Home"
      className={`btn-bounce inline-flex items-center gap-2 rounded-2xl px-1.5 py-1 ${
        light ? "text-white" : "text-[var(--ink)]"
      }`}
    >
      <BiteLogo size={size} showDots={false} animated />
      {showWordmark && (
        <span
          className={`font-[family-name:var(--font-display)] text-xl leading-none tracking-tight ${
            light ? "text-white" : "text-[var(--ink)]"
          }`}
        >
          Bite
        </span>
      )}
    </button>
  );
}
