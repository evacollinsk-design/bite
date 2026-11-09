"use client";

import { FamilyProvider } from "@/context/FamilyContext";
import type { ReactNode } from "react";

/** ClerkProvider lives in root layout (clerk init). This only wraps family state. */
export function AppProviders({ children }: { children: ReactNode }) {
  return <FamilyProvider>{children}</FamilyProvider>;
}
