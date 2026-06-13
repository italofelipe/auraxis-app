import { useEffect, type ReactElement } from "react";

import * as SplashScreen from "expo-splash-screen";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import {
  SPLASH_FADE_DURATION_MS,
  useAnimatedSplashController,
} from "@/core/shell/use-animated-splash-controller";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { AppImage } from "@/shared/components/app-image";
import { darkSemanticColors, lightSemanticColors } from "@/shared/theme";

const ICON_SIZE = 112;
const PULSE_SCALE = 1.08;
const PULSE_DURATION_MS = 700;

const splashIcon = require("../../assets/images/splash-icon.png");

export interface AnimatedSplashProps {
  readonly startupReady: boolean;
}

/**
 * Overlay de splash animado (F3 — épico #540): assume o lugar do splash
 * nativo no primeiro frame JS, pulsa o monograma enquanto fontes/sessão
 * carregam e faz fade-out quando o app está pronto. A logo final
 * substitui `assets/images/splash-icon.png` quando a arte chegar.
 */
export function AnimatedSplash({ startupReady }: AnimatedSplashProps): ReactElement | null {
  const { visible, phase } = useAnimatedSplashController(startupReady);
  const reducedMotionEnabled = useAppShellStore(
    (state) => state.reducedMotionEnabled,
  );
  const resolvedTheme = useResolvedTheme();
  const palette =
    resolvedTheme === "auraxis_dark" ? darkSemanticColors : lightSemanticColors;

  const pulse = useSharedValue(1);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    // O splash nativo pode sair assim que o overlay JS está montado.
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (reducedMotionEnabled) {
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(PULSE_SCALE, {
          duration: PULSE_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, {
          duration: PULSE_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
    );
  }, [pulse, reducedMotionEnabled]);

  useEffect(() => {
    if (phase === "fading") {
      overlayOpacity.value = withTiming(0, { duration: SPLASH_FADE_DURATION_MS });
    }
  }, [overlayOpacity, phase]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      testID="animated-splash"
      pointerEvents="none"
      style={
        [
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: palette.background,
            alignItems: "center",
            justifyContent: "center",
          },
          overlayStyle,
        ] as StyleProp<ViewStyle>
      }
    >
      <Animated.View style={iconStyle as StyleProp<ViewStyle>}>
        <AppImage
          source={splashIcon}
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
          contentFit="contain"
          fade={false}
        />
      </Animated.View>
    </Animated.View>
  );
}
