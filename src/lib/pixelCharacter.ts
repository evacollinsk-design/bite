import type { FamilyMember, Personality } from "./types";

export type AgeBand = "toddler" | "child" | "teen" | "adult" | "elderly";

export type { Personality };

export const PERSONALITIES: Personality[] = [
  "energetic",
  "calm",
  "playful",
  "wise",
  "cheeky",
];

export const PERSONALITY_LABELS: Record<Personality, string> = {
  energetic: "Energetic",
  calm: "Calm",
  playful: "Playful",
  wise: "Wise",
  cheeky: "Cheeky",
};

/** Vibrant accent accents readable at small avatar sizes */
export const PERSONALITY_ACCENTS: Record<Personality, string> = {
  energetic: "#ffc107",
  calm: "#2a9d8f",
  playful: "#ff3d7f",
  wise: "#0d9f6e",
  cheeky: "#ff5c3a",
};

export function ageBandForAge(age: number): AgeBand {
  if (age <= 3) return "toddler";
  if (age <= 9) return "child";
  if (age <= 17) return "teen";
  if (age <= 59) return "adult";
  return "elderly";
}

export function ageBandLabel(band: AgeBand): string {
  switch (band) {
    case "toddler":
      return "Toddler";
    case "child":
      return "Child";
    case "teen":
      return "Teen";
    case "adult":
      return "Adult";
    case "elderly":
      return "Elder";
  }
}

/** Stable hash so the same name always gets the same default personality. */
export function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function defaultPersonality(
  name: string,
  role: FamilyMember["role"],
  age: number,
): Personality {
  if (role === "grandparent" || age >= 60) return "wise";
  if (age <= 3) return "playful";
  if (age <= 9) {
    return PERSONALITIES[hashName(name) % 3 === 0 ? 4 : 2]; // cheeky or playful
  }
  if (age <= 17) return hashName(name) % 2 === 0 ? "energetic" : "cheeky";
  if (role === "caretaker") return "calm";
  return PERSONALITIES[hashName(name) % PERSONALITIES.length];
}

export function resolvePersonality(
  member: Pick<FamilyMember, "name" | "role" | "age" | "personality">,
): Personality {
  return member.personality ?? defaultPersonality(member.name, member.role, member.age);
}

/** Soft skin tones — index by name hash for variety without a picker. */
export const SKIN_TONES = ["#f6c9a0", "#e8b07a", "#c6865a", "#f0d0b0", "#d4a574"] as const;

export function skinForName(name: string): string {
  return SKIN_TONES[hashName(name) % SKIN_TONES.length];
}

export function hairForAge(band: AgeBand, accent: string): string {
  switch (band) {
    case "toddler":
      return "#5c4033";
    case "child":
      return "#3d2914";
    case "teen":
      return "#1f1a17";
    case "adult":
      return "#2a211c";
    case "elderly":
      return accent === PERSONALITY_ACCENTS.wise ? "#d4d0c8" : "#c8c4bc";
  }
}
