import { useCallback } from "react";

import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { motionDurations, motionScales } from "@/shared/theme/motion";

export interface PressScaleAnimation {
  readonly animatedStyle: ReturnType<typeof useAnimatedStyle>;
  readonly onPressIn: () => void;
  readonly onPressOut: () => void;
}

export const usePressScaleAnimation = (): PressScaleAnimation => {
  const reducedMotionEnabled = useAppShellStore(
    (state) => state.reducedMotionEnabled,
  );
  const scale = useSharedValue<number>(motionScales.pressOut);

  const animateTo = useCallback(
    (nextValue: number): void => {
      if (reducedMotionEnabled) {
        scale.value = nextValue;
        return;
      }

      scale.value = withTiming(nextValue, {
        duration: motionDurations.fast,
      });
    },
    [reducedMotionEnabled, scale],
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return {
    animatedStyle,
    onPressIn: (): void => {
      animateTo(motionScales.pressIn);
    },
    onPressOut: (): void => {
      animateTo(motionScales.pressOut);
    },
  };
};
