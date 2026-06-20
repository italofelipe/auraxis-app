/**
 * Tour da HOME de Cartões: compõe o motor genérico de coach marks
 * (`CoachMarks`) com a orquestração específica de Cartões (`useCardsTour`).
 *
 * A tela controla a ABERTURA: passa o estado/handlers e usa a ref retornada por
 * {@link useCardsTour} (via prop `controllerRef`) para disparar o replay no botão
 * "?". Aqui só conectamos passos + medição + ações de `before()`.
 */
import { useImperativeHandle, type ReactElement, type Ref } from "react";

import type { ScrollView as NativeScrollView } from "react-native";

import {
  useCardsTour,
  type CardsTourControllerHandlers,
} from "@/features/credit-cards/cards-tour/use-cards-tour";
import { CoachMarks } from "@/shared/coach-marks/coach-marks";
import type { Rect } from "@/shared/coach-marks/coach-marks-geometry";

/** API imperativa exposta para a tela disparar o replay do tour. */
export interface CardsTourHandle {
  /** Reabre o tour (botão "?"). */
  readonly open: () => void;
}

/** Props do componente do tour de Cartões. */
export interface CardsTourProps {
  /** Handlers do controller da HOME (`setView`, `selectCard`). */
  readonly handlers: CardsTourControllerHandlers;
  /** Ref do ScrollView da tela (rolar até o alvo). */
  readonly scrollRef: React.RefObject<NativeScrollView | null>;
  /** Mede uma âncora por chave (do contexto de âncoras). */
  readonly measureAnchor: (key: string) => Promise<Rect | null>;
  /** Habilita auto-abertura na primeira visita (após os cartões carregarem). */
  readonly autoOpenEnabled: boolean;
  /** Ref imperativa para acionar o replay a partir do hero. */
  readonly controllerRef?: Ref<CardsTourHandle>;
}

/**
 * Componente do tour de Cartões. Renderiza o overlay/tooltip do motor genérico,
 * dirigido pela orquestração específica de Cartões.
 *
 * @param props Handlers, ref de scroll, medidor, flag de auto-open e ref
 *   imperativa.
 * @returns O componente de coach marks (Modal) — nada quando inativo.
 */
export function CardsTour({
  handlers,
  scrollRef,
  measureAnchor,
  autoOpenEnabled,
  controllerRef,
}: CardsTourProps): ReactElement | null {
  const tour = useCardsTour({
    handlers,
    scrollRef,
    measureAnchor,
    autoOpenEnabled,
  });

  useImperativeHandle(controllerRef, () => ({ open: tour.open }), [tour.open]);

  return (
    <CoachMarks
      steps={tour.steps}
      active={tour.active}
      measureAnchor={measureAnchor}
      onFinish={tour.onFinish}
      finishLabel="Começar"
      nextLabel="Próximo"
    />
  );
}
