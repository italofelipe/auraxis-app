import { create } from "zustand";

export interface AppShellState {
  readonly fontsReady: boolean;
  readonly reducedMotionEnabled: boolean;
  setFontsReady: (value: boolean) => void;
  setReducedMotionEnabled: (value: boolean) => void;
}

export const useAppShellStore = create<AppShellState>((set) => ({
  fontsReady: false,
  reducedMotionEnabled: false,
  setFontsReady: (value: boolean): void => {
    set({ fontsReady: value });
  },
  setReducedMotionEnabled: (value: boolean): void => {
    set({ reducedMotionEnabled: value });
  },
}));
