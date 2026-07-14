export type MemberRole = "parent" | "child" | "caretaker" | "grandparent";

export type Personality = "energetic" | "calm" | "playful" | "wise" | "cheeky";

export type PermissionLevel = "admin" | "editor" | "logger" | "viewer";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type SettingsTab =
  | "permissions"
  | "notifications"
  | "privacy"
  | "household";

export type AppTab =
  | "home"
  | "insights"
  | "log"
  | "plan"
  | "family"
  | "settings";

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  estimatedWeightGrams: number;
  fruitServings?: number;
  vegServings?: number;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  fruitServings: number;
  vegServings: number;
  waterGlasses: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: MemberRole;
  age: number;
  avatarColor: string;
  /** Pixel character vibe — drives pose, accessory, and idle animation */
  personality?: Personality;
  dailyCalorieTarget: number;
  preferredLanguage?: string;
  allergies: string[];
  dietaryPreferences: string[];
  foodsToAvoid: string[];
  nutritionGoals: NutritionGoals;
  /** Adults only — children never hold account permissions */
  permissionLevel?: PermissionLevel;
  canReceiveNotifications?: boolean;
}

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  confidence: number;
}

export interface MealEntry {
  id: string;
  memberId: string;
  mealType: MealType;
  loggedAt: string;
  loggedBy: string;
  photoDataUrl?: string;
  items: FoodItem[];
  nutrition: Nutrition;
  notes?: string;
  caregiverNote?: string;
  language?: string;
  confidence: number;
  clarified: boolean;
  incomplete?: boolean;
}

export interface CaregiverNote {
  id: string;
  memberId: string;
  authorId: string;
  text: string;
  createdAt: string;
  mealId?: string;
}

export interface ActivityEvent {
  id: string;
  actorId: string;
  kind: "meal_logged" | "note_added" | "member_updated" | "water_logged" | "permission_changed";
  message: string;
  createdAt: string;
  memberId?: string;
}

export interface WaterLog {
  memberId: string;
  date: string;
  glasses: number;
}

export interface NotificationPrefs {
  missingMeals: boolean;
  caregiverNotes: boolean;
  weeklySummary: boolean;
  allergyReminders: boolean;
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  questionLocal?: string;
  options?: string[];
}

export interface AnalysisResult {
  items: FoodItem[];
  nutrition: Nutrition;
  confidence: number;
  needsClarification: boolean;
  questions: ClarifyingQuestion[];
  detectedCuisine?: string;
  summary: string;
  summaryLocal?: string;
  language: string;
}

export interface ClarifyResult {
  items: FoodItem[];
  nutrition: Nutrition;
  confidence: number;
  detectedLanguage: string;
  languageName: string;
  interpretation: string;
  interpretationLocal: string;
  remainingQuestions: ClarifyingQuestion[];
}

export interface MealSuggestion {
  id: string;
  title: string;
  reason: string;
  mealType: MealType;
  forMemberIds: string[];
  tags: string[];
  estimatedMinutes: number;
}
