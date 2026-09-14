import { head, put } from "@vercel/blob";
import { envelope, unwrapState, type StoredState } from "@/lib/stored-state";
import { isCloudStorageConfigured } from "@/lib/auth-config";

function blobPath(userId: string) {
  return `households/${userId}.json`;
}

export async function loadHouseholdFromCloud(userId: string): Promise<StoredState | null> {
  if (!isCloudStorageConfigured()) return null;
  const pathname = blobPath(userId);
  try {
    const meta = await head(pathname);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as unknown;
    return unwrapState(json);
  } catch {
    return null;
  }
}

export async function saveHouseholdToCloud(userId: string, state: StoredState): Promise<void> {
  if (!isCloudStorageConfigured()) {
    throw new Error("Cloud storage is not configured");
  }
  const pathname = blobPath(userId);
  await put(pathname, JSON.stringify(envelope(state)), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}
