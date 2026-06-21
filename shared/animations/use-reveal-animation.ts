import { useEffect } from "react";

import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import {
  motionDurations,
  motionEasings,
  motionStagger,
  motionTranslate,
} from "@/shared/theme";

/**
 * Máximo de posições que ainda recebem atraso em cascata. Acima disso o item
 * entra sem stagger — evita atraso acumulado (e re-animação na reciclagem da
 * FlashList) em listas longas.
 */
export const REVEAL_STAGGER_CAP = 8;

/** Escala inicial do reveal (transform-only): leve encolhimento antes do repouso. */
export const REVEAL_FROM_SCALE = 0.985;

/** Atraso de entrada (ms) da posição `index`, limitado ao cap e nunca negativo. */
export function revealDelay(index: number): number {
  const clamped = Math.min(Math.max(index, 0), REVEAL_STAGGER_CAP);
  return clamped * motionStagger;
}

export interface RevealOffset {
  readonly translateY: number;
  readonly scale: number;
}

/**
 * Posição inicial do reveal. Com "Reduzir movimento" ativo, parte já do repouso
 * (sem deslocamento), de modo que a entrada seja instantânea.
 */
export function revealFromOffset(reducedMotion: boolean): RevealOffset {
  if (reducedMotion) {
    return { translateY: 0, scale: 1 };
  }
  return { translateY: motionTranslate.revealY, scale: REVEAL_FROM_SCALE };
}

/**
 * Anima a entrada de um item/seção com um deslize curto (`translateY`) e uma
 * leve escala, em cascata por `index`. É **transform-only**: nunca anima
 * opacidade (sem fade). Respeita a preferência "Reduzir movimento".
 *
 * O tipo de retorno é inferido de `useAnimatedStyle` (de propósito — anotá-lo
 * como `ReturnType<typeof useAnimatedStyle>` colapsa para `DefaultStyle` e
 * deixa de casar com o `style` do `Animated.View`).
 *
 * @param index Posição na lista/composição — escalona o atraso da entrada.
 * @returns Estilo animado (transform-only) para aplicar num `Animated.View`.
 */
export function useRevealAnimation(index: number) {
  const reducedMotion = useAppShellStore((state) => state.reducedMotionEnabled);
  const from = revealFromOffset(reducedMotion);
  const translateY = useSharedValue(from.translateY);
  const scale = useSharedValue(from.scale);

  useEffect(() => {
    if (reducedMotion) {
      translateY.value = 0;
      scale.value = 1;
      return;
    }

    const delay = revealDelay(index);
    const timing = {
      duration: motionDurations.normal,
      easing: Easing.bezier(...motionEasings.emphasized),
    };
    translateY.value = withDelay(delay, withTiming(0, timing));
    scale.value = withDelay(delay, withTiming(1, timing));
  }, [index, reducedMotion, scale, translateY]);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));
}
