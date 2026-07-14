"use client";

import {
  dayNumber,
  shiftDayKey,
  todayKey,
  weekDayKeys,
  weekdayLetter,
  type ReportRange,
} from "@/lib/nutrition";

export function WeekCalendar({
  selectedDay,
  onSelectDay,
  range = "daily",
  onRangeChange,
  activityByDay,
}: {
  selectedDay: string;
  onSelectDay: (day: string) => void;
  range?: ReportRange;
  onRangeChange?: (range: ReportRange) => void;
  /** Per-day meal count or activity intensity (0 = empty) */
  activityByDay?: Record<string, number>;
}) {
  const days = weekDayKeys(selectedDay);
  const today = todayKey();

  return (
    <div className="space-y-3">
      {onRangeChange && (
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="inline-flex rounded-full bg-[var(--mist)] p-0.5">
            {(["daily", "weekly"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRangeChange(r)}
                className={`btn-bounce rounded-full px-3 py-1 text-xs font-bold capitalize ${
                  range === r
                    ? "bg-[var(--forest)] text-white"
                    : "text-[var(--forest-deep)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => onSelectDay(shiftDayKey(selectedDay, -7))}
              className="btn-bounce flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sm font-bold text-[var(--ink)]"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => onSelectDay(shiftDayKey(selectedDay, 7))}
              className="btn-bounce flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sm font-bold text-[var(--ink)]"
            >
              ›
            </button>
          </div>
        </div>
      )}

      <div className="week-strip flex items-start justify-between gap-1">
        {days.map((day) => {
          const selected = day === selectedDay;
          const isToday = day === today;
          const activity = activityByDay?.[day] ?? 0;
          const inWeekFocus = range === "weekly";

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className="btn-bounce flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wide ${
                  selected ? "text-[var(--ink)]" : "text-[var(--muted)]"
                }`}
              >
                {weekdayLetter(day)}
              </span>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors ${
                  selected
                    ? "bg-[var(--coral)] text-white shadow-[0_6px_14px_-6px_rgba(255,92,58,0.7)]"
                    : inWeekFocus
                      ? "bg-[var(--mist)] text-[var(--forest-deep)] ring-1 ring-[var(--forest)]/25"
                      : isToday
                        ? "bg-white text-[var(--ink)] ring-2 ring-[var(--citrus)]"
                        : "bg-white/90 text-[var(--ink)] ring-1 ring-[var(--line)]"
                }`}
              >
                {dayNumber(day)}
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  activity > 0 ? "bg-[var(--forest)]" : "bg-transparent"
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
