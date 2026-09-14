"use client";

import Link from "next/link";
import { BiteLogo } from "@/components/BiteLogo";

export function AuthWelcome() {
  return (
    <div className="scan-shell relative mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col bg-[#121212] px-5 pb-10 pt-8 text-white">
      <div className="flex items-center gap-2">
        <BiteLogo size={40} showDots animated />
        <span className="font-[family-name:var(--font-display)] text-2xl">Bite</span>
      </div>

      <section className="mt-10 flex flex-1 flex-col">
        <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight">
          Your household, synced
        </h1>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/65">
          Sign in to save profiles, meals, and notes across phones. One account per caregiver
          household — kids stay on profiles, not logins.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-white/70">
          <li className="flex gap-3">
            <span className="text-[var(--coral)]">●</span>
            Encrypted account — only you can open your data
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--coral)]">●</span>
            Pick up where you left off on any device
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--coral)]">●</span>
            Short setup: household → family → goals → first snap
          </li>
        </ul>

        <div className="mt-auto space-y-3 pt-12">
          <Link
            href="/sign-up"
            className="block w-full rounded-[1.35rem] bg-[var(--coral)] py-4 text-center text-base font-bold text-white"
          >
            Create account
          </Link>
          <Link
            href="/sign-in"
            className="block w-full rounded-[1.35rem] bg-white/10 py-4 text-center text-base font-semibold text-white"
          >
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
