import { create } from "zustand";

import {
  clearLegacyStoredSession,
  clearStoredSession,
  loadStoredSession,
  persistStoredSession,
} from "@/core/session/session-storage";
import {
  isStoredSessionExpired,
  withSessionMetadata,
} from "@/core/session/session-policy";
import { appLogger } from "@/core/telemetry/app-logger";
import type {
  SessionSeed,
  SessionInvalidationReason,
  SessionUser,
  StoredSession,
} from "@/core/session/types";

interface SessionState {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly user: SessionUser | null;
  readonly userEmail: string | null;
  readonly authenticatedAt: string | null;
  readonly expiresAt: string | null;
  readonly authFailureReason: SessionInvalidationReason | null;
  readonly lastValidatedAt: string | null;
  readonly lastInvalidatedAt: string | null;
  readonly hydrated: boolean;
  readonly isAuthenticated: boolean;
  bootstrapSession: () => Promise<void>;
  signIn: (
    session: SessionSeed | StoredSession | string,
    userEmail?: string,
    userName?: string,
  ) => Promise<void>;
  setSession: (session: StoredSession | null) => Promise<void>;
  updateUser: (user: SessionUser) => void;
  markSessionValidated: (timestamp: string) => void;
  dismissAuthFailure: () => void;
  invalidateSession: (reason: SessionInvalidationReason) => Promise<void>;
  signOut: (reason?: SessionInvalidationReason) => Promise<void>;
}

const unauthenticatedState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  userEmail: null,
  authenticatedAt: null,
  expiresAt: null,
  authFailureReason: null,
  lastValidatedAt: null,
  lastInvalidatedAt: null,
  hydrated: false,
  isAuthenticated: false,
} as const;

const toStoredSession = (
  session: SessionSeed | StoredSession | string,
  userEmail?: string,
  userName?: string,
): StoredSession => {
  if (typeof session !== "string") {
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      authenticatedAt: session.authenticatedAt ?? null,
      expiresAt: session.expiresAt ?? null,
    };
  }

  return {
    accessToken: session,
    refreshToken: null,
    user: {
      id: null,
      name: userName ?? null,
      email: userEmail ?? "",
      emailConfirmed: false,
    },
    authenticatedAt: null,
    expiresAt: null,
  };
};

const toState = (session: StoredSession | null): Partial<SessionState> => {
  if (!session) {
    return {
      ...unauthenticatedState,
      hydrated: true,
    };
  }

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
    userEmail: session.user.email,
    authenticatedAt: session.authenticatedAt,
    expiresAt: session.expiresAt,
    authFailureReason: null,
    hydrated: true,
    isAuthenticated: true,
  };
};

const createInvalidatedState = (
  reason: SessionInvalidationReason,
  timestamp: string,
): Partial<SessionState> => {
  return {
    ...toState(null),
    authFailureReason: reason,
    lastInvalidatedAt: timestamp,
  };
};

const logSessionRehydrated = (context: Record<string, unknown>): void => {
  appLogger.info({
    domain: "startup",
    event: "startup.session_rehydrated",
    context,
  });
};

let bootstrapSessionPromise: Promise<void> | null = null;

export const useSessionStore = create<SessionState>((set, get) => ({
  ...unauthenticatedState,
  bootstrapSession: async (): Promise<void> => {
    if (get().hydrated) {
      return;
    }

    if (!bootstrapSessionPromise) {
      bootstrapSessionPromise = (async (): Promise<void> => {
        const loadedSession = await loadStoredSession();
        const migratedLegacySession = loadedSession.source === "legacy";

        if (loadedSession.source === "legacy" && loadedSession.session) {
          await persistStoredSession(loadedSession.session);
          await clearLegacyStoredSession();
        }

        if (
          loadedSession.session &&
          isStoredSessionExpired(loadedSession.session)
        ) {
          await clearStoredSession();
          set(createInvalidatedState("expired", new Date().toISOString()));
          logSessionRehydrated({
            authenticated: false,
            source: loadedSession.source,
            migratedLegacySession,
            invalidStoredPayload: loadedSession.invalidStoredPayload,
            invalidationReason: "expired",
          });
          return;
        }

        if (!loadedSession.session && loadedSession.invalidStoredPayload) {
          await clearStoredSession();
          set(
            createInvalidatedState("bootstrap-invalid", new Date().toISOString()),
          );
          logSessionRehydrated({
            authenticated: false,
            source: loadedSession.source,
            migratedLegacySession,
            invalidStoredPayload: true,
            invalidationReason: "bootstrap-invalid",
          });
          return;
        }

        set(toState(loadedSession.session));
        logSessionRehydrated({
          authenticated: loadedSession.session !== null,
          source: loadedSession.source,
          migratedLegacySession,
          invalidStoredPayload: loadedSession.invalidStoredPayload,
          hasRefreshToken: loadedSession.session?.refreshToken !== null,
          emailConfirmed: loadedSession.session?.user.emailConfirmed ?? null,
        });
      })().finally(() => {
        bootstrapSessionPromise = null;
      });
    }

    await bootstrapSessionPromise;
  },
  signIn: async (
    session: SessionSeed | StoredSession | string,
    userEmail?: string,
    userName?: string,
  ): Promise<void> => {
    const nextSession = withSessionMetadata(
      toStoredSession(session, userEmail, userName),
    );
    await persistStoredSession(nextSession);
    set(toState(nextSession));
    appLogger.info({
      domain: "auth",
      event: "auth.session_established",
      context: {
        hasRefreshToken: nextSession.refreshToken !== null,
        emailConfirmed: nextSession.user.emailConfirmed,
        hasUserId: nextSession.user.id !== null,
      },
    });
  },
  setSession: async (session: StoredSession | null): Promise<void> => {
    if (session === null) {
      await clearStoredSession();
      set(toState(null));
      return;
    }

    const nextSession = withSessionMetadata(session);
    await persistStoredSession(nextSession);
    set(toState(nextSession));
  },
  updateUser: (user: SessionUser): void => {
    const state = get();
    if (!state.accessToken) {
      return;
    }

    const nextSession: StoredSession = {
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user,
      authenticatedAt: state.authenticatedAt,
      expiresAt: state.expiresAt,
    };

    void persistStoredSession(nextSession);
    set({
      user,
      userEmail: user.email,
    });
  },
  markSessionValidated: (timestamp: string): void => {
    set({
      lastValidatedAt: timestamp,
      authFailureReason: null,
    });
  },
  dismissAuthFailure: (): void => {
    set({
      authFailureReason: null,
    });
  },
  invalidateSession: async (reason: SessionInvalidationReason): Promise<void> => {
    const timestamp = new Date().toISOString();
    await clearStoredSession();
    set(createInvalidatedState(reason, timestamp));
  },
  signOut: async (reason: SessionInvalidationReason = "manual"): Promise<void> => {
    await get().invalidateSession(reason);
  },
}));
