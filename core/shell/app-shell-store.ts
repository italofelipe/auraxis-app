import { create } from "zustand";

import type { CheckoutReturnIntent } from "@/core/navigation/deep-linking";

export type RuntimeAppState = "unknown" | "active" | "inactive" | "background";

export interface AppShellState {
  readonly fontsReady: boolean;
  readonly reducedMotionEnabled: boolean;
  readonly startupReady: boolean;
  readonly appState: RuntimeAppState;
  readonly entitlementsVersion: number | null;
  readonly pendingCheckoutReturn: CheckoutReturnIntent | null;
  readonly lastHandledUrl: string | null;
  readonly lastForegroundSyncAt: string | null;
  setFontsReady: (value: boolean) => void;
  setReducedMotionEnabled: (value: boolean) => void;
  setStartupReady: (value: boolean) => void;
  setAppState: (value: RuntimeAppState) => void;
  setEntitlementsVersion: (value: number | null) => void;
  setPendingCheckoutReturn: (value: CheckoutReturnIntent | null) => void;
  setLastHandledUrl: (value: string | null) => void;
  recordForegroundSync: (timestamp: string) => void;
}

export const useAppShellStore = create<AppShellState>((set) => ({
  fontsReady: false,
  reducedMotionEnabled: false,
  startupReady: false,
  appState: "unknown",
  entitlementsVersion: null,
  pendingCheckoutReturn: null,
  lastHandledUrl: null,
  lastForegroundSyncAt: null,
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
}));
