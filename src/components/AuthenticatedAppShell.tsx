"use client";

import { useAuth } from "@clerk/nextjs";
import { BiteLoader } from "@/components/BiteLogo";
import { AuthWelcome } from "@/components/AuthWelcome";
import { AppShellCore } from "@/components/AppShell";

export function AuthenticatedAppShell() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <BiteLoader size={64} label="Loading account…" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <AuthWelcome />;
  }

  return <AppShellCore />;
}
