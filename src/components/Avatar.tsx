"use client";

import { PixelCharacter } from "@/components/PixelCharacter";
import type { FamilyMember } from "@/lib/types";

export function Avatar({
  member,
  size = 40,
  className = "",
  animated = true,
}: {
  member: Pick<FamilyMember, "name" | "avatarColor" | "age" | "role" | "personality">;
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  return (
    <PixelCharacter
      member={member}
      size={size}
      className={className}
      animated={animated}
    />
  );
}
