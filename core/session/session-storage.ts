import * as SecureStore from "expo-secure-store";

import { withSessionMetadata } from "@/core/session/session-policy";
import type { StoredSession } from "@/core/session/types";

const SESSION_KEY = "auraxis.session";
const LEGACY_ACCESS_TOKEN_KEY = "auraxis.access-token";
const LEGACY_USER_EMAIL_KEY = "auraxis.user-email";

export interface LoadedStoredSession {
  readonly session: StoredSession | null;
  readonly source: "canonical" | "legacy" | "none";
  readonly invalidStoredPayload: boolean;
}

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

    return withSessionMetadata({
      accessToken: parsed.accessToken,
      refreshToken:
        typeof parsed.refreshToken === "string" ? parsed.refreshToken : null,
      user: {
        id: typeof parsed.user.id === "string" ? parsed.user.id : null,
        name: typeof parsed.user.name === "string" ? parsed.user.name : null,
        email: parsed.user.email,
        emailConfirmed: parsed.user.emailConfirmed === true,
      },
      authenticatedAt:
        typeof parsed.authenticatedAt === "string"
          ? parsed.authenticatedAt
          : null,
      expiresAt:
        typeof parsed.expiresAt === "string" ? parsed.expiresAt : null,
    });
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

  return withSessionMetadata({
    accessToken,
    refreshToken: null,
    user: {
      id: null,
      name: null,
      email: userEmail,
      emailConfirmed: false,
    },
    authenticatedAt: null,
    expiresAt: null,
  });
};

export const loadStoredSession = async (): Promise<LoadedStoredSession> => {
  const payload = await SecureStore.getItemAsync(SESSION_KEY);
  const hasCanonicalPayload = typeof payload === "string" && payload.length > 0;
  const canonicalSession = parseStoredSession(payload);

  if (canonicalSession) {
    return {
      session: canonicalSession,
      source: "canonical",
      invalidStoredPayload: false,
    };
  }

  const legacySession = await loadLegacySession();
  if (legacySession) {
    return {
      session: legacySession,
      source: "legacy",
      invalidStoredPayload: hasCanonicalPayload,
    };
  }

  return {
    session: null,
    source: "none",
    invalidStoredPayload: hasCanonicalPayload,
  };
};

export const persistStoredSession = async (
  session: StoredSession,
): Promise<void> => {
  const nextSession = withSessionMetadata(session);
  await Promise.all([
    SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(nextSession)),
    SecureStore.setItemAsync(LEGACY_ACCESS_TOKEN_KEY, nextSession.accessToken),
    SecureStore.setItemAsync(LEGACY_USER_EMAIL_KEY, nextSession.user.email),
  ]);
};

export const clearStoredSession = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(SESSION_KEY),
    SecureStore.deleteItemAsync(LEGACY_ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(LEGACY_USER_EMAIL_KEY),
  ]);
};
