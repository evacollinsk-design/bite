import type {
  ActivityEvent,
  CaregiverNote,
  FamilyMember,
  MealEntry,
  Nutrition,
  NutritionGoals,
  PermissionLevel,
  Personality,
  WaterLog,
} from "./types";
import { defaultPersonality } from "./pixelCharacter";

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function defaultGoals(age: number, role: FamilyMember["role"]): NutritionGoals {
  const calories = calorieTargetForAge(age, role);
  const child = role === "child";
  return {
    calories,
    protein: child ? (age <= 8 ? 25 : 40) : 55,
    carbs: child ? (age <= 8 ? 180 : 220) : 250,
    fat: child ? (age <= 8 ? 45 : 55) : 70,
    fiber: child ? (age <= 8 ? 15 : 22) : 28,
    fruitServings: child ? 2 : 2,
    vegServings: child ? 2 : 3,
    waterGlasses: child ? (age <= 5 ? 4 : 6) : 8,
  };
}

export function calorieTargetForAge(age: number, role: FamilyMember["role"]): number {
  if (role === "child") {
    if (age <= 3) return 1200;
    if (age <= 8) return 1500;
    if (age <= 12) return 1800;
    return 2200;
  }
  if (role === "caretaker" || role === "grandparent") return 2000;
  return age < 50 ? 2100 : 1900;
}

export function defaultPermission(role: FamilyMember["role"]): PermissionLevel | undefined {
  if (role === "child") return undefined;
  if (role === "parent") return "admin";
  if (role === "grandparent") return "logger";
  return "logger";
}

export const AVATAR_COLORS = [
  "#0d9f6e",
  "#ff5c3a",
  "#ff3d7f",
  "#e09f3e",
  "#2a9d8f",
  "#e76f51",
  "#4cc9a0",
];

export function emptyNutrition(): Nutrition {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    estimatedWeightGrams: 0,
    fruitServings: 0,
    vegServings: 0,
  };
}

export function normalizeNutrition(n: Partial<Nutrition> | undefined): Nutrition {
  return {
    ...emptyNutrition(),
    ...n,
    sugar: n?.sugar ?? 0,
    fiber: n?.fiber ?? 0,
    fruitServings: n?.fruitServings ?? 0,
    vegServings: n?.vegServings ?? 0,
  };
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function parseDayKey(day: string): Date {
  return new Date(`${day}T12:00:00`);
}

export function isSameDay(iso: string, day = todayKey()): boolean {
  return iso.slice(0, 10) === day;
}

/** Sunday-start week containing `day` (matches week-strip UI). */
export function weekStartKey(day = todayKey()): string {
  const d = parseDayKey(day);
  d.setDate(d.getDate() - d.getDay());
  return todayKey(d);
}

export function weekDayKeys(day = todayKey()): string[] {
  const start = parseDayKey(weekStartKey(day));
  return [...Array(7)].map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return todayKey(d);
  });
}

export function shiftDayKey(day: string, delta: number): string {
  const d = parseDayKey(day);
  d.setDate(d.getDate() + delta);
  return todayKey(d);
}

export function mealsForMemberToday(meals: MealEntry[], memberId: string, day = todayKey()): MealEntry[] {
  return meals.filter((m) => m.memberId === memberId && isSameDay(m.loggedAt, day));
}

export function mealsToday(meals: MealEntry[], day = todayKey()): MealEntry[] {
  return meals.filter((m) => isSameDay(m.loggedAt, day));
}

export function mealsInWeek(meals: MealEntry[], day = todayKey()): MealEntry[] {
  const keys = new Set(weekDayKeys(day));
  return meals.filter((m) => keys.has(m.loggedAt.slice(0, 10)));
}

export function mealsForMemberInWeek(
  meals: MealEntry[],
  memberId: string,
  day = todayKey(),
): MealEntry[] {
  return mealsInWeek(meals, day).filter((m) => m.memberId === memberId);
}

export function mealsInLastDays(meals: MealEntry[], days: number): MealEntry[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return meals.filter((m) => new Date(m.loggedAt) >= start);
}

export function familyGoals(members: FamilyMember[]): NutritionGoals {
  return members.reduce<NutritionGoals>(
    (acc, m) => ({
      calories: acc.calories + m.nutritionGoals.calories,
      protein: acc.protein + m.nutritionGoals.protein,
      carbs: acc.carbs + m.nutritionGoals.carbs,
      fat: acc.fat + m.nutritionGoals.fat,
      fiber: acc.fiber + m.nutritionGoals.fiber,
      fruitServings: acc.fruitServings + m.nutritionGoals.fruitServings,
      vegServings: acc.vegServings + m.nutritionGoals.vegServings,
      waterGlasses: acc.waterGlasses + m.nutritionGoals.waterGlasses,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      fruitServings: 0,
      vegServings: 0,
      waterGlasses: 0,
    },
  );
}

export type ReportRange = "daily" | "weekly";

export function averagesFromTotals(totals: Nutrition, dayCount: number): Nutrition {
  const n = Math.max(1, dayCount);
  return {
    calories: Math.round(totals.calories / n),
    protein: Math.round((totals.protein / n) * 10) / 10,
    carbs: Math.round((totals.carbs / n) * 10) / 10,
    fat: Math.round((totals.fat / n) * 10) / 10,
    fiber: Math.round((totals.fiber / n) * 10) / 10,
    sugar: Math.round((totals.sugar / n) * 10) / 10,
    estimatedWeightGrams: Math.round(totals.estimatedWeightGrams / n),
    fruitServings: Math.round(((totals.fruitServings ?? 0) / n) * 10) / 10,
    vegServings: Math.round(((totals.vegServings ?? 0) / n) * 10) / 10,
  };
}

export function dailyTotals(meals: MealEntry[]): Nutrition {
  return meals.reduce(
    (acc, meal) => {
      const n = normalizeNutrition(meal.nutrition);
      return {
        calories: acc.calories + n.calories,
        protein: Math.round((acc.protein + n.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + n.carbs) * 10) / 10,
        fat: Math.round((acc.fat + n.fat) * 10) / 10,
        fiber: Math.round((acc.fiber + n.fiber) * 10) / 10,
        sugar: Math.round((acc.sugar + n.sugar) * 10) / 10,
        estimatedWeightGrams: acc.estimatedWeightGrams + n.estimatedWeightGrams,
        fruitServings: Math.round(((acc.fruitServings ?? 0) + (n.fruitServings ?? 0)) * 10) / 10,
        vegServings: Math.round(((acc.vegServings ?? 0) + (n.vegServings ?? 0)) * 10) / 10,
      };
    },
    emptyNutrition(),
  );
}

export function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDayLabel(isoDate: string): string {
  const d = parseDayKey(isoDate);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function formatCompactDate(isoDate: string): string {
  const d = parseDayKey(isoDate);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function weekdayLetter(isoDate: string): string {
  return parseDayKey(isoDate).toLocaleDateString([], { weekday: "narrow" });
}

export function dayNumber(isoDate: string): string {
  return String(parseDayKey(isoDate).getDate());
}

export function roleLabel(role: FamilyMember["role"]): string {
  switch (role) {
    case "parent":
      return "Parent";
    case "child":
      return "Child";
    case "caretaker":
      return "Caregiver";
    case "grandparent":
      return "Grandparent";
  }
}

export function permissionLabel(level: PermissionLevel): string {
  switch (level) {
    case "admin":
      return "Admin";
    case "editor":
      return "Editor";
    case "logger":
      return "Can log";
    case "viewer":
      return "View only";
  }
}

export const EXPECTED_MEALS = ["breakfast", "lunch", "dinner"] as const;

export function missingMealsForMember(
  meals: MealEntry[],
  memberId: string,
  day = todayKey(),
): string[] {
  const logged = new Set(mealsForMemberToday(meals, memberId, day).map((m) => m.mealType));
  return EXPECTED_MEALS.filter((m) => !logged.has(m));
}

export function waterForMember(logs: WaterLog[], memberId: string, day = todayKey()): number {
  return logs.find((l) => l.memberId === memberId && l.date === day)?.glasses ?? 0;
}

export function migrateMember(raw: Partial<FamilyMember> & { name: string; role: FamilyMember["role"]; age: number }): FamilyMember {
  const goals = raw.nutritionGoals ?? defaultGoals(raw.age, raw.role);
  const personality: Personality =
    raw.personality ?? defaultPersonality(raw.name, raw.role, raw.age);
  return {
    id: raw.id ?? uid("mem"),
    name: raw.name,
    role: raw.role,
    age: raw.age,
    avatarColor: raw.avatarColor ?? AVATAR_COLORS[0],
    personality,
    dailyCalorieTarget: raw.dailyCalorieTarget ?? goals.calories,
    preferredLanguage: raw.preferredLanguage ?? "en",
    allergies: raw.allergies ?? [],
    dietaryPreferences: raw.dietaryPreferences ?? [],
    foodsToAvoid: raw.foodsToAvoid ?? [],
    nutritionGoals: { ...defaultGoals(raw.age, raw.role), ...goals },
    permissionLevel: raw.role === "child" ? undefined : (raw.permissionLevel ?? defaultPermission(raw.role)),
    canReceiveNotifications: raw.canReceiveNotifications ?? raw.role !== "child",
  };
}

function goals(age: number, role: FamilyMember["role"], overrides?: Partial<NutritionGoals>): NutritionGoals {
  return { ...defaultGoals(age, role), ...overrides };
}

export const DEMO_FAMILY: FamilyMember[] = [
  migrateMember({
    id: "mem_maya",
    name: "Maya",
    role: "parent",
    age: 34,
    avatarColor: "#0d9f6e",
    personality: "calm",
    preferredLanguage: "en",
    dietaryPreferences: ["home-cooked", "vegetarian-friendly"],
    permissionLevel: "admin",
    nutritionGoals: goals(34, "parent"),
  }),
  migrateMember({
    id: "mem_arjun",
    name: "Arjun",
    role: "parent",
    age: 36,
    avatarColor: "#ff3d7f",
    personality: "energetic",
    preferredLanguage: "hi",
    dietaryPreferences: ["high-protein"],
    permissionLevel: "admin",
    nutritionGoals: goals(36, "parent", { protein: 70 }),
  }),
  migrateMember({
    id: "mem_kira",
    name: "Kira",
    role: "child",
    age: 7,
    avatarColor: "#e09f3e",
    personality: "playful",
    preferredLanguage: "en",
    allergies: ["peanuts"],
    foodsToAvoid: ["peanut butter", "trail mix with nuts"],
    dietaryPreferences: ["mild spices"],
    nutritionGoals: goals(7, "child"),
  }),
  migrateMember({
    id: "mem_leo",
    name: "Leo",
    role: "child",
    age: 3,
    avatarColor: "#ff5c3a",
    personality: "cheeky",
    preferredLanguage: "en",
    allergies: [],
    foodsToAvoid: ["very spicy food"],
    dietaryPreferences: ["soft textures"],
    nutritionGoals: goals(3, "child", { waterGlasses: 4 }),
  }),
  migrateMember({
    id: "mem_nisha",
    name: "Nisha",
    role: "caretaker",
    age: 42,
    avatarColor: "#2a9d8f",
    personality: "wise",
    preferredLanguage: "hi",
    permissionLevel: "logger",
    dietaryPreferences: ["simple meals"],
    nutritionGoals: goals(42, "caretaker"),
  }),
  migrateMember({
    id: "mem_dada",
    name: "Dada",
    role: "grandparent",
    age: 68,
    avatarColor: "#4cc9a0",
    personality: "wise",
    preferredLanguage: "hi",
    permissionLevel: "viewer",
    dietaryPreferences: ["low oil", "less sugar"],
    nutritionGoals: goals(68, "grandparent", { calories: 1800 }),
  }),
];

export const DEMO_MEALS: MealEntry[] = [
  {
    id: "meal_demo_1",
    memberId: "mem_kira",
    mealType: "breakfast",
    loggedAt: new Date(new Date().setHours(8, 15, 0, 0)).toISOString(),
    loggedBy: "mem_maya",
    items: [
      {
        name: "Oatmeal with banana",
        portion: "1 bowl (~220g)",
        calories: 280,
        protein: 8,
        carbs: 52,
        fat: 5,
        fiber: 6,
        sugar: 18,
        confidence: 0.86,
      },
    ],
    nutrition: {
      calories: 280,
      protein: 8,
      carbs: 52,
      fat: 5,
      fiber: 6,
      sugar: 18,
      estimatedWeightGrams: 220,
      fruitServings: 1,
      vegServings: 0,
    },
    confidence: 0.86,
    clarified: false,
    language: "en",
    caregiverNote: "She finished the whole bowl today.",
  },
  {
    id: "meal_demo_2",
    memberId: "mem_maya",
    mealType: "breakfast",
    loggedAt: new Date(new Date().setHours(7, 50, 0, 0)).toISOString(),
    loggedBy: "mem_maya",
    items: [
      {
        name: "Greek yogurt & berries",
        portion: "1 cup (~180g)",
        calories: 190,
        protein: 17,
        carbs: 18,
        fat: 5,
        fiber: 3,
        sugar: 12,
        confidence: 0.9,
      },
    ],
    nutrition: {
      calories: 190,
      protein: 17,
      carbs: 18,
      fat: 5,
      fiber: 3,
      sugar: 12,
      estimatedWeightGrams: 180,
      fruitServings: 0.5,
      vegServings: 0,
    },
    confidence: 0.9,
    clarified: false,
    language: "en",
  },
  {
    id: "meal_demo_3",
    memberId: "mem_leo",
    mealType: "snack",
    loggedAt: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    loggedBy: "mem_nisha",
    items: [
      {
        name: "Apple slices",
        portion: "1 medium apple",
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4,
        sugar: 19,
        confidence: 0.92,
      },
    ],
    nutrition: {
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      fiber: 4,
      sugar: 19,
      estimatedWeightGrams: 180,
      fruitServings: 1,
      vegServings: 0,
    },
    confidence: 0.92,
    clarified: false,
    language: "hi",
    notes: "सेब के टुकड़े",
    caregiverNote: "Leo asked for a second piece of apple.",
  },
  {
    id: "meal_demo_4",
    memberId: "mem_arjun",
    mealType: "lunch",
    loggedAt: new Date(new Date().setHours(13, 10, 0, 0)).toISOString(),
    loggedBy: "mem_arjun",
    items: [
      {
        name: "Dal-chawal with sabzi",
        portion: "1 plate (~420g)",
        calories: 520,
        protein: 18,
        carbs: 78,
        fat: 12,
        fiber: 9,
        sugar: 4,
        confidence: 0.74,
      },
    ],
    nutrition: {
      calories: 520,
      protein: 18,
      carbs: 78,
      fat: 12,
      fiber: 9,
      sugar: 4,
      estimatedWeightGrams: 420,
      fruitServings: 0,
      vegServings: 1.5,
    },
    confidence: 0.74,
    clarified: true,
    language: "hi",
    incomplete: false,
  },
];

export const DEMO_NOTES: CaregiverNote[] = [
  {
    id: "note_1",
    memberId: "mem_kira",
    authorId: "mem_nisha",
    text: "Kira did not like the vegetables at lunch yesterday — maybe try milder sabzi.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: "note_2",
    memberId: "mem_leo",
    authorId: "mem_nisha",
    text: "Aarav-style note: Leo ate only half his lunch; saved the rest for snack time.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

export const DEMO_ACTIVITY: ActivityEvent[] = [
  {
    id: "act_1",
    actorId: "mem_nisha",
    kind: "note_added",
    message: "Nisha left a note about Leo’s lunch",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    memberId: "mem_leo",
  },
  {
    id: "act_2",
    actorId: "mem_maya",
    kind: "meal_logged",
    message: "Maya logged breakfast for Kira",
    createdAt: new Date(new Date().setHours(8, 15, 0, 0)).toISOString(),
    memberId: "mem_kira",
  },
];

export const DEMO_WATER: WaterLog[] = [
  { memberId: "mem_kira", date: todayKey(), glasses: 3 },
  { memberId: "mem_leo", date: todayKey(), glasses: 2 },
  { memberId: "mem_maya", date: todayKey(), glasses: 4 },
];
