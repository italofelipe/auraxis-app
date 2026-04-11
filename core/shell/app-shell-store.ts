import { create } from "zustand";

import type { CheckoutReturnIntent } from "@/core/navigation/deep-linking";

export type RuntimeAppState = "unknown" | "active" | "inactive" | "background";
export type RuntimeConnectivityStatus =
  | "unknown"
  | "online"
  | "offline"
  | "degraded";
export type RuntimeDegradedReason =
  | "offline"
  | "probe-timeout"
  | "healthcheck-failed"
  | "runtime-revalidation-failed"
  | "checkout-return-failed"
  | null;

export interface AppShellState {
  readonly fontsReady: boolean;
  readonly reducedMotionEnabled: boolean;
  readonly startupReady: boolean;
  readonly appState: RuntimeAppState;
  readonly connectivityStatus: RuntimeConnectivityStatus;
  readonly runtimeDegradedReason: RuntimeDegradedReason;
  readonly entitlementsVersion: number | null;
  readonly pendingCheckoutReturn: CheckoutReturnIntent | null;
  readonly lastHandledUrl: string | null;
  readonly lastForegroundSyncAt: string | null;
  readonly lastReachabilityCheckAt: string | null;
  setFontsReady: (value: boolean) => void;
  setReducedMotionEnabled: (value: boolean) => void;
  setStartupReady: (value: boolean) => void;
  setAppState: (value: RuntimeAppState) => void;
  setConnectivityStatus: (value: RuntimeConnectivityStatus) => void;
  setRuntimeDegradedReason: (value: RuntimeDegradedReason) => void;
  setEntitlementsVersion: (value: number | null) => void;
  setPendingCheckoutReturn: (value: CheckoutReturnIntent | null) => void;
  setLastHandledUrl: (value: string | null) => void;
  recordForegroundSync: (timestamp: string) => void;
  recordReachabilityCheck: (timestamp: string) => void;
}

export type AppShellStateSnapshot = Pick<
  AppShellState,
  | "fontsReady"
  | "reducedMotionEnabled"
  | "startupReady"
  | "appState"
  | "connectivityStatus"
  | "runtimeDegradedReason"
  | "entitlementsVersion"
  | "pendingCheckoutReturn"
  | "lastHandledUrl"
  | "lastForegroundSyncAt"
  | "lastReachabilityCheckAt"
>;

export const appShellStateDefaults: AppShellStateSnapshot = {
  fontsReady: false,
  reducedMotionEnabled: false,
  startupReady: false,
  appState: "unknown",
  connectivityStatus: "unknown",
  runtimeDegradedReason: null,
  entitlementsVersion: null,
  pendingCheckoutReturn: null,
  lastHandledUrl: null,
  lastForegroundSyncAt: null,
  lastReachabilityCheckAt: null,
};

export const useAppShellStore = create<AppShellState>((set) => ({
  ...appShellStateDefaults,
  setFontsReady: (value: boolean): void => {
    set({ fontsReady: value });
  },
  setReducedMotionEnabled: (value: boolean): void => {
    set({ reducedMotionEnabled: value });
  },
  setStartupReady: (value: boolean): void => {
    set({ startupReady: value });
  },
  setAppState: (value: RuntimeAppState): void => {
    set({ appState: value });
  },
  setConnectivityStatus: (value: RuntimeConnectivityStatus): void => {
    set({ connectivityStatus: value });
  },
  setRuntimeDegradedReason: (value: RuntimeDegradedReason): void => {
    set({ runtimeDegradedReason: value });
  },
  setEntitlementsVersion: (value: number | null): void => {
    set({ entitlementsVersion: value });
  },
  setPendingCheckoutReturn: (value: CheckoutReturnIntent | null): void => {
    set({ pendingCheckoutReturn: value });
  },
  setLastHandledUrl: (value: string | null): void => {
    set({ lastHandledUrl: value });
  },
  recordForegroundSync: (timestamp: string): void => {
    set({ lastForegroundSyncAt: timestamp });
  },
  recordReachabilityCheck: (timestamp: string): void => {
    set({ lastReachabilityCheckAt: timestamp });
  },
}));

/**
 * Resets the app shell store to its default state (test utility).
 */
export const resetAppShellStore = (
  overrides: Partial<AppShellStateSnapshot> = {},
): void => {
  useAppShellStore.setState({
    ...appShellStateDefaults,
    ...overrides,
  });
};
