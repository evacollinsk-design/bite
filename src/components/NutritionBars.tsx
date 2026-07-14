"use client";

export function MacroBar({
  label,
  value,
  unit = "g",
  max,
  color,
}: {
  label: string;
  value: number;
  unit?: string;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="font-medium tabular-nums text-[var(--ink)]">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function CalorieRing({
  current,
  target,
  size = 88,
}: {
  current: number;
  target: number;
  size?: number;
}) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const offset = c * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--coral)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold tabular-nums leading-none text-[var(--ink)]">
          {current}
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
          / {target}
        </span>
      </div>
    </div>
  );
}
