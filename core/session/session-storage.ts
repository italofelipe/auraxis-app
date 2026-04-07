import * as SecureStore from "expo-secure-store";

import type { StoredSession } from "@/core/session/types";

const SESSION_KEY = "auraxis.session";
const LEGACY_ACCESS_TOKEN_KEY = "auraxis.access-token";
const LEGACY_USER_EMAIL_KEY = "auraxis.user-email";

const parseStoredSession = (payload: string | null): StoredSession | null => {
  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(payload) as StoredSession;

    if (
      typeof parsed.accessToken !== "string" ||
      !parsed.user ||
      typeof parsed.user.email !== "string"
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken:
        typeof parsed.refreshToken === "string" ? parsed.refreshToken : null,
      user: {
        id: typeof parsed.user.id === "string" ? parsed.user.id : null,
        name: typeof parsed.user.name === "string" ? parsed.user.name : null,
        email: parsed.user.email,
        emailConfirmed: parsed.user.emailConfirmed === true,
      },
    };
  } catch {
    return null;
  }
};

const loadLegacySession = async (): Promise<StoredSession | null> => {
  const [accessToken, userEmail] = await Promise.all([
    SecureStore.getItemAsync(LEGACY_ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(LEGACY_USER_EMAIL_KEY),
  ]);

  if (!accessToken || !userEmail) {
    return null;
  }

  return {
    accessToken,
    refreshToken: null,
    user: {
      id: null,
      name: null,
      email: userEmail,
      emailConfirmed: false,
    },
  };
};

export const loadStoredSession = async (): Promise<StoredSession | null> => {
  const payload = await SecureStore.getItemAsync(SESSION_KEY);
  const currentSession = parseStoredSession(payload);

  if (currentSession) {
    return currentSession;
  }

  return loadLegacySession();
};

export const persistStoredSession = async (
  session: StoredSession,
): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session)),
    SecureStore.setItemAsync(LEGACY_ACCESS_TOKEN_KEY, session.accessToken),
    SecureStore.setItemAsync(LEGACY_USER_EMAIL_KEY, session.user.email),
  ]);
};

export const clearStoredSession = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(SESSION_KEY),
    SecureStore.deleteItemAsync(LEGACY_ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(LEGACY_USER_EMAIL_KEY),
  ]);
};
