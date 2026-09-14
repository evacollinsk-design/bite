import type {
  ActivityEvent,
  CaregiverNote,
  FamilyMember,
  MealEntry,
  NotificationPrefs,
  WaterLog,
} from "@/lib/types";

export interface StoredState {
  members: FamilyMember[];
  meals: MealEntry[];
  notes: CaregiverNote[];
  activity: ActivityEvent[];
  waterLogs: WaterLog[];
  activeLoggerId: string;
  onboardingComplete: boolean;
  notificationPrefs: NotificationPrefs;
  householdName: string;
}

export const STORED_STATE_VERSION = 1;

export type StoredStateEnvelope = StoredState & { version: number };

export function envelope(state: StoredState): StoredStateEnvelope {
  return { ...state, version: STORED_STATE_VERSION };
}

export function unwrapState(raw: unknown): StoredState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.members)) return null;
  const { version: _v, ...rest } = o;
  return rest as unknown as StoredState;
}
