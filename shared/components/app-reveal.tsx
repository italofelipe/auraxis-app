import type { ReactElement, ReactNode } from "react";

import Animated, { FadeIn } from "react-native-reanimated";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { motionDurations, motionStagger } from "@/shared/theme";

export interface AppRevealProps {
  readonly children: ReactNode;
  /** Posição na lista — escalona o atraso (stagger) da entrada em cascata. */
  readonly index?: number;
  readonly testID?: string;
}

/**
 * Revela o conteúdo com um fade-in escalonado (stagger por `index`),
 * respeitando a preferência de "Reduzir movimento". Use em itens de lista e
 * seções de tela para dar vida sem boilerplate de Reanimated por call-site.
 *
 * @param props Conteúdo e índice opcional para o stagger.
 * @returns Wrapper animado de entrada.
 */
export function AppReveal({
  children,
  index = 0,
  testID,
}: AppRevealProps): ReactElement {
  const reducedMotion = useAppShellStore((state) => state.reducedMotionEnabled);

  return (
    <Animated.View
      testID={testID}
      entering={
        reducedMotion
          ? undefined
          : FadeIn.duration(motionDurations.normal).delay(index * motionStagger)
      }
    >
      {children}
    </Animated.View>
  );
}
