import * as SecureStore from "expo-secure-store";

/** Storage key holding the last weekly-snapshot signature the user has seen. */
export const WEEKLY_SNAPSHOT_SEEN_STORAGE_KEY = "auraxis.weekly-snapshot.seen.v1";

/**
 * Reads the last-seen weekly-snapshot signature. Returns null when nothing was
 * persisted yet or on any read error (the badge then defaults to "NOVO").
 */
export const loadLastSeenSignature = async (): Promise<string | null> => {
  try {
    const value = await SecureStore.getItemAsync(WEEKLY_SNAPSHOT_SEEN_STORAGE_KEY);
    return value && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
};

/**
 * Persists the given signature as seen so the "NOVO" badge clears. Swallows
 * write errors — failing to persist only re-shows the badge next time.
 */
export const persistLastSeenSignature = async (
  signature: string,
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(WEEKLY_SNAPSHOT_SEEN_STORAGE_KEY, signature);
  } catch {
    // Non-fatal: the badge simply stays until the next successful write.
  }
};
