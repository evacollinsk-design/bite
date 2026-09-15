/** True when Clerk publishable key is present (safe for client + server). */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}

/**
 * True when both Clerk keys exist. Use only on server/edge (middleware, route handlers).
 * Never check CLERK_SECRET_KEY from client components — it is not available there.
 */
export function isAuthFullyConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const sk = process.env.CLERK_SECRET_KEY?.trim();
  return Boolean(pk && sk);
}

export function isCloudStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}
