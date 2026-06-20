/**
 * Orquestração do tour da HOME de Cartões.
 *
 * Responsável por:
 * - Abertura na PRIMEIRA visita (flag `seen` no secure-store) e re-execução pelo
 *   botão "?" do hero (replay).
 * - Traduzir o descritor `before` de cada passo em ações concretas no controller
 *   da HOME (`setView("faturas")`, `selectCard(null)`) e em rolagem do conteúdo
 *   (`scrollTo({ y: 0 })` ou rolar até o card de fatura) ANTES de medir o alvo.
 * - Marcar o tour como visto ao concluir/pular.
 *
 * A medição em si vem do contexto de âncoras (`measureAnchor`), nunca de
 * auto-scroll: rolamos explicitamente e então o motor mede em coordenadas de
 * janela.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ScrollView as NativeScrollView } from "react-native";

import {
  cardsTourSteps,
  type CardsTourBeforeDescriptor,
  type CardsTourStepConfig,
} from "@/features/credit-cards/cards-tour/cards-tour-steps";
import {
  loadCardsTourSeen,
  persistCardsTourSeen,
} from "@/features/credit-cards/services/cards-tour-seen-storage";
import type { CardsHomeView } from "@/features/credit-cards/hooks/use-cards-home-controller";
import type { Rect } from "@/shared/coach-marks/coach-marks-geometry";
import type { CoachMarkVisualStep } from "@/shared/coach-marks/coach-marks";

/** Ações do controller da HOME que o tour aciona em `before()`. */
export interface CardsTourControllerHandlers {
  /** Define a view ativa ("faturas"/"analitico"). */
  readonly setView: (view: CardsHomeView) => void;
  /** Seleciona um cartão (ou null para "Todos os cartões"). */
  readonly selectCard: (cardId: string | null) => void;
}

/** Parâmetros do hook do tour de Cartões. */
export interface UseCardsTourParams {
  /** Handlers do controller da HOME. */
  readonly handlers: CardsTourControllerHandlers;
  /** Ref do ScrollView da tela (para rolar até o alvo). */
  readonly scrollRef: React.RefObject<NativeScrollView | null>;
  /** Mede uma âncora por chave (coordenadas de janela). */
  readonly measureAnchor: (key: string) => Promise<Rect | null>;
  /**
   * Habilita a verificação de primeira visita. A tela passa `true` só quando os
   * cartões já carregaram (não faz sentido abrir o tour sobre um spinner).
   * Default `true`.
   */
  readonly autoOpenEnabled?: boolean;
}

/** Estado/efeitos expostos pelo hook do tour de Cartões. */
export interface CardsTourState {
  /** Tour ativo/visível. */
  readonly active: boolean;
  /** Passos visuais resolvidos para o componente genérico de coach marks. */
  readonly steps: readonly CoachMarkVisualStep[];
  /** Encerra o tour e marca como visto. */
  readonly onFinish: () => void;
  /** Reabre o tour (botão "?"). */
  readonly open: () => void;
}

/** Margem (px) a deixar acima do alvo ao rolar até ele. */
const SCROLL_TARGET_TOP_MARGIN = 140;

/**
 * Rola o conteúdo conforme o alvo do descritor: topo (`y: 0`) ou trazendo o card
 * de fatura para a porção superior visível. Para "fatura", mede a âncora em
 * janela e ajusta o scroll relativo atual.
 *
 * @param target Alvo de rolagem.
 * @param scrollRef Ref do ScrollView.
 * @param measureAnchor Medidor de âncoras.
 */
const applyScroll = async (
  target: CardsTourBeforeDescriptor["scroll"],
  scrollRef: React.RefObject<NativeScrollView | null>,
  measureAnchor: (key: string) => Promise<Rect | null>,
): Promise<void> => {
  const scroll = scrollRef.current;
  if (!scroll || target === undefined) {
    return;
  }
  if (target === "top") {
    scroll.scrollTo({ y: 0, animated: false });
    return;
  }
  // target === "fatura": traz o card de fatura para a porção superior.
  const faturaRect = await measureAnchor("fatura");
  const scrollRect = await measureAnchor("__scroll_origin");
  // Sem medições não há como calcular um delta confiável — aborta a rolagem
  // (o motor cai para o fallback central se o alvo seguir fora da tela).
  if (faturaRect === null) {
    return;
  }
  const originTop = scrollRect?.top ?? 0;
  const delta = faturaRect.top - originTop - SCROLL_TARGET_TOP_MARGIN;
  scroll.scrollTo({ y: Math.max(0, delta), animated: false });
};

/**
 * Constrói a função `before()` concreta de um passo a partir do seu descritor,
 * aplicando, na ordem: seleção de cartão → view → rolagem.
 *
 * @param descriptor Descritor declarativo do passo.
 * @param deps Handlers, ref de scroll e medidor.
 * @returns Closure assíncrona a executar antes de medir.
 */
const buildBefore = (
  descriptor: CardsTourBeforeDescriptor,
  deps: {
    readonly handlers: CardsTourControllerHandlers;
    readonly scrollRef: React.RefObject<NativeScrollView | null>;
    readonly measureAnchor: (key: string) => Promise<Rect | null>;
  },
): (() => Promise<void>) => {
  return async (): Promise<void> => {
    if (descriptor.selectAllCards === true) {
      deps.handlers.selectCard(null);
    }
    if (descriptor.setView !== undefined) {
      deps.handlers.setView(descriptor.setView);
    }
    await applyScroll(descriptor.scroll, deps.scrollRef, deps.measureAnchor);
  };
};

/** Converte um passo de config no passo visual consumido pelo motor. */
const toVisualStep = (
  config: CardsTourStepConfig,
  before: () => Promise<void>,
): CoachMarkVisualStep => ({
  id: config.id,
  anchorKey: config.anchorKey,
  center: config.center,
  padding: config.padding,
  radius: config.radius,
  eyebrow: config.eyebrow,
  title: config.title,
  body: config.body,
  before,
});

/**
 * Hook de orquestração do tour de Cartões.
 *
 * @param params Handlers do controller, ref de scroll, medidor e flag de
 *   auto-open.
 * @returns Estado do tour (ativo, passos, onFinish, open).
 */
export function useCardsTour(params: UseCardsTourParams): CardsTourState {
  const { handlers, scrollRef, measureAnchor, autoOpenEnabled = true } = params;
  const [active, setActive] = useState(false);
  const autoOpenAttempted = useRef(false);

  // Refs estáveis para os deps usados dentro dos `before()` memoizados.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const measureRef = useRef(measureAnchor);
  measureRef.current = measureAnchor;

  const steps = useMemo<readonly CoachMarkVisualStep[]>(() => {
    const deps = {
      handlers: handlersRef.current,
      scrollRef,
      measureAnchor: (key: string): Promise<Rect | null> =>
        measureRef.current(key),
    };
    return cardsTourSteps.map((config) =>
      toVisualStep(
        config,
        buildBefore(config.before, {
          handlers: {
            setView: (view): void => handlersRef.current.setView(view),
            selectCard: (cardId): void =>
              handlersRef.current.selectCard(cardId),
          },
          scrollRef: deps.scrollRef,
          measureAnchor: deps.measureAnchor,
        }),
      ),
    );
  }, [scrollRef]);

  // Abertura na primeira visita (uma única tentativa por montagem).
  useEffect(() => {
    if (!autoOpenEnabled || autoOpenAttempted.current) {
      return undefined;
    }
    autoOpenAttempted.current = true;
    let alive = true;
    void loadCardsTourSeen().then((seen) => {
      if (alive && !seen) {
        setActive(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [autoOpenEnabled]);

  const onFinish = useCallback((): void => {
    setActive(false);
    void persistCardsTourSeen();
  }, []);

  const open = useCallback((): void => {
    setActive(true);
  }, []);

  return { active, steps, onFinish, open };
}
