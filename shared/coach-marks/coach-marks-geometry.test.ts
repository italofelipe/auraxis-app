import {
  CARET_EDGE_INSET,
  TOOLTIP_BOTTOM_SAFE_MARGIN,
  TOOLTIP_ESTIMATED_HEIGHT,
  TOOLTIP_GAP,
  TOOLTIP_HORIZONTAL_MARGIN,
  TOOLTIP_TOP_SAFE_MARGIN,
  computeCenteredPlacement,
  computeDimPanels,
  computeTooltipPlacement,
  inflateRect,
  isUsableRect,
  type Rect,
  type ViewportSize,
} from "@/shared/coach-marks/coach-marks-geometry";

const VIEWPORT: ViewportSize = { width: 390, height: 844 };

describe("inflateRect", () => {
  it("expande o retângulo igualmente em todos os lados", () => {
    const rect: Rect = { top: 100, left: 50, width: 200, height: 80 };
    expect(inflateRect(rect, 8)).toEqual({
      top: 92,
      left: 42,
      width: 216,
      height: 96,
    });
  });

  it("aceita padding zero (no-op de dimensão)", () => {
    const rect: Rect = { top: 10, left: 10, width: 30, height: 30 };
    expect(inflateRect(rect, 0)).toEqual(rect);
  });

  it("nunca produz largura/altura negativas", () => {
    const rect: Rect = { top: 0, left: 0, width: 2, height: 2 };
    const result = inflateRect(rect, -10);
    expect(result.width).toBeGreaterThanOrEqual(0);
    expect(result.height).toBeGreaterThanOrEqual(0);
  });
});

describe("isUsableRect", () => {
  it("rejeita null", () => {
    expect(isUsableRect(null)).toBe(false);
  });

  it("rejeita retângulo de área zero", () => {
    expect(isUsableRect({ top: 0, left: 0, width: 0, height: 50 })).toBe(false);
    expect(isUsableRect({ top: 0, left: 0, width: 50, height: 0 })).toBe(false);
  });

  it("rejeita valores não-finitos (NaN/Infinity)", () => {
    expect(isUsableRect({ top: NaN, left: 0, width: 10, height: 10 })).toBe(
      false,
    );
    expect(
      isUsableRect({ top: 0, left: Infinity, width: 10, height: 10 }),
    ).toBe(false);
  });

  it("aceita retângulo finito com área positiva", () => {
    expect(isUsableRect({ top: 5, left: 5, width: 10, height: 10 })).toBe(true);
  });
});

describe("computeDimPanels", () => {
  it("cobre toda a janela ao redor do recorte sem sobreposição vertical", () => {
    const cutout: Rect = { top: 200, left: 40, width: 300, height: 120 };
    const [top, left, right, bottom] = computeDimPanels(cutout, VIEWPORT);

    // Topo + recorte + base = altura total.
    expect(top.height + cutout.height + bottom.height).toBeCloseTo(
      VIEWPORT.height,
    );
    expect(top.top).toBe(0);
    expect(top.width).toBe(VIEWPORT.width);
    expect(bottom.top).toBe(cutout.top + cutout.height);

    // Painéis laterais cobrem só a faixa vertical do recorte.
    expect(left.height).toBe(cutout.height);
    expect(right.height).toBe(cutout.height);
    expect(left.width).toBe(cutout.left);
    expect(right.left).toBe(cutout.left + cutout.width);
    expect(left.width + cutout.width + right.width).toBeCloseTo(VIEWPORT.width);
  });

  it("clampa recortes que extrapolam a janela (sem dimensões negativas)", () => {
    const cutout: Rect = { top: -20, left: -10, width: 500, height: 1000 };
    const panels = computeDimPanels(cutout, VIEWPORT);
    for (const panel of panels) {
      expect(panel.width).toBeGreaterThanOrEqual(0);
      expect(panel.height).toBeGreaterThanOrEqual(0);
    }
    // Recorte maior que a janela → painel do topo colapsa.
    expect(panels[0].height).toBe(0);
  });

  it("devolve exatamente quatro painéis na ordem topo, esquerda, direita, base", () => {
    const cutout: Rect = { top: 100, left: 100, width: 100, height: 100 };
    const panels = computeDimPanels(cutout, VIEWPORT);
    expect(panels).toHaveLength(4);
    expect(panels[0].top).toBe(0); // topo
    expect(panels[3].top).toBe(cutout.top + cutout.height); // base
  });
});

describe("computeTooltipPlacement", () => {
  it("posiciona ABAIXO quando o alvo está no topo e há espaço", () => {
    const cutout: Rect = { top: 120, left: 40, width: 300, height: 100 };
    const placement = computeTooltipPlacement(cutout, VIEWPORT);
    expect(placement.below).toBe(true);
    expect(placement.top).toBe(cutout.top + cutout.height + TOOLTIP_GAP);
  });

  it("posiciona ACIMA quando não há espaço abaixo", () => {
    const cutout: Rect = { top: 700, left: 40, width: 300, height: 120 };
    const placement = computeTooltipPlacement(cutout, VIEWPORT);
    expect(placement.below).toBe(false);
    expect(placement.top).toBeLessThan(cutout.top);
  });

  it("clampa o topo para nunca sair da janela", () => {
    const cutout: Rect = { top: 5, left: 40, width: 300, height: 10 };
    const placement = computeTooltipPlacement(cutout, VIEWPORT);
    expect(placement.top).toBeGreaterThanOrEqual(TOOLTIP_TOP_SAFE_MARGIN);
  });

  it("nunca empurra o tooltip além da base segura", () => {
    const tall = 400;
    const cutout: Rect = { top: 800, left: 40, width: 300, height: 30 };
    const placement = computeTooltipPlacement(cutout, VIEWPORT, tall);
    expect(placement.top + tall).toBeLessThanOrEqual(
      VIEWPORT.height - TOOLTIP_BOTTOM_SAFE_MARGIN + 0.001,
    );
  });

  it("usa a largura da janela menos as margens laterais", () => {
    const cutout: Rect = { top: 200, left: 40, width: 100, height: 100 };
    const placement = computeTooltipPlacement(cutout, VIEWPORT);
    expect(placement.width).toBe(
      VIEWPORT.width - TOOLTIP_HORIZONTAL_MARGIN * 2,
    );
    expect(placement.left).toBe(TOOLTIP_HORIZONTAL_MARGIN);
  });

  it("centraliza o caret no alvo quando há espaço", () => {
    const cutout: Rect = { top: 200, left: 145, width: 100, height: 100 };
    const placement = computeTooltipPlacement(cutout, VIEWPORT);
    expect(placement.caretX).toBe(cutout.left + cutout.width / 2);
  });

  it("prende o caret às bordas do card para alvos colados na esquerda", () => {
    const cutout: Rect = { top: 200, left: 0, width: 20, height: 20 };
    const placement = computeTooltipPlacement(cutout, VIEWPORT);
    expect(placement.caretX).toBe(
      TOOLTIP_HORIZONTAL_MARGIN + CARET_EDGE_INSET,
    );
  });

  it("prende o caret à borda direita para alvos colados na direita", () => {
    const cutout: Rect = { top: 200, left: 380, width: 20, height: 20 };
    const placement = computeTooltipPlacement(cutout, VIEWPORT);
    const maxCaret =
      TOOLTIP_HORIZONTAL_MARGIN +
      (VIEWPORT.width - TOOLTIP_HORIZONTAL_MARGIN * 2) -
      CARET_EDGE_INSET;
    expect(placement.caretX).toBe(maxCaret);
  });
});

describe("computeCenteredPlacement", () => {
  it("centraliza verticalmente e não tem caret", () => {
    const placement = computeCenteredPlacement(VIEWPORT);
    expect(placement.caretX).toBeNull();
    expect(placement.top).toBeCloseTo(
      VIEWPORT.height / 2 - TOOLTIP_ESTIMATED_HEIGHT / 2,
    );
  });

  it("respeita a margem superior segura em janelas curtas", () => {
    const shortViewport: ViewportSize = { width: 320, height: 200 };
    const placement = computeCenteredPlacement(shortViewport, 400);
    expect(placement.top).toBe(TOOLTIP_TOP_SAFE_MARGIN);
  });
});
