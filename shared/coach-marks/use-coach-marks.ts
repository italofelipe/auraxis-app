/**
 * Máquina de estados (headless) do tour de coach marks.
 *
 * Responsável por: índice do passo atual, navegação (next/back/skip/finish) e,
 * para cada passo, executar um `before()` assíncrono (setup de estado da tela) e
 * então MEDIR o alvo — com um pequeno delay de "settle" após o `before()` — para
 * produzir o recorte do spotlight. Passos marcados como `center` pulam a medição
 * e exibem um card centralizado; medições inválidas caem para o mesmo fallback
 * central (defensivo: nunca um spotlight vazio/errado).
 *
 * A função de medição (`measureAnchor`) é injetada para manter o hook testável
 * sem APIs nativas.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import {
  isUsableRect,
  type Rect,
} from "@/shared/coach-marks/coach-marks-geometry";

/** Fase de resolução do passo atual. */
export type CoachMarkPhase = "measuring" | "ready";

/** Descritor mínimo de um passo consumido pela máquina de estados. */
export interface CoachMarkStep {
  /** Identificador estável do passo (telemetria/testes). */
  readonly id: string;
  /** Chave da âncora a medir (`null` para passos centralizados). */
  readonly anchorKey: string | null;
  /** Quando `true`, pula a medição e centraliza o card. */
  readonly center: boolean;
  /** Padding extra (px) somado ao bounding box do alvo. */
  readonly padding: number;
  /** Raio dos cantos do recorte (px). */
  readonly radius: number;
  /** Setup assíncrono de estado da tela antes de medir (opcional). */
  readonly before?: () => void | Promise<void>;
}

/** Parâmetros do hook da máquina de estados. */
export interface UseCoachMarksParams<TStep extends CoachMarkStep> {
  /** Passos do tour, em ordem. */
  readonly steps: readonly TStep[];
  /** Se o tour está ativo (montado/visível). */
  readonly active: boolean;
  /** Mede a âncora e devolve o retângulo em coordenadas de janela (ou null). */
  readonly measureAnchor: (key: string) => Promise<Rect | null>;
  /** Chamado quando o usuário conclui ("Começar") ou pula o tour. */
  readonly onFinish: () => void;
  /**
   * Delay (ms) entre o fim do `before()` e a medição, dando tempo para o layout
   * assentar (re-render do controller + scroll). Default 240ms.
   */
  readonly settleDelayMs?: number;
}

/** Estado e ações expostos pela máquina de estados do tour. */
export interface CoachMarksState<TStep extends CoachMarkStep> {
  /** Índice (0-based) do passo atual. */
  readonly index: number;
  /** Total de passos. */
  readonly total: number;
  /** Passo atual. */
  readonly step: TStep;
  /** Fase de resolução do passo. */
  readonly phase: CoachMarkPhase;
  /** Recorte medido (ou null quando centralizado/medição falhou). */
  readonly rect: Rect | null;
  /** Indica que o passo deve ser exibido centralizado. */
  readonly isCentered: boolean;
  /** `true` no primeiro passo. */
  readonly isFirst: boolean;
  /** `true` no último passo. */
  readonly isLast: boolean;
  /** Avança (ou finaliza no último passo). */
  readonly next: () => void;
  /** Volta um passo (no-op no primeiro). */
  readonly back: () => void;
  /** Encerra o tour imediatamente. */
  readonly skip: () => void;
}

/** Default do delay de assentamento do layout antes de medir (ms). */
export const DEFAULT_SETTLE_DELAY_MS = 240;

/** Delay curto antes de medir quando o passo não tem `before()` (ms). */
export const NO_BEFORE_SETTLE_DELAY_MS = 60;

/**
 * Hook da máquina de estados do tour. Reage a mudanças de índice/ativação
 * executando o `before()` do passo e medindo o alvo de forma cancelável.
 *
 * @param params Passos, estado de ativação, medidor e callbacks.
 * @returns Estado atual + ações de navegação.
 */
/** Estado de resolução de um passo (fase + recorte medido). */
interface StepResolution {
  readonly phase: CoachMarkPhase;
  readonly rect: Rect | null;
}

/** Argumentos do hook interno de resolução de passo. */
interface StepResolutionArgs<TStep extends CoachMarkStep> {
  readonly active: boolean;
  readonly safeIndex: number;
  readonly stepsRef: React.MutableRefObject<readonly TStep[]>;
  readonly measureRef: React.MutableRefObject<
    (key: string) => Promise<Rect | null>
  >;
  readonly settleDelayMs: number;
}

/**
 * Executa o `before()` do passo atual e resolve seu recorte (medindo o alvo
 * após o settle, ou caindo para centralizado). Isolado do hook principal para
 * manter cada função pequena e o efeito dependente só de primitivos estáveis.
 *
 * @param args Estado/refs necessários para resolver o passo.
 * @returns Fase e recorte do passo atual.
 */
const useStepResolution = <TStep extends CoachMarkStep>(
  args: StepResolutionArgs<TStep>,
): StepResolution => {
  const { active, safeIndex, stepsRef, measureRef, settleDelayMs } = args;
  const [phase, setPhase] = useState<CoachMarkPhase>("measuring");
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    const activeStep = stepsRef.current[safeIndex];
    if (!active || activeStep === undefined) {
      return undefined;
    }

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    setPhase("measuring");
    setRect(null);

    const settle = (measured: Rect | null): void => {
      if (alive) {
        setRect(isUsableRect(measured) ? measured : null);
        setPhase("ready");
      }
    };

    const resolve = (): void => {
      if (!alive) {
        return;
      }
      const delay = activeStep.before
        ? settleDelayMs
        : NO_BEFORE_SETTLE_DELAY_MS;
      timer = setTimeout(() => {
        if (!alive) {
          return;
        }
        if (activeStep.center || activeStep.anchorKey === null) {
          settle(null);
          return;
        }
        measureRef.current(activeStep.anchorKey).then(settle, () =>
          settle(null),
        );
      }, delay);
    };

    if (activeStep.before) {
      Promise.resolve(activeStep.before()).then(resolve, resolve);
    } else {
      resolve();
    }

    return () => {
      alive = false;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
    // Depende apenas de primitivos estáveis: evita re-medição em loop quando o
    // pai re-renderiza e mantém o timer de settle vivo até disparar.
  }, [active, safeIndex, settleDelayMs, stepsRef, measureRef]);

  return { phase, rect };
};

export function useCoachMarks<TStep extends CoachMarkStep>(
  params: UseCoachMarksParams<TStep>,
): CoachMarksState<TStep> {
  const {
    steps,
    active,
    measureAnchor,
    onFinish,
    settleDelayMs = DEFAULT_SETTLE_DELAY_MS,
  } = params;

  const [index, setIndex] = useState(0);

  // Refs estáveis para uso dentro do efeito sem reexecutá-lo a cada render.
  const measureRef = useRef(measureAnchor);
  measureRef.current = measureAnchor;
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  // Reinicia para o passo 1 sempre que o tour é (re)aberto.
  useEffect(() => {
    if (active) {
      setIndex(0);
    }
  }, [active]);

  const total = steps.length;
  const safeIndex = Math.min(index, Math.max(0, total - 1));
  const step = steps[safeIndex];

  const { phase, rect } = useStepResolution({
    active,
    safeIndex,
    stepsRef,
    measureRef,
    settleDelayMs,
  });

  const isFirst = safeIndex === 0;
  const isLast = safeIndex >= total - 1;

  const next = useCallback((): void => {
    setIndex((current) => {
      if (current >= stepsRef.current.length - 1) {
        onFinish();
        return current;
      }
      return current + 1;
    });
  }, [onFinish]);

  const back = useCallback((): void => {
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  const skip = useCallback((): void => {
    onFinish();
  }, [onFinish]);

  return {
    index: safeIndex,
    total,
    step,
    phase,
    rect,
    isCentered: step?.center === true || rect === null,
    isFirst,
    isLast,
    next,
    back,
    skip,
  };
}
