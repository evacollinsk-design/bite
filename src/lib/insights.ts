import type {
  FamilyMember,
  MealEntry,
  MealSuggestion,
  MealType,
  Nutrition,
  PermissionLevel,
} from "./types";
import { dailyTotals, mealsForMemberToday, mealsInLastDays, missingMealsForMember, todayKey } from "./nutrition";

export function canManagePermissions(level?: PermissionLevel): boolean {
  return level === "admin";
}

export function canEditProfiles(level?: PermissionLevel): boolean {
  return level === "admin" || level === "editor";
}

export function canLogMeals(level?: PermissionLevel): boolean {
  return level === "admin" || level === "editor" || level === "logger";
}

export function canViewFamily(level?: PermissionLevel): boolean {
  return Boolean(level);
}

export function encouragingGaps(
  member: FamilyMember,
  totals: Nutrition,
  waterGlasses: number,
): string[] {
  const tips: string[] = [];
  const g = member.nutritionGoals;

  if (totals.protein < g.protein * 0.7) {
    tips.push(
      `A little more protein could help complete ${member.name}'s day — dal, eggs, dahi, or paneer work well.`,
    );
  }
  if ((totals.fiber ?? 0) < g.fiber * 0.6) {
    tips.push(
      `${member.name} could use a bit more fibre today — fruit, veggies, or whole grains gently help.`,
    );
  }
  if ((totals.fruitServings ?? 0) < g.fruitServings * 0.5) {
    tips.push(`A fruit serving would be a nice boost for ${member.name}.`);
  }
  if ((totals.vegServings ?? 0) < g.vegServings * 0.5) {
    tips.push(`Adding a soft sabzi or salad can round out ${member.name}'s veggies.`);
  }
  if (waterGlasses < g.waterGlasses * 0.5) {
    tips.push(`A few more water sips would help ${member.name} stay comfortable today.`);
  }
  if (totals.calories < g.calories * 0.45 && new Date().getHours() >= 15) {
    tips.push(`${member.name}'s meals look light so far — a nourishing snack can help.`);
  }
  return tips.slice(0, 2);
}

export function weeklyPatternSummary(member: FamilyMember, meals: MealEntry[]): string {
  const week = mealsInLastDays(
    meals.filter((m) => m.memberId === member.id),
    7,
  );
  if (week.length === 0) {
    return `Not enough logs yet for ${member.name} — even one snap a day builds a helpful picture.`;
  }
  const totals = dailyTotals(week);
  const avgCal = Math.round(totals.calories / 7);
  const proteinDays = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayMeals = week.filter((m) => m.loggedAt.startsWith(key));
    return dailyTotals(dayMeals).protein;
  });
  const avgProtein = Math.round((proteinDays.reduce((a, b) => a + b, 0) / 7) * 10) / 10;
  const snackHeavy = week.filter((m) => m.mealType === "snack").length >= 5;

  const bits = [
    `About ${avgCal} kcal/day on average this week.`,
    `Protein averaging ~${avgProtein}g/day.`,
  ];
  if (snackHeavy) bits.push("Snacks showed up often — handy for busy school days.");
  if ((totals.vegServings ?? 0) / 7 < member.nutritionGoals.vegServings * 0.5) {
    bits.push("Veggies were a bit light — mild sabzi or soup could help next week.");
  }
  return bits.join(" ");
}

export function buildMealSuggestions(
  members: FamilyMember[],
  meals: MealEntry[],
): MealSuggestion[] {
  const kids = members.filter((m) => m.role === "child");
  const focus = kids[0] ?? members[0];
  if (!focus) return [];

  const today = mealsForMemberToday(meals, focus.id);
  const totals = dailyTotals(today);
  const missing = missingMealsForMember(meals, focus.id);
  const allergies = new Set(members.flatMap((m) => m.allergies.map((a) => a.toLowerCase())));
  const avoidNuts = [...allergies].some((a) => a.includes("peanut") || a.includes("nut"));

  const pool: MealSuggestion[] = [
    {
      id: "sug_khichdi",
      title: "Soft moong khichdi + curd",
      reason: "Gentle, protein-friendly, and quick for school nights.",
      mealType: "dinner",
      forMemberIds: kids.map((k) => k.id),
      tags: ["home-cooked", "mild", "30 min"],
      estimatedMinutes: 30,
    },
    {
      id: "sug_paratha",
      title: "Aloo paratha with little oil + dahi",
      reason: "Familiar favourite — toast lightly and serve half portions for little ones.",
      mealType: "breakfast",
      forMemberIds: kids.map((k) => k.id),
      tags: ["Hinglish kitchen", "fill gaps"],
      estimatedMinutes: 25,
    },
    {
      id: "sug_lunchbox",
      title: "Roti roll with paneer bhurji",
      reason: "Travels well in a lunchbox and adds protein without fuss.",
      mealType: "lunch",
      forMemberIds: kids.map((k) => k.id),
      tags: ["school lunch", "protein"],
      estimatedMinutes: 20,
    },
    {
      id: "sug_veg",
      title: "Palak corn + jeera rice",
      reason: "A calm way to add vegetables when the day looks light on greens.",
      mealType: "lunch",
      forMemberIds: members.map((m) => m.id),
      tags: ["veggies", "family pot"],
      estimatedMinutes: 35,
    },
    {
      id: "sug_fruit",
      title: "Seasonal fruit chaat (no chaat masala heat)",
      reason: "Easy fruit serving for after-school energy.",
      mealType: "snack",
      forMemberIds: kids.map((k) => k.id),
      tags: ["fruit", "5 min"],
      estimatedMinutes: 5,
    },
    {
      id: "sug_soup",
      title: "Vegetable soup + toast soldiers",
      reason: "Comforting when appetite is low and evenings are rushed.",
      mealType: "dinner",
      forMemberIds: kids.map((k) => k.id),
      tags: ["busy schedule", "soft"],
      estimatedMinutes: 20,
    },
  ];

  let filtered = pool.filter((s) => {
    if (avoidNuts && /nut|peanut/i.test(s.title + s.reason)) return false;
    return true;
  });

  if ((totals.protein ?? 0) < focus.nutritionGoals.protein * 0.5) {
    filtered = [...filtered].sort((a, b) => {
      const ap = /protein|paneer|dal|dahi|egg|khichdi/i.test(a.title + a.reason) ? 1 : 0;
      const bp = /protein|paneer|dal|dahi|egg|khichdi/i.test(b.title + b.reason) ? 1 : 0;
      return bp - ap;
    });
  }

  if (missing.includes("lunch")) {
    filtered = [
      ...filtered.filter((s) => s.mealType === "lunch"),
      ...filtered.filter((s) => s.mealType !== "lunch"),
    ];
  }

  const hour = new Date().getHours();
  const nextType: MealType =
    hour < 11 ? "breakfast" : hour < 15 ? "lunch" : hour < 18 ? "snack" : "dinner";

  return filtered
    .sort((a, b) => (a.mealType === nextType ? -1 : b.mealType === nextType ? 1 : 0))
    .slice(0, 4)
    .map((s) => ({
      ...s,
      reason:
        s.reason +
        (missing.length
          ? ` Helpful while ${focus.name}'s ${missing[0]} is still open.`
          : ` Based on patterns around ${todayKey()}.`),
    }));
}

export function dayKeysLastWeek(): string[] {
  return [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}
