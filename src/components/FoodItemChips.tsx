"use client";

import { useState } from "react";
import {
  LOW_FOOD_CONFIDENCE,
  averageItemConfidence,
  nutritionFromFoodItems,
  scaleFoodItem,
} from "@/lib/nutrition";
import type { AnalysisResult, FoodItem } from "@/lib/types";

export function FoodItemChips({
  analysis,
  onChange,
  disabled,
}: {
  analysis: AnalysisResult;
  onChange: (next: AnalysisResult) => void;
  disabled?: boolean;
}) {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const editing = editIndex != null ? analysis.items[editIndex] : null;

  function commitItems(items: FoodItem[]) {
    const nutrition = nutritionFromFoodItems(items, analysis.nutrition);
    const confidence = averageItemConfidence(items, analysis.confidence);
    onChange({
      ...analysis,
      items,
      nutrition,
      confidence,
      needsClarification:
        items.some((i) => i.confidence < LOW_FOOD_CONFIDENCE) ||
        (analysis.needsClarification && items.length > 0),
    });
  }

  function updateItem(index: number, patch: Partial<FoodItem>) {
    const items = analysis.items.map((item, i) =>
      i === index ? { ...item, ...patch, confidence: Math.min(1, item.confidence + 0.1) } : item,
    );
    commitItems(items);
  }

  function removeItem(index: number) {
    commitItems(analysis.items.filter((_, i) => i !== index));
    setEditIndex(null);
  }

  function scaleAt(index: number, factor: number) {
    const items = analysis.items.map((item, i) =>
      i === index ? scaleFoodItem(item, factor) : item,
    );
    commitItems(items);
    setEditIndex(null);
  }

  if (analysis.items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-6 text-center text-sm text-[var(--muted)]">
        No items detected — use “More detail” below to describe the meal.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {analysis.items.map((item, idx) => {
          const low = item.confidence < LOW_FOOD_CONFIDENCE;
          return (
            <button
              key={`${item.name}-${idx}`}
              type="button"
              disabled={disabled}
              onClick={() => setEditIndex(idx)}
              className={`max-w-full rounded-2xl px-3 py-2 text-left text-sm transition active:scale-[0.98] disabled:opacity-50 ${
                low
                  ? "border-2 border-dashed border-[var(--citrus)] bg-[#fff8e0]"
                  : "border border-[var(--line)] bg-[var(--mist)]/80"
              }`}
            >
              <span className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                {low && (
                  <span
                    className="rounded-md bg-[var(--citrus)]/30 px-1 text-[10px] font-bold uppercase text-[#7a5a00]"
                    title="We're less sure about this one"
                  >
                    ?
                  </span>
                )}
                <span className="truncate">{item.name}</span>
              </span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                {item.portion} · ~{item.calories} kcal
              </span>
            </button>
          );
        })}
      </div>

      {editing != null && editIndex != null && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12"
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${editing.name}`}
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => setEditIndex(null)}
          />
          <div className="relative w-full max-w-lg rounded-[1.75rem] bg-white p-5 text-[var(--ink)] shadow-2xl">
            <h3 className="font-[family-name:var(--font-display)] text-xl">Fix this item</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Rename, adjust portion, or remove.</p>

            <label className="mt-4 block space-y-1 text-sm">
              <span className="text-[var(--muted)]">Name</span>
              <input
                value={editing.name}
                onChange={(e) => updateItem(editIndex, { name: e.target.value })}
                className="w-full rounded-2xl border border-[var(--line)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--forest)]/30"
              />
            </label>
            <label className="mt-3 block space-y-1 text-sm">
              <span className="text-[var(--muted)]">Portion</span>
              <input
                value={editing.portion}
                onChange={(e) => updateItem(editIndex, { portion: e.target.value })}
                className="w-full rounded-2xl border border-[var(--line)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--forest)]/30"
              />
            </label>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Quick portion
            </p>
            <div className="mt-2 flex gap-2">
              {(
                [
                  { label: "½ size", factor: 0.5 },
                  { label: "1×", factor: 1 },
                  { label: "2×", factor: 2 },
                ] as const
              ).map(({ label, factor }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (factor === 1) return;
                    scaleAt(editIndex, factor);
                  }}
                  className="flex-1 rounded-2xl bg-[var(--mist)] py-2.5 text-xs font-bold text-[var(--forest-deep)]"
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => removeItem(editIndex)}
              className="mt-4 w-full py-2 text-sm font-semibold text-[#9b2226]"
            >
              Remove from meal
            </button>
            <button
              type="button"
              onClick={() => setEditIndex(null)}
              className="mt-2 w-full rounded-2xl bg-[var(--forest)] py-3 text-sm font-bold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
