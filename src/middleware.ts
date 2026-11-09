import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isAuthFullyConfigured } from "@/lib/auth-config";

/**
 * Root cause of production MIDDLEWARE_INVOCATION_FAILED:
 * This file always invoked clerkMiddleware, but Production only had
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (no CLERK_SECRET_KEY). Clerk then
 * crashed on every matched route (`/`, `/home`, etc.).
 *
 * Fix: no-op passthrough until both keys exist. Household API still
 * enforces auth() in the route handler when keys are present.
 */
const isProtectedApi = createRouteMatcher(["/api/household(.*)"]);

type ClerkHandler = (
  req: NextRequest,
  event: NextFetchEvent,
) => Response | Promise<Response>;

let clerkHandler: ClerkHandler | null = null;

function getClerkHandler(): ClerkHandler {
  if (!clerkHandler) {
    clerkHandler = clerkMiddleware(async (auth, req) => {
      if (isProtectedApi(req)) {
        await auth.protect();
      }
    }) as ClerkHandler;
  }
  return clerkHandler;
}

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!isAuthFullyConfigured()) {
    return NextResponse.next();
  }
  return getClerkHandler()(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
