/**
 * Composição genérica do tour: motor (`useCoachMarks`) + overlay do spotlight +
 * tooltip. Renderiza tudo dentro de um `Modal` transparente em tela cheia para
 * que as coordenadas de `measureInWindow` mapeiem 1:1 e para que alvos fora da
 * árvore da tela (ex.: o FAB da tab bar) também sejam destacáveis.
 *
 * Esta camada é agnóstica de produto: recebe `steps` já resolvidos (com copy,
 * âncora, center, before) e o `measureAnchor` do contexto de âncoras.
 */
import { useMemo, type ReactElement } from "react";

import { Modal, useWindowDimensions } from "react-native";

import {
  computeCenteredPlacement,
  computeTooltipPlacement,
  inflateRect,
  type Rect,
  type ViewportSize,
} from "@/shared/coach-marks/coach-marks-geometry";
import { CoachMarksOverlay } from "@/shared/coach-marks/coach-marks-overlay";
import { CoachTooltip } from "@/shared/coach-marks/coach-tooltip";
import {
  useCoachMarks,
  type CoachMarkStep,
} from "@/shared/coach-marks/use-coach-marks";

/** Passo visual: descritor do motor + a copy/rótulos a renderizar. */
export interface CoachMarkVisualStep extends CoachMarkStep {
  /** Texto do eyebrow (já formatado, ex.: "PASSO 2 DE 8"). */
  readonly eyebrow: string;
  /** Título do passo. */
  readonly title: string;
  /** Corpo do passo (com marcadores `**negrito**`). */
  readonly body: string;
}

/** Props do componente genérico de tour. */
export interface CoachMarksProps<TStep extends CoachMarkVisualStep> {
  /** Passos visuais resolvidos, em ordem. */
  readonly steps: readonly TStep[];
  /** Tour ativo/visível. */
  readonly active: boolean;
  /** Mede uma âncora por chave (coordenadas de janela). */
  readonly measureAnchor: (key: string) => Promise<Rect | null>;
  /** Chamado ao concluir ("Começar") ou pular. */
  readonly onFinish: () => void;
  /** Rótulo do CTA de avanço no último passo. Default "Começar". */
  readonly finishLabel?: string;
  /** Rótulo do CTA de avanço nos demais passos. Default "Próximo". */
  readonly nextLabel?: string;
}

/**
 * Componente genérico de coach marks. Conduz o motor e renderiza overlay +
 * tooltip posicionados a partir do recorte medido.
 *
 * @param props Passos, ativação, medidor e callbacks.
 * @returns O Modal do tour, ou nada quando inativo.
 */
export function CoachMarks<TStep extends CoachMarkVisualStep>({
  steps,
  active,
  measureAnchor,
  onFinish,
  finishLabel = "Começar",
  nextLabel = "Próximo",
}: CoachMarksProps<TStep>): ReactElement | null {
  const { width, height } = useWindowDimensions();
  const viewport = useMemo<ViewportSize>(
    () => ({ width, height }),
    [width, height],
  );

  const machine = useCoachMarks<TStep>({
    steps,
    active,
    measureAnchor,
    onFinish,
  });

  const { step, rect, isCentered } = machine;

  const cutout = useMemo<Rect | null>(() => {
    if (isCentered || rect === null || step === undefined) {
      return null;
    }
    return inflateRect(rect, step.padding);
  }, [isCentered, rect, step]);

  const placement = useMemo(() => {
    if (cutout === null) {
      return computeCenteredPlacement(viewport);
    }
    return computeTooltipPlacement(cutout, viewport);
  }, [cutout, viewport]);

  if (!active || step === undefined) {
    return null;
  }

  const primaryLabel = machine.isLast ? finishLabel : nextLabel;

  return (
    <Modal
      visible={active}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={machine.skip}
    >
      <CoachMarksOverlay cutout={cutout} radius={step.radius} />
      <CoachTooltip
        placement={placement}
        eyebrow={step.eyebrow}
        title={step.title}
        body={step.body}
        index={machine.index}
        total={machine.total}
        showBack={!machine.isFirst}
        primaryLabel={primaryLabel}
        animationKey={machine.index}
        onNext={machine.next}
        onBack={machine.back}
        onSkip={machine.skip}
      />
    </Modal>
  );
}
