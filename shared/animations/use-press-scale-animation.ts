import { useCallback } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { motionDurations, motionScales } from "@/shared/theme/motion";

export interface PressScaleAnimation {
  // Tipado como StyleProp<ViewStyle> para casar direto com `Animated.View`
  // (o retorno cru de useAnimatedStyle é largo demais — inclui `cursor` de
  // TextStyle e não assina no style da View).
  readonly animatedStyle: StyleProp<ViewStyle>;
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
    animatedStyle: animatedStyle as StyleProp<ViewStyle>,
    onPressIn: (): void => {
      animateTo(motionScales.pressIn);
    },
    onPressOut: (): void => {
      animateTo(motionScales.pressOut);
    },
  };
};
