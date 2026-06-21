/**
 * Helpers geométricos PUROS do tour guiado (coach marks / spotlight).
 *
 * Toda a matemática de medição/posicionamento vive aqui, isolada de React e de
 * APIs nativas, para ser testável de forma determinística. O overlay e o tooltip
 * consomem estas funções — a verificação visual fina (sobre device) é feita pelo
 * lead, mas a lógica de cálculo é coberta por testes unitários.
 *
 * Convenção de coordenadas: todos os retângulos estão em coordenadas de JANELA
 * (origem no canto superior-esquerdo da tela), como devolvido por
 * `measureInWindow`. As funções aqui não conhecem scroll nem refs.
 */

/** Retângulo medido na janela (origem no topo-esquerdo da tela). */
export interface Rect {
  /** Distância do topo da janela até o topo do retângulo (px). */
  readonly top: number;
  /** Distância da esquerda da janela até a esquerda do retângulo (px). */
  readonly left: number;
  /** Largura do retângulo (px). */
  readonly width: number;
  /** Altura do retângulo (px). */
  readonly height: number;
}

/** Dimensões da janela usadas para clamp/posicionamento. */
export interface ViewportSize {
  /** Largura útil da janela (px). */
  readonly width: number;
  /** Altura útil da janela (px). */
  readonly height: number;
}

/** Um dos quatro painéis de escurecimento ao redor do recorte. */
export interface DimPanelRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

/** Resultado do cálculo de posicionamento do tooltip. */
export interface TooltipPlacement {
  /** Coordenada vertical (px, janela) do topo do card. */
  readonly top: number;
  /** Coordenada horizontal (px, janela) da esquerda do card. */
  readonly left: number;
  /** Largura do card (px). */
  readonly width: number;
  /** `true` quando o card fica ABAIXO do alvo (caret aponta para cima). */
  readonly below: boolean;
  /**
   * Posição horizontal (px, janela) da ponta do caret — centralizada no alvo e
   * presa às bordas do card. `null` quando não há caret (passos centrais).
   */
  readonly caretX: number | null;
}

/** Margem lateral do tooltip em relação às bordas da janela (px). */
export const TOOLTIP_HORIZONTAL_MARGIN = 18;

/** Folga entre o recorte e o tooltip (px). */
export const TOOLTIP_GAP = 14;

/** Altura estimada do tooltip usada para decidir acima/abaixo e clamp (px). */
export const TOOLTIP_ESTIMATED_HEIGHT = 200;

/** Folga mínima do tooltip ao topo da janela (px). */
export const TOOLTIP_TOP_SAFE_MARGIN = 70;

/** Folga mínima do tooltip à base da janela (px). */
export const TOOLTIP_BOTTOM_SAFE_MARGIN = 30;

/** Meia-largura do caret — usada para presá-lo dentro do card (px). */
export const CARET_EDGE_INSET = 28;

/**
 * Expande um retângulo medido por um padding uniforme (o "respiro" do recorte
 * além do bounding box do alvo). Mantém o resultado dentro de coordenadas
 * válidas (largura/altura nunca negativas).
 *
 * @param rect Retângulo medido na janela.
 * @param padding Padding a aplicar em todos os lados (px).
 * @returns Retângulo expandido.
 */
export const inflateRect = (rect: Rect, padding: number): Rect => {
  const width = Math.max(0, rect.width + padding * 2);
  const height = Math.max(0, rect.height + padding * 2);
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width,
    height,
  };
};

/**
 * Indica se um retângulo medido é utilizável para spotlight. Rejeita medições
 * degeneradas (dimensão zero/negativa ou valores não-finitos) que, na prática,
 * significam "alvo ainda não montado/visível" — o motor cai para o card central.
 *
 * @param rect Retângulo candidato (ou null).
 * @returns `true` quando o retângulo é finito e tem área positiva.
 */
export const isUsableRect = (rect: Rect | null): rect is Rect => {
  if (rect === null) {
    return false;
  }
  const values = [rect.top, rect.left, rect.width, rect.height];
  if (values.some((value) => !Number.isFinite(value))) {
    return false;
  }
  return rect.width > 0 && rect.height > 0;
};

/**
 * Calcula os quatro painéis de escurecimento (topo/base/esquerda/direita) ao
 * redor de um recorte. Quatro retângulos opacos — NUNCA um único box-shadow
 * gigante — para renderização estável em todos os devices. Cada painel é
 * "clampado" para nunca extrapolar a janela nem ter dimensão negativa.
 *
 * @param cutout Recorte (já com padding) em coordenadas de janela.
 * @param viewport Dimensões da janela.
 * @returns Quatro painéis na ordem [topo, base, esquerda, direita].
 */
export const computeDimPanels = (
  cutout: Rect,
  viewport: ViewportSize,
): readonly [DimPanelRect, DimPanelRect, DimPanelRect, DimPanelRect] => {
  const cutTop = Math.max(0, Math.min(cutout.top, viewport.height));
  const cutLeft = Math.max(0, Math.min(cutout.left, viewport.width));
  const cutBottom = Math.max(
    cutTop,
    Math.min(cutout.top + cutout.height, viewport.height),
  );
  const cutRight = Math.max(
    cutLeft,
    Math.min(cutout.left + cutout.width, viewport.width),
  );

  const top: DimPanelRect = {
    top: 0,
    left: 0,
    width: viewport.width,
    height: cutTop,
  };
  const bottom: DimPanelRect = {
    top: cutBottom,
    left: 0,
    width: viewport.width,
    height: Math.max(0, viewport.height - cutBottom),
  };
  const left: DimPanelRect = {
    top: cutTop,
    left: 0,
    width: cutLeft,
    height: Math.max(0, cutBottom - cutTop),
  };
  const right: DimPanelRect = {
    top: cutTop,
    left: cutRight,
    width: Math.max(0, viewport.width - cutRight),
    height: Math.max(0, cutBottom - cutTop),
  };

  return [top, left, right, bottom];
};

/**
 * Decide o posicionamento do tooltip relativo ao recorte: abaixo do alvo quando
 * há espaço na metade inferior, senão acima; sempre preso (clamp) dentro da
 * janela. O caret é centralizado no alvo e preso às bordas do card.
 *
 * @param cutout Recorte (com padding) em coordenadas de janela.
 * @param viewport Dimensões da janela.
 * @param tooltipHeight Altura estimada do tooltip (px).
 * @returns Posicionamento (top/left/width/below/caretX) do tooltip.
 */
export const computeTooltipPlacement = (
  cutout: Rect,
  viewport: ViewportSize,
  tooltipHeight: number = TOOLTIP_ESTIMATED_HEIGHT,
): TooltipPlacement => {
  const width = Math.max(0, viewport.width - TOOLTIP_HORIZONTAL_MARGIN * 2);
  const left = TOOLTIP_HORIZONTAL_MARGIN;

  const spaceBelowNeeded = cutout.top + cutout.height + TOOLTIP_GAP + tooltipHeight;
  const below = spaceBelowNeeded <= viewport.height;

  const rawTop = below
    ? cutout.top + cutout.height + TOOLTIP_GAP
    : cutout.top - TOOLTIP_GAP - tooltipHeight;

  const maxTop = Math.max(
    TOOLTIP_TOP_SAFE_MARGIN,
    viewport.height - tooltipHeight - TOOLTIP_BOTTOM_SAFE_MARGIN,
  );
  const top = Math.max(TOOLTIP_TOP_SAFE_MARGIN, Math.min(rawTop, maxTop));

  const targetCenterX = cutout.left + cutout.width / 2;
  const caretX = Math.max(
    left + CARET_EDGE_INSET,
    Math.min(targetCenterX, left + width - CARET_EDGE_INSET),
  );

  return { top, left, width, below, caretX };
};

/**
 * Posicionamento de um tooltip CENTRALIZADO (passos de boas-vindas/conclusão,
 * sem spotlight). Centraliza verticalmente com leve viés para cima e sem caret.
 *
 * @param viewport Dimensões da janela.
 * @param tooltipHeight Altura estimada do tooltip (px).
 * @returns Posicionamento centralizado (caret nulo).
 */
export const computeCenteredPlacement = (
  viewport: ViewportSize,
  tooltipHeight: number = TOOLTIP_ESTIMATED_HEIGHT,
): TooltipPlacement => {
  const width = Math.max(0, viewport.width - TOOLTIP_HORIZONTAL_MARGIN * 2);
  const left = TOOLTIP_HORIZONTAL_MARGIN;
  const rawTop = viewport.height / 2 - tooltipHeight / 2;
  const top = Math.max(TOOLTIP_TOP_SAFE_MARGIN, rawTop);
  return { top, left, width, below: true, caretX: null };
};
