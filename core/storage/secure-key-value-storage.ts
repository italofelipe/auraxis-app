import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const volatileWebStorage = new Map<string, string>();

/**
 * Reads sensitive key/value state through the platform-appropriate backend.
 *
 * Native builds use Expo SecureStore. Expo Web previews intentionally keep
 * values in memory only, avoiding insecure token persistence in localStorage.
 */
export const getSecureValue = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") {
    return volatileWebStorage.get(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
};

/**
 * Persists sensitive state in SecureStore on native and volatile memory on web.
 */
export const setSecureValue = async (
  key: string,
  value: string,
): Promise<void> => {
  if (Platform.OS === "web") {
    volatileWebStorage.set(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
};

/**
 * Removes sensitive state from the active platform backend.
 */
export const deleteSecureValue = async (key: string): Promise<void> => {
  if (Platform.OS === "web") {
    volatileWebStorage.delete(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
};
