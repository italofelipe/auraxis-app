import { useEffect, useRef, useState } from "react";

import { useAppShellStore } from "@/core/shell/app-shell-store";

export const SPLASH_MIN_DURATION_MS = 1400;
export const SPLASH_FADE_DURATION_MS = 320;

export type AnimatedSplashPhase = "animating" | "fading" | "hidden";

export interface AnimatedSplashController {
  readonly visible: boolean;
  readonly phase: AnimatedSplashPhase;
}

/**
 * Orquestra o ciclo do splash animado (F3 — épico #540): o overlay anima
 * por pelo menos {@link SPLASH_MIN_DURATION_MS} (zero com reduced motion)
 * e só inicia o fade-out quando o startup (fontes + sessão) está pronto.
 *
 * @param startupReady `true` quando fontes e sessão terminaram de carregar.
 * @returns Fase atual e visibilidade do overlay.
 */
export const useAnimatedSplashController = (
  startupReady: boolean,
): AnimatedSplashController => {
  const reducedMotionEnabled = useAppShellStore(
    (state) => state.reducedMotionEnabled,
  );
  const [minElapsed, setMinElapsed] = useState(reducedMotionEnabled);
  const [phase, setPhase] = useState<AnimatedSplashPhase>("animating");
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reducedMotionEnabled) {
      setMinElapsed(true);
      return undefined;
    }

    const timer = setTimeout(() => {
      setMinElapsed(true);
    }, SPLASH_MIN_DURATION_MS);
    return () => clearTimeout(timer);
  }, [reducedMotionEnabled]);

  useEffect(() => {
    if (phase === "animating" && startupReady && minElapsed) {
      setPhase("fading");
    }
  }, [minElapsed, phase, startupReady]);

  useEffect(() => {
    if (phase !== "fading") {
      return undefined;
    }
    fadeTimerRef.current = setTimeout(() => {
      setPhase("hidden");
    }, SPLASH_FADE_DURATION_MS);
    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [phase]);

  return {
    visible: phase !== "hidden",
    phase,
  };
};
