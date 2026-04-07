import { useEffect } from "react";

import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { motionDurations, motionOpacity } from "@/shared/theme/motion";

export interface PresenceAnimation {
  readonly animatedStyle: ReturnType<typeof useAnimatedStyle>;
}

export const usePresenceAnimation = (visible: boolean): PresenceAnimation => {
  const reducedMotionEnabled = useAppShellStore(
    (state) => state.reducedMotionEnabled,
  );
  const opacity = useSharedValue(
    visible ? motionOpacity.visible : motionOpacity.hidden,
  );

  useEffect(() => {
    const nextValue = visible ? motionOpacity.visible : motionOpacity.hidden;

    if (reducedMotionEnabled) {
      opacity.value = nextValue;
      return;
    }

    opacity.value = withTiming(nextValue, {
      duration: motionDurations.normal,
    });
  }, [opacity, reducedMotionEnabled, visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return {
    animatedStyle,
  };
};
