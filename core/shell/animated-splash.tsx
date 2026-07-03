import { useEffect, useMemo, type ReactElement } from "react";

import * as SplashScreen from "expo-splash-screen";
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { typography } from "@/config/design-tokens";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import {
  SPLASH_FADE_DURATION_MS,
  useAnimatedSplashController,
} from "@/core/shell/use-animated-splash-controller";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import {
  SPLASH_PARTICLE_COUNT,
  SPLASH_WORDMARK,
  buildSplashParticles,
  wordmarkLetterDelay,
  type SplashParticle,
} from "@/core/shell/splash-scene";
import { AppGradient } from "@/shared/components/app-gradient";
import { AppImage } from "@/shared/components/app-image";
import { darkSemanticColors, lightSemanticColors } from "@/shared/theme";

const ICON_SIZE = 116;
const AURA_SIZE = 320;
const LOGO_ENTER_DURATION_MS = 620;
const LOGO_ENTER_DELAY_MS = 80;
const LOGO_SETTLE_DURATION_MS = 220;
const AURA_BREATHE_DURATION_MS = 1800;
const SHIMMER_DURATION_MS = 1200;
const WORDMARK_ENTER_DURATION_MS = 460;

/** Curva "emphasized" (Material) para entradas expressivas. */
const EMPHASIZED = Easing.bezier(0.16, 1, 0.3, 1);

const splashIcon = require("../../assets/images/splash-icon.png");

export interface AnimatedSplashProps {
  readonly startupReady: boolean;
}

/**
 * Glow radial (a "aura" da marca) que pulsa suavemente atrás da logo. Usa um
 * `RadialGradient` do SVG (cor da marca → transparente); a respiração é feita no
 * `Animated.View` que o envolve, evitando animar atributos do SVG.
 */
function AuraGlow({
  color,
  reduced,
}: {
  readonly color: string;
  readonly reduced: boolean;
}): ReactElement {
  const scale = useSharedValue(reduced ? 1 : 0.9);
  const opacity = useSharedValue(reduced ? 0.5 : 0.35);

  useEffect(() => {
    if (reduced) {
      return;
    }
    scale.value = withRepeat(
      withTiming(1.12, {
        duration: AURA_BREATHE_DURATION_MS,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withTiming(0.6, {
        duration: AURA_BREATHE_DURATION_MS,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [opacity, reduced, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      testID="splash-aura"
      pointerEvents="none"
      style={[styles.auraContainer, style] as StyleProp<ViewStyle>}
    >
      <Svg width={AURA_SIZE} height={AURA_SIZE}>
        <Defs>
          <RadialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <Stop offset="70%" stopColor={color} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={AURA_SIZE / 2}
          cy={AURA_SIZE / 2}
          r={AURA_SIZE / 2}
          fill="url(#auraGrad)"
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * "Mote" de luz que sobe e some em loop, com atraso/duração próprios. Em
 * "reduzir movimento" fica estático numa opacidade discreta.
 */
function DriftParticle({
  particle,
  color,
  reduced,
}: {
  readonly particle: SplashParticle;
  readonly color: string;
  readonly reduced: boolean;
}): ReactElement {
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      return;
    }
    progress.value = withDelay(
      particle.delayMs,
      withRepeat(
        withTiming(1, {
          duration: particle.durationMs,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        false,
      ),
    );
  }, [particle.delayMs, particle.durationMs, progress, reduced]);

  const style = useAnimatedStyle(() => {
    if (reduced) {
      return { opacity: particle.maxOpacity * 0.5, transform: [{ translateY: 0 }] };
    }
    const p = progress.value;
    return {
      opacity: Math.sin(p * Math.PI) * particle.maxOpacity,
      transform: [{ translateY: -p * particle.driftY }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={
        [
          {
            position: "absolute",
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            borderRadius: particle.size / 2,
            backgroundColor: color,
          },
          style,
        ] as StyleProp<ViewStyle>
      }
    />
  );
}

/**
 * Logo da marca com entrada (fade + scale com leve overshoot) e um brilho
 * ("shimmer") diagonal que cruza a arte uma vez após ela assentar.
 */
function LogoMark({ reduced }: { readonly reduced: boolean }): ReactElement {
  const scale = useSharedValue(reduced ? 1 : 0.82);
  const opacity = useSharedValue(reduced ? 1 : 0);
  const shimmerX = useSharedValue(-ICON_SIZE);

  useEffect(() => {
    if (reduced) {
      return;
    }
    opacity.value = withDelay(
      LOGO_ENTER_DELAY_MS,
      withTiming(1, { duration: LOGO_ENTER_DURATION_MS, easing: EMPHASIZED }),
    );
    scale.value = withDelay(
      LOGO_ENTER_DELAY_MS,
      withSequence(
        withTiming(1.04, { duration: LOGO_ENTER_DURATION_MS, easing: EMPHASIZED }),
        withTiming(1, {
          duration: LOGO_SETTLE_DURATION_MS,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );
    shimmerX.value = withDelay(
      LOGO_ENTER_DELAY_MS + LOGO_ENTER_DURATION_MS,
      withRepeat(
        withTiming(ICON_SIZE, {
          duration: SHIMMER_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
        }),
        2,
        false,
      ),
    );
  }, [opacity, reduced, scale, shimmerX]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { rotate: "18deg" }],
  }));

  return (
    <Animated.View
      testID="splash-logo"
      style={[styles.logoContainer, logoStyle] as StyleProp<ViewStyle>}
    >
      <AppImage
        source={splashIcon}
        style={styles.logo}
        contentFit="contain"
        fade={false}
      />
      {!reduced && (
        <Animated.View
          pointerEvents="none"
          style={[styles.shimmer, shimmerStyle] as StyleProp<ViewStyle>}
        >
          <AppGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.35)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerBand}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

/** Uma letra do wordmark, com reveal em cascata (fade + subida). */
function WordmarkLetter({
  char,
  index,
  color,
  reduced,
}: {
  readonly char: string;
  readonly index: number;
  readonly color: string;
  readonly reduced: boolean;
}): ReactElement {
  const opacity = useSharedValue(reduced ? 1 : 0);
  const translateY = useSharedValue(reduced ? 0 : 10);

  useEffect(() => {
    if (reduced) {
      return;
    }
    const delay = wordmarkLetterDelay(index);
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: WORDMARK_ENTER_DURATION_MS, easing: EMPHASIZED }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: WORDMARK_ENTER_DURATION_MS, easing: EMPHASIZED }),
    );
  }, [index, opacity, reduced, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[styles.wordmarkLetter, { color }, style]}>
      {char}
    </Animated.Text>
  );
}

/**
 * Overlay de splash animado premium (issue #642, épico #540): assume o lugar do
 * splash nativo no primeiro frame JS e encena a marca — gradiente de fundo do
 * tema, aura pulsante, partículas à deriva, logo com shimmer e reveal do
 * wordmark "Auraxis" — fazendo fade-out quando o app fica pronto. Respeita
 * "reduzir movimento" (cena estática) e mantém `pointerEvents="none"` para nunca
 * bloquear a navegação. A logo final substitui `assets/images/splash-icon.png`
 * quando a arte definitiva chegar.
 */
export function AnimatedSplash({
  startupReady,
}: AnimatedSplashProps): ReactElement | null {
  const { visible, phase } = useAnimatedSplashController(startupReady);
  const reducedMotionEnabled = useAppShellStore(
    (state) => state.reducedMotionEnabled,
  );
  const resolvedTheme = useResolvedTheme();
  const { width, height } = useWindowDimensions();
  const palette =
    resolvedTheme === "auraxis_dark" ? darkSemanticColors : lightSemanticColors;

  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    // O splash nativo pode sair assim que o overlay JS está montado.
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (phase === "fading") {
      overlayOpacity.value = withTiming(0, { duration: SPLASH_FADE_DURATION_MS });
    }
  }, [overlayOpacity, phase]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const particles = useMemo(
    () => buildSplashParticles(SPLASH_PARTICLE_COUNT, { width, height }),
    [width, height],
  );

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
          { backgroundColor: palette.background },
          overlayStyle,
        ] as StyleProp<ViewStyle>
      }
    >
      {particles.map((particle) => (
        <DriftParticle
          key={particle.key}
          particle={particle}
          color={palette.primary}
          reduced={reducedMotionEnabled}
        />
      ))}
      <View style={styles.centerGroup}>
        <AuraGlow color={palette.primary} reduced={reducedMotionEnabled} />
        <LogoMark reduced={reducedMotionEnabled} />
        <View testID="splash-wordmark" style={styles.wordmarkRow}>
          {[...SPLASH_WORDMARK].map((char, index) => (
            <WordmarkLetter
              key={`${char}-${index}`}
              char={char}
              index={index}
              color={palette.foreground}
              reduced={reducedMotionEnabled}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centerGroup: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  auraContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  shimmer: {
    position: "absolute",
    top: -ICON_SIZE * 0.25,
    bottom: -ICON_SIZE * 0.25,
    width: ICON_SIZE * 0.5,
  },
  shimmerBand: {
    flex: 1,
  },
  wordmarkRow: {
    flexDirection: "row",
    marginTop: 22,
  },
  wordmarkLetter: {
    fontFamily: typography.heading,
    fontSize: 30,
    letterSpacing: 1.5,
  },
});
