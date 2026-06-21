/**
 * Camada visual do spotlight: quatro painéis de escurecimento ao redor do
 * recorte + o anel branco e o glow teal sobre o alvo. Em passos centralizados,
 * escurece a tela inteira (sem recorte).
 *
 * NUNCA usa um único box-shadow gigante: são quatro `View`s opacas (geometria
 * calculada por `computeDimPanels`) — renderização estável em todos os devices.
 * As mudanças de recorte entre passos são animadas com reanimated (~280ms).
 */
import { useEffect, type ReactElement } from "react";

import { useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import {
  computeDimPanels,
  type Rect,
  type ViewportSize,
} from "@/shared/coach-marks/coach-marks-geometry";
import { coachMarks } from "@/shared/theme/coach-marks-tokens";
import { motionEasings } from "@/shared/theme/motion";

/** Duração da animação de transição do recorte entre passos (ms). */
const CUTOUT_TRANSITION_MS = 280;

/** Espessura do anel branco do recorte (px). */
const RING_WIDTH = 2;

/** Espessura do glow teal projetado ao redor do anel (px). */
const GLOW_WIDTH = 4;

/** Props do overlay do spotlight. */
export interface CoachMarksOverlayProps {
  /** Recorte (já com padding) em coordenadas de janela, ou null (centralizado). */
  readonly cutout: Rect | null;
  /** Raio dos cantos do recorte (px). */
  readonly radius: number;
}

/**
 * Renderiza os quatro painéis de dim ao redor do recorte. Cada painel é uma
 * `View` opaca posicionada absolutamente.
 *
 * @param props Recorte e viewport.
 * @returns Os quatro painéis de escurecimento.
 */
function DimPanels({
  cutout,
  viewport,
}: {
  readonly cutout: Rect;
  readonly viewport: ViewportSize;
}): ReactElement {
  const panels = computeDimPanels(cutout, viewport);
  return (
    <>
      {panels.map((panel, panelIndex) => (
        <Animated.View
          key={panelIndex}
          pointerEvents="auto"
          style={{
            position: "absolute",
            top: panel.top,
            left: panel.left,
            width: panel.width,
            height: panel.height,
            backgroundColor: coachMarks.dim,
          }}
        />
      ))}
    </>
  );
}

/**
 * Spotlight animado: painéis de dim + anel branco + glow teal, com a posição/
 * tamanho do recorte animados via reanimated (respeitando "reduce motion").
 *
 * @param props Recorte (não nulo), raio e viewport.
 * @returns Painéis + anel + glow.
 */
function SpotlightCutout({
  cutout,
  radius,
  viewport,
}: {
  readonly cutout: Rect;
  readonly radius: number;
  readonly viewport: ViewportSize;
}): ReactElement {
  const reducedMotion = useAppShellStore((state) => state.reducedMotionEnabled);

  const top = useSharedValue(cutout.top);
  const left = useSharedValue(cutout.left);
  const boxWidth = useSharedValue(cutout.width);
  const boxHeight = useSharedValue(cutout.height);

  useEffect(() => {
    const config = {
      duration: CUTOUT_TRANSITION_MS,
      easing: Easing.bezier(...motionEasings.standard),
    };
    if (reducedMotion) {
      top.value = cutout.top;
      left.value = cutout.left;
      boxWidth.value = cutout.width;
      boxHeight.value = cutout.height;
      return;
    }
    top.value = withTiming(cutout.top, config);
    left.value = withTiming(cutout.left, config);
    boxWidth.value = withTiming(cutout.width, config);
    boxHeight.value = withTiming(cutout.height, config);
  }, [cutout, reducedMotion, top, left, boxWidth, boxHeight]);

  const ringStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: top.value - RING_WIDTH,
    left: left.value - RING_WIDTH,
    width: boxWidth.value + RING_WIDTH * 2,
    height: boxHeight.value + RING_WIDTH * 2,
    borderRadius: radius,
    borderWidth: RING_WIDTH,
    borderColor: coachMarks.ring,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: top.value - GLOW_WIDTH,
    left: left.value - GLOW_WIDTH,
    width: boxWidth.value + GLOW_WIDTH * 2,
    height: boxHeight.value + GLOW_WIDTH * 2,
    borderRadius: radius + GLOW_WIDTH,
    borderWidth: GLOW_WIDTH,
    borderColor: coachMarks.glow,
  }));

  return (
    <>
      <DimPanels cutout={cutout} viewport={viewport} />
      <Animated.View testID="coach-marks-glow" pointerEvents="none" style={glowStyle} />
      <Animated.View testID="coach-marks-ring" pointerEvents="none" style={ringStyle} />
    </>
  );
}

/**
 * Overlay do spotlight. Em passos centralizados (cutout null) escurece a tela
 * inteira; caso contrário delega ao {@link SpotlightCutout} animado.
 *
 * @param props Recorte atual e raio dos cantos.
 * @returns Camada de escurecimento/spotlight.
 */
export function CoachMarksOverlay({
  cutout,
  radius,
}: CoachMarksOverlayProps): ReactElement {
  const { width, height } = useWindowDimensions();

  if (cutout === null) {
    return (
      <Animated.View
        testID="coach-marks-dim-full"
        pointerEvents="auto"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          backgroundColor: coachMarks.dim,
        }}
      />
    );
  }

  return (
    <SpotlightCutout cutout={cutout} radius={radius} viewport={{ width, height }} />
  );
}
