"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import { isAuthConfigured, isCloudStorageConfigured } from "@/lib/auth-config";
import type { StoredState } from "@/lib/stored-state";
import type {
  ActivityEvent,
  CaregiverNote,
  FamilyMember,
  MealEntry,
  NotificationPrefs,
  PermissionLevel,
  WaterLog,
} from "@/lib/types";
import {
  AVATAR_COLORS,
  DEMO_ACTIVITY,
  DEMO_FAMILY,
  DEMO_MEALS,
  DEMO_NOTES,
  DEMO_WATER,
  defaultGoals,
  defaultPermission,
  migrateMember,
  todayKey,
  uid,
} from "@/lib/nutrition";

const STORAGE_KEY = "bite-family-v2";

export type CloudSyncStatus = "local" | "loading" | "syncing" | "synced" | "error";

interface FamilyContextValue {
  ready: boolean;
  cloudSyncStatus: CloudSyncStatus;
  onboardingComplete: boolean;
  householdName: string;
  setHouseholdName: (name: string) => void;
  completeOnboarding: (
    members: Omit<FamilyMember, "id" | "avatarColor">[],
    opts?: { householdName?: string },
  ) => void;
  skipOnboardingWithDemo: () => void;
  members: FamilyMember[];
  meals: MealEntry[];
  notes: CaregiverNote[];
  activity: ActivityEvent[];
  waterLogs: WaterLog[];
  notificationPrefs: NotificationPrefs;
  activeLoggerId: string;
  activeLogger: FamilyMember | undefined;
  isAdmin: boolean;
  setActiveLoggerId: (id: string) => void;
  addMember: (
    input: Omit<
      FamilyMember,
      | "id"
      | "avatarColor"
      | "dailyCalorieTarget"
      | "nutritionGoals"
      | "allergies"
      | "dietaryPreferences"
      | "foodsToAvoid"
    > & {
      dailyCalorieTarget?: number;
      nutritionGoals?: FamilyMember["nutritionGoals"];
      allergies?: string[];
      dietaryPreferences?: string[];
      foodsToAvoid?: string[];
      personality?: FamilyMember["personality"];
    },
  ) => void;
  updateMember: (id: string, patch: Partial<FamilyMember>) => void;
  removeMember: (id: string) => void;
  setPermission: (id: string, level: PermissionLevel) => void;
  addMeal: (meal: Omit<MealEntry, "id">) => MealEntry;
  updateMeal: (id: string, patch: Partial<MealEntry>) => void;
  removeMeal: (id: string) => void;
  addCaregiverNote: (input: { memberId: string; text: string; mealId?: string }) => void;
  setWaterGlasses: (memberId: string, glasses: number) => void;
  bumpWater: (memberId: string, delta?: number) => void;
  setNotificationPrefs: (prefs: Partial<NotificationPrefs>) => void;
  resetDemo: () => void;
  clearFamilyData: () => void;
}

const defaultNotif: NotificationPrefs = {
  missingMeals: true,
  caregiverNotes: true,
  weeklySummary: true,
  allergyReminders: true,
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

function demoState(): StoredState {
  return {
    members: DEMO_FAMILY,
    meals: DEMO_MEALS,
    notes: DEMO_NOTES,
    activity: DEMO_ACTIVITY,
    waterLogs: DEMO_WATER,
    activeLoggerId: DEMO_FAMILY[0].id,
    onboardingComplete: false,
    notificationPrefs: defaultNotif,
    householdName: "Our family",
  };
}

function FamilyProviderBody({
  children,
  cloudUserId,
}: {
  children: ReactNode;
  cloudUserId: string | null;
}) {
  const [ready, setReady] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(
    cloudUserId && isCloudStorageConfigured() ? "loading" : "local",
  );
  const cloudHydrated = useRef(false);
  const [localLoaded, setLocalLoaded] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>(DEMO_FAMILY);
  const [meals, setMeals] = useState<MealEntry[]>(DEMO_MEALS);
  const [notes, setNotes] = useState<CaregiverNote[]>(DEMO_NOTES);
  const [activity, setActivity] = useState<ActivityEvent[]>(DEMO_ACTIVITY);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(DEMO_WATER);
  const [activeLoggerId, setActiveLoggerId] = useState(DEMO_FAMILY[0].id);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [householdName, setHouseholdNameState] = useState("Our family");
  const [notificationPrefs, setNotificationPrefsState] =
    useState<NotificationPrefs>(defaultNotif);

  const applyStoredState = useCallback((parsed: Partial<StoredState>) => {
    if (Array.isArray(parsed.members)) {
      setMembers(parsed.members.map((m) => migrateMember(m)));
    }
    if (Array.isArray(parsed.meals)) setMeals(parsed.meals);
    if (Array.isArray(parsed.notes)) setNotes(parsed.notes);
    if (Array.isArray(parsed.activity)) setActivity(parsed.activity);
    if (Array.isArray(parsed.waterLogs)) setWaterLogs(parsed.waterLogs);
    if (parsed.activeLoggerId) setActiveLoggerId(parsed.activeLoggerId);
    if (typeof parsed.onboardingComplete === "boolean") {
      setOnboardingComplete(parsed.onboardingComplete);
    }
    if (typeof parsed.householdName === "string" && parsed.householdName.trim()) {
      setHouseholdNameState(parsed.householdName.trim());
    }
    if (parsed.notificationPrefs) {
      setNotificationPrefsState({ ...defaultNotif, ...parsed.notificationPrefs });
    }
  }, []);

  const snapshotState = useCallback(
    (): StoredState => ({
      members,
      meals,
      notes,
      activity,
      waterLogs,
      activeLoggerId,
      onboardingComplete,
      notificationPrefs,
      householdName,
    }),
    [
      members,
      meals,
      notes,
      activity,
      waterLogs,
      activeLoggerId,
      onboardingComplete,
      notificationPrefs,
      householdName,
    ],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        applyStoredState(JSON.parse(raw) as Partial<StoredState>);
      }
    } catch {
      // demo defaults
    }
    setLocalLoaded(true);
    if (!cloudUserId || !isCloudStorageConfigured()) {
      setReady(true);
    }
  }, [applyStoredState, cloudUserId]);

  useEffect(() => {
    if (!localLoaded || !cloudUserId || !isCloudStorageConfigured()) return;
    let cancelled = false;
    cloudHydrated.current = false;
    setReady(false);

    (async () => {
      setCloudSyncStatus("loading");
      try {
        const res = await fetch("/api/household", { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 404) {
          setCloudSyncStatus("syncing");
          const seedRes = await fetch("/api/household", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(snapshotState()),
          });
          if (!cancelled) {
            setCloudSyncStatus(seedRes.ok ? "synced" : "error");
          }
          cloudHydrated.current = true;
          setReady(true);
          return;
        }
        if (res.ok) {
          const cloud = (await res.json()) as Partial<StoredState>;
          applyStoredState(cloud);
          setCloudSyncStatus("synced");
          cloudHydrated.current = true;
          setReady(true);
          return;
        }
        setCloudSyncStatus("error");
        cloudHydrated.current = true;
        setReady(true);
      } catch {
        if (!cancelled) {
          setCloudSyncStatus("error");
          cloudHydrated.current = true;
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cloudUserId, localLoaded, applyStoredState, snapshotState]);

  useEffect(() => {
    if (!ready || !cloudUserId || !isCloudStorageConfigured() || !cloudHydrated.current) {
      return;
    }
    const timer = window.setTimeout(async () => {
      setCloudSyncStatus("syncing");
      try {
        const res = await fetch("/api/household", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshotState()),
        });
        setCloudSyncStatus(res.ok ? "synced" : "error");
      } catch {
        setCloudSyncStatus("error");
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    ready,
    cloudUserId,
    snapshotState,
    members,
    meals,
    notes,
    activity,
    waterLogs,
    activeLoggerId,
    onboardingComplete,
    notificationPrefs,
    householdName,
  ]);

  useEffect(() => {
    if (!ready) return;
    const payload: StoredState = {
      members,
      meals,
      notes,
      activity,
      waterLogs,
      activeLoggerId,
      onboardingComplete,
      notificationPrefs,
      householdName,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    ready,
    members,
    meals,
    notes,
    activity,
    waterLogs,
    activeLoggerId,
    onboardingComplete,
    notificationPrefs,
    householdName,
  ]);

  const pushActivity = useCallback((event: Omit<ActivityEvent, "id" | "createdAt">) => {
    setActivity((prev) => [
      { ...event, id: uid("act"), createdAt: new Date().toISOString() },
      ...prev,
    ].slice(0, 50));
  }, []);

  const addMember = useCallback(
    (
      input: Omit<
        FamilyMember,
        | "id"
        | "avatarColor"
        | "dailyCalorieTarget"
        | "nutritionGoals"
        | "allergies"
        | "dietaryPreferences"
        | "foodsToAvoid"
      > & {
        dailyCalorieTarget?: number;
        nutritionGoals?: FamilyMember["nutritionGoals"];
        allergies?: string[];
        dietaryPreferences?: string[];
        foodsToAvoid?: string[];
        personality?: FamilyMember["personality"];
      },
    ) => {
      const g = input.nutritionGoals ?? defaultGoals(input.age, input.role);
      const member = migrateMember({
        ...input,
        id: uid("mem"),
        avatarColor: AVATAR_COLORS[members.length % AVATAR_COLORS.length],
        dailyCalorieTarget: input.dailyCalorieTarget ?? g.calories,
        nutritionGoals: g,
        allergies: input.allergies ?? [],
        dietaryPreferences: input.dietaryPreferences ?? [],
        foodsToAvoid: input.foodsToAvoid ?? [],
        permissionLevel:
          input.role === "child" ? undefined : (input.permissionLevel ?? defaultPermission(input.role)),
      });
      setMembers((prev) => [...prev, member]);
    },
    [members.length],
  );

  const updateMember = useCallback((id: string, patch: Partial<FamilyMember>) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const next = { ...m, ...patch };
        if (patch.nutritionGoals) {
          next.nutritionGoals = { ...m.nutritionGoals, ...patch.nutritionGoals };
          next.dailyCalorieTarget = next.nutritionGoals.calories;
        }
        if (typeof patch.dailyCalorieTarget === "number") {
          next.dailyCalorieTarget = patch.dailyCalorieTarget;
        }
        if (patch.role === "child") {
          next.permissionLevel = undefined;
        } else if (m.role === "child" && patch.role) {
          next.permissionLevel = next.permissionLevel ?? defaultPermission(patch.role);
        }
        return migrateMember(next);
      }),
    );
  }, []);

  const setHouseholdName = useCallback((name: string) => {
    setHouseholdNameState(name.trim() || "Our family");
  }, []);

  const removeMember = useCallback(
    (id: string) => {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setMeals((prev) => prev.filter((m) => m.memberId !== id));
      setNotes((prev) => prev.filter((n) => n.memberId !== id));
      if (activeLoggerId === id) {
        setActiveLoggerId((prev) => members.find((m) => m.id !== id)?.id ?? prev);
      }
    },
    [activeLoggerId, members],
  );

  const setPermission = useCallback(
    (id: string, level: PermissionLevel) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === id && m.role !== "child" ? { ...m, permissionLevel: level } : m)),
      );
      pushActivity({
        actorId: activeLoggerId,
        kind: "permission_changed",
        message: `Permission updated for a caregiver`,
        memberId: id,
      });
    },
    [activeLoggerId, pushActivity],
  );

  const addMeal = useCallback(
    (meal: Omit<MealEntry, "id">) => {
      const entry: MealEntry = { ...meal, id: uid("meal") };
      setMeals((prev) => [entry, ...prev]);
      const actor = members.find((m) => m.id === meal.loggedBy);
      const who = members.find((m) => m.id === meal.memberId);
      pushActivity({
        actorId: meal.loggedBy,
        kind: "meal_logged",
        message: `${actor?.name ?? "Someone"} logged ${meal.mealType} for ${who?.name ?? "a member"}`,
        memberId: meal.memberId,
      });
      if (meal.caregiverNote?.trim()) {
        setNotes((prev) => [
          {
            id: uid("note"),
            memberId: meal.memberId,
            authorId: meal.loggedBy,
            text: meal.caregiverNote!.trim(),
            createdAt: new Date().toISOString(),
            mealId: entry.id,
          },
          ...prev,
        ]);
      }
      return entry;
    },
    [members, pushActivity],
  );

  const updateMeal = useCallback((id: string, patch: Partial<MealEntry>) => {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const removeMeal = useCallback((id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addCaregiverNote = useCallback(
    (input: { memberId: string; text: string; mealId?: string }) => {
      if (!input.text.trim()) return;
      setNotes((prev) => [
        {
          id: uid("note"),
          memberId: input.memberId,
          authorId: activeLoggerId,
          text: input.text.trim(),
          createdAt: new Date().toISOString(),
          mealId: input.mealId,
        },
        ...prev,
      ]);
      const actor = members.find((m) => m.id === activeLoggerId);
      pushActivity({
        actorId: activeLoggerId,
        kind: "note_added",
        message: `${actor?.name ?? "Caregiver"} added a note`,
        memberId: input.memberId,
      });
    },
    [activeLoggerId, members, pushActivity],
  );

  const setWaterGlasses = useCallback(
    (memberId: string, glasses: number) => {
      const date = todayKey();
      setWaterLogs((prev) => {
        const idx = prev.findIndex((l) => l.memberId === memberId && l.date === date);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], glasses: Math.max(0, glasses) };
          return copy;
        }
        return [...prev, { memberId, date, glasses: Math.max(0, glasses) }];
      });
      pushActivity({
        actorId: activeLoggerId,
        kind: "water_logged",
        message: `Water updated`,
        memberId,
      });
    },
    [activeLoggerId, pushActivity],
  );

  const bumpWater = useCallback(
    (memberId: string, delta = 1) => {
      const date = todayKey();
      const current = waterLogs.find((l) => l.memberId === memberId && l.date === date)?.glasses ?? 0;
      setWaterGlasses(memberId, current + delta);
    },
    [setWaterGlasses, waterLogs],
  );

  const setNotificationPrefs = useCallback((prefs: Partial<NotificationPrefs>) => {
    setNotificationPrefsState((prev) => ({ ...prev, ...prefs }));
  }, []);

  const completeOnboarding = useCallback(
    (
      seed: Omit<FamilyMember, "id" | "avatarColor">[],
      opts?: { householdName?: string },
    ) => {
      const built = seed.map((m, i) =>
        migrateMember({
          ...m,
          id: uid("mem"),
          avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
        }),
      );
      setMembers(built);
      setMeals([]);
      setNotes([]);
      setActivity([]);
      setWaterLogs([]);
      if (opts?.householdName?.trim()) {
        setHouseholdNameState(opts.householdName.trim());
      }
      const admin = built.find((m) => m.permissionLevel === "admin") ?? built[0];
      if (admin) setActiveLoggerId(admin.id);
      setOnboardingComplete(true);
    },
    [],
  );

  const skipOnboardingWithDemo = useCallback(() => {
    const fresh = demoState();
    setMembers(fresh.members);
    setMeals(fresh.meals);
    setNotes(fresh.notes);
    setActivity(fresh.activity);
    setWaterLogs(fresh.waterLogs);
    setActiveLoggerId(fresh.activeLoggerId);
    setNotificationPrefsState(fresh.notificationPrefs);
    setHouseholdNameState(fresh.householdName);
    setOnboardingComplete(true);
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = demoState();
    setMembers(fresh.members);
    setMeals(fresh.meals);
    setNotes(fresh.notes);
    setActivity(fresh.activity);
    setWaterLogs(fresh.waterLogs);
    setActiveLoggerId(fresh.activeLoggerId);
    setNotificationPrefsState(fresh.notificationPrefs);
    setHouseholdNameState(fresh.householdName);
    setOnboardingComplete(true);
  }, []);

  const clearFamilyData = useCallback(() => {
    setMembers([]);
    setMeals([]);
    setNotes([]);
    setActivity([]);
    setWaterLogs([]);
    setHouseholdNameState("Our family");
    setOnboardingComplete(false);
  }, []);

  const activeLogger = members.find((m) => m.id === activeLoggerId);
  const isAdmin = activeLogger?.permissionLevel === "admin";

  const value = useMemo<FamilyContextValue>(
    () => ({
      ready,
      cloudSyncStatus,
      onboardingComplete,
      householdName,
      setHouseholdName,
      completeOnboarding,
      skipOnboardingWithDemo,
      members,
      meals,
      notes,
      activity,
      waterLogs,
      notificationPrefs,
      activeLoggerId,
      activeLogger,
      isAdmin,
      setActiveLoggerId,
      addMember,
      updateMember,
      removeMember,
      setPermission,
      addMeal,
      updateMeal,
      removeMeal,
      addCaregiverNote,
      setWaterGlasses,
      bumpWater,
      setNotificationPrefs,
      resetDemo,
      clearFamilyData,
    }),
    [
      ready,
      cloudSyncStatus,
      onboardingComplete,
      householdName,
      setHouseholdName,
      completeOnboarding,
      skipOnboardingWithDemo,
      members,
      meals,
      notes,
      activity,
      waterLogs,
      notificationPrefs,
      activeLoggerId,
      activeLogger,
      isAdmin,
      addMember,
      updateMember,
      removeMember,
      setPermission,
      addMeal,
      updateMeal,
      removeMeal,
      addCaregiverNote,
      setWaterGlasses,
      bumpWater,
      setNotificationPrefs,
      resetDemo,
      clearFamilyData,
    ],
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

function FamilyProviderWithAuth({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const cloudUserId = isLoaded && isSignedIn && user ? user.id : null;
  return <FamilyProviderBody cloudUserId={cloudUserId}>{children}</FamilyProviderBody>;
}

export function FamilyProvider({ children }: { children: ReactNode }) {
  if (isAuthConfigured()) {
    return <FamilyProviderWithAuth>{children}</FamilyProviderWithAuth>;
  }
  return <FamilyProviderBody cloudUserId={null}>{children}</FamilyProviderBody>;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily must be used within FamilyProvider");
  return ctx;
}
