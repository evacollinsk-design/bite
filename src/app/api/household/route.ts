import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAuthFullyConfigured, isCloudStorageConfigured } from "@/lib/auth-config";
import { loadHouseholdFromCloud, saveHouseholdToCloud } from "@/lib/household-cloud";
import { unwrapState, type StoredState } from "@/lib/stored-state";

export async function GET() {
  if (!isAuthFullyConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isCloudStorageConfigured()) {
    return NextResponse.json({ error: "Cloud storage not configured" }, { status: 503 });
  }
  const state = await loadHouseholdFromCloud(userId);
  if (!state) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(state);
}

export async function PUT(req: Request) {
  if (!isAuthFullyConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isCloudStorageConfigured()) {
    return NextResponse.json({ error: "Cloud storage not configured" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const state = unwrapState(body);
  if (!state) {
    return NextResponse.json({ error: "Invalid household payload" }, { status: 400 });
  }
  if (!state.activeLoggerId && state.members.length > 0) {
    (state as StoredState).activeLoggerId = state.members[0].id;
  }
  await saveHouseholdToCloud(userId, state);
  return NextResponse.json({ ok: true });
}
