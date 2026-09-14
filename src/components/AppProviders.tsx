"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { FamilyProvider } from "@/context/FamilyContext";
import { isAuthConfigured } from "@/lib/auth-config";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  if (!isAuthConfigured()) {
    return <FamilyProvider>{children}</FamilyProvider>;
  }
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
    >
      <FamilyProvider>{children}</FamilyProvider>
    </ClerkProvider>
  );
}
