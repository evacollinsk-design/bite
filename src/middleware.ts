import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isAuthConfigured } from "@/lib/auth-config";

const isProtectedApi = createRouteMatcher(["/api/household(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isAuthConfigured()) return;
  if (isProtectedApi(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
