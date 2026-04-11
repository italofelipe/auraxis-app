import type { SessionStateSnapshot } from "@/core/session/session-store";
import {
  resetSessionStore,
  sessionStateDefaults,
} from "@/core/session/session-store";
import type {
  SessionSeed,
  SessionUser,
  StoredSession,
} from "@/core/session/types";
import type { AppShellStateSnapshot } from "@/core/shell/app-shell-store";
import {
  appShellStateDefaults,
  resetAppShellStore,
} from "@/core/shell/app-shell-store";

const defaultSessionUser: SessionUser = {
  id: "user-1",
  name: "Italo",
  email: "italo@auraxis.dev",
  emailConfirmed: true,
};

const defaultStoredSession: StoredSession = {
  accessToken: "header.payload.signature",
  refreshToken: "refresh-token",
  user: defaultSessionUser,
  authenticatedAt: "2026-04-08T10:00:00.000Z",
  expiresAt: "2099-04-08T12:00:00.000Z",
};

/**
 * Builds a canonical session user fixture for tests.
 */
export const makeSessionUser = (
  overrides: Partial<SessionUser> = {},
): SessionUser => {
  return {
    ...defaultSessionUser,
    ...overrides,
  };
};

/**
 * Builds a stored session fixture with sensible defaults.
 */
export const makeStoredSession = (
  overrides: Partial<StoredSession> = {},
): StoredSession => {
  const resolvedUser = overrides.user ?? makeSessionUser();

  return {
    ...defaultStoredSession,
    ...overrides,
    user: resolvedUser,
  };
};

/**
 * Builds a session seed fixture (pre-persistence) for tests.
 */
export const makeSessionSeed = (
  overrides: Partial<SessionSeed> = {},
): SessionSeed => {
  const resolvedUser = overrides.user ?? makeSessionUser();

  return {
    accessToken: overrides.accessToken ?? "seed-access-token",
    refreshToken: overrides.refreshToken ?? null,
    authenticatedAt: overrides.authenticatedAt ?? null,
    expiresAt: overrides.expiresAt ?? null,
    ...overrides,
    user: resolvedUser,
  };
};

/**
 * Builds an app shell snapshot for store hydration in tests.
 */
export const makeAppShellState = (
  overrides: Partial<AppShellStateSnapshot> = {},
): AppShellStateSnapshot => {
  return {
    ...appShellStateDefaults,
    ...overrides,
  };
};

/**
 * Builds a session store snapshot for store hydration in tests.
 */
export const makeSessionState = (
  overrides: Partial<SessionStateSnapshot> = {},
): SessionStateSnapshot => {
  return {
    ...sessionStateDefaults,
    ...overrides,
  };
};

/**
 * Resets runtime stores to a known base state for tests.
 */
export const resetRuntimeStores = (options: {
  readonly appShell?: Partial<AppShellStateSnapshot>;
  readonly session?: Partial<SessionStateSnapshot>;
} = {}): void => {
  resetAppShellStore(options.appShell);
  resetSessionStore(options.session);
};
