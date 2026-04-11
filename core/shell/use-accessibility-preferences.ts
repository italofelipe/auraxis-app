import { useEffect } from "react";
import { AccessibilityInfo } from "react-native";

import { useAppShellStore } from "@/core/shell/app-shell-store";

const REDUCE_MOTION_EVENT = "reduceMotionChanged";

export const useAccessibilityPreferences = (enabled = true): void => {
  const setReducedMotionEnabled = useAppShellStore(
    (state) => state.setReducedMotionEnabled,
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let subscribed = true;

    const syncReduceMotion = async (): Promise<void> => {
      const reducedMotionEnabled =
        await AccessibilityInfo.isReduceMotionEnabled();

      if (subscribed) {
        setReducedMotionEnabled(reducedMotionEnabled);
      }
    };

    void syncReduceMotion();

    const subscription = AccessibilityInfo.addEventListener(
      REDUCE_MOTION_EVENT,
      (enabled: boolean): void => {
        setReducedMotionEnabled(enabled);
      },
    );

    return (): void => {
      subscribed = false;
      subscription.remove();
    };
  }, [enabled, setReducedMotionEnabled]);
};
