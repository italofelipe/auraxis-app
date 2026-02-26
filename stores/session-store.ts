import { create } from "zustand";

import {
  clearStoredSession,
  loadStoredSession,
  persistStoredSession,
} from "@/lib/secure-storage";

interface SessionState {
  readonly accessToken: string | null;
  readonly userEmail: string | null;
  readonly hydrated: boolean;
  readonly isAuthenticated: boolean;
  bootstrapSession: () => Promise<void>;
  signIn: (accessToken: string, userEmail: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const defaultState = {
  accessToken: null,
  userEmail: null,
  hydrated: false,
} as const;

export const useSessionStore = create<SessionState>((set) => ({
  ...defaultState,
  isAuthenticated: false,
  bootstrapSession: async (): Promise<void> => {
    const storedSession = await loadStoredSession();

    if (!storedSession) {
      set({ ...defaultState, hydrated: true, isAuthenticated: false });
      return;
    }

    set({
      accessToken: storedSession.accessToken,
      userEmail: storedSession.userEmail,
      hydrated: true,
      isAuthenticated: true,
    });
  },
  signIn: async (accessToken: string, userEmail: string): Promise<void> => {
    await persistStoredSession({ accessToken, userEmail });
    set({ accessToken, userEmail, hydrated: true, isAuthenticated: true });
  },
  signOut: async (): Promise<void> => {
    await clearStoredSession();
    set({ ...defaultState, hydrated: true, isAuthenticated: false });
  },
}));
