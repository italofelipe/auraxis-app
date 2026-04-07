import { create } from "zustand";

import {
  clearStoredSession,
  loadStoredSession,
  persistStoredSession,
} from "@/core/session/session-storage";
import type { SessionUser, StoredSession } from "@/core/session/types";

interface SessionState {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly user: SessionUser | null;
  readonly userEmail: string | null;
  readonly hydrated: boolean;
  readonly isAuthenticated: boolean;
  bootstrapSession: () => Promise<void>;
  signIn: (
    session: StoredSession | string,
    userEmail?: string,
    userName?: string,
  ) => Promise<void>;
  setSession: (session: StoredSession | null) => Promise<void>;
  updateUser: (user: SessionUser) => void;
  signOut: () => Promise<void>;
}

const unauthenticatedState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  userEmail: null,
  hydrated: false,
  isAuthenticated: false,
} as const;

const toStoredSession = (
  session: StoredSession | string,
  userEmail?: string,
  userName?: string,
): StoredSession => {
  if (typeof session !== "string") {
    return session;
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
    hydrated: true,
    isAuthenticated: true,
  };
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
        const storedSession = await loadStoredSession();
        set(toState(storedSession));
      })().finally(() => {
        bootstrapSessionPromise = null;
      });
    }

    await bootstrapSessionPromise;
  },
  signIn: async (
    session: StoredSession | string,
    userEmail?: string,
    userName?: string,
  ): Promise<void> => {
    const nextSession = toStoredSession(session, userEmail, userName);
    await persistStoredSession(nextSession);
    set(toState(nextSession));
  },
  setSession: async (session: StoredSession | null): Promise<void> => {
    if (session === null) {
      await clearStoredSession();
      set(toState(null));
      return;
    }

    await persistStoredSession(session);
    set(toState(session));
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
    };

    void persistStoredSession(nextSession);
    set({
      user,
      userEmail: user.email,
    });
  },
  signOut: async (): Promise<void> => {
    await clearStoredSession();
    set(toState(null));
  },
}));
