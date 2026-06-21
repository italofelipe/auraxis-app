import type { ReactElement, ReactNode } from "react";

import Animated from "react-native-reanimated";

import { useRevealAnimation } from "@/shared/animations/use-reveal-animation";

export interface RevealInViewProps {
  readonly children: ReactNode;
  /** Posição na lista/composição — escalona o atraso (stagger) da entrada. */
  readonly index?: number;
  readonly testID?: string;
}

/**
 * Revela o conteúdo com um deslize curto + leve escala (**transform-only**, sem
 * fade por opacidade), em cascata por `index`, respeitando "Reduzir movimento".
 * Análogo ao `AppReveal`, porém sem animar opacidade.
 *
 * @param props Conteúdo, índice opcional para o stagger e estilo/testID.
 * @returns Wrapper animado de entrada (transform-only).
 */
export function RevealInView({
  children,
  index = 0,
  testID,
}: RevealInViewProps): ReactElement {
  const animatedStyle = useRevealAnimation(index);

  return (
    <Animated.View testID={testID} style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
