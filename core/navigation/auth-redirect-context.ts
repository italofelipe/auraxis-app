import { create } from "zustand";

import { isPrivateAppRoute, type PrivateAppRoute } from "@/core/navigation/routes";

interface AuthRedirectState {
  readonly intendedRoute: PrivateAppRoute | null;
  capture: (path: string) => void;
  consume: () => PrivateAppRoute | null;
  clear: () => void;
}

/**
 * Holds the route the user was trying to reach when redirected to /login.
 * The login controller consumes (read + clear) this value after a successful
 * authentication so the user lands on the page they originally requested
 * instead of being forced to /dashboard. Mirrors the web flow where
 * `useAuthRedirectContext` preserves intent across the auth roundtrip.
 *
 * Only canonical private routes are kept — strings outside the registry are
 * silently ignored to avoid open-redirect surface.
 */
export const useAuthRedirectStore = create<AuthRedirectState>((set, get) => ({
  intendedRoute: null,
  capture: (path: string): void => {
    if (!isPrivateAppRoute(path)) {
      return;
    }
    set({ intendedRoute: path });
  },
  consume: (): PrivateAppRoute | null => {
    const current = get().intendedRoute;
    if (current === null) {
      return null;
    }
    set({ intendedRoute: null });
    return current;
  },
  clear: (): void => {
    set({ intendedRoute: null });
  },
}));
