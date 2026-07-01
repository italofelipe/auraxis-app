import {
  CARDS_TOUR_TOTAL_STEPS,
  cardsTourSteps,
} from "@/features/credit-cards/cards-tour/cards-tour-steps";
import { parseBoldSegments } from "@/shared/coach-marks/coach-marks-text";
import { coachMarks } from "@/shared/theme/coach-marks-tokens";

describe("cardsTourSteps", () => {
  it("tem exatamente 8 passos", () => {
    expect(cardsTourSteps).toHaveLength(CARDS_TOUR_TOTAL_STEPS);
    expect(CARDS_TOUR_TOTAL_STEPS).toBe(8);
  });

  it("marca passos centralizados sem âncora", () => {
    expect(cardsTourSteps[0].center).toBe(true);
    expect(cardsTourSteps[0].anchorKey).toBeNull();
    expect(cardsTourSteps[5].center).toBe(true);
    expect(cardsTourSteps[5].anchorKey).toBeNull();
    expect(cardsTourSteps[7].center).toBe(true);
    expect(cardsTourSteps[7].anchorKey).toBeNull();
    const middle = cardsTourSteps.slice(1, 7).filter((step) => step.id !== "more");
    for (const step of middle) {
      expect(step.center).toBe(false);
      expect(step.anchorKey).not.toBeNull();
    }
  });

  it("usa as chaves de âncora corretas, na ordem do design", () => {
    expect(cardsTourSteps.map((step) => step.anchorKey)).toEqual([
      null,
      "cards",
      "views",
      "months",
      "fatura",
      null,
      "theme",
      null,
    ]);
  });

  it("usa o raio de pílula para tema, e geral para os demais", () => {
    const byId = Object.fromEntries(
      cardsTourSteps.map((step) => [step.id, step]),
    );
    expect(byId.theme.radius).toBe(coachMarks.radiusPill);
    expect(byId.more.radius).toBe(coachMarks.radiusGeneral);
    expect(byId.cards.radius).toBe(coachMarks.radiusGeneral);
    expect(byId.views.radius).toBe(coachMarks.radiusGeneral);
    expect(byId.months.radius).toBe(coachMarks.radiusGeneral);
    expect(byId.fatura.radius).toBe(coachMarks.radiusGeneral);
  });

  it("usa eyebrows literais corretos", () => {
    expect(cardsTourSteps.map((step) => step.eyebrow)).toEqual([
      "BEM-VINDO AO AURAXIS",
      "PASSO 2 DE 8",
      "PASSO 3 DE 8",
      "PASSO 4 DE 8",
      "PASSO 5 DE 8",
      "PASSO 6 DE 8",
      "PASSO 7 DE 8",
      "TUDO PRONTO",
    ]);
  });

  it("preserva os títulos finais em pt-BR", () => {
    expect(cardsTourSteps.map((step) => step.title)).toEqual([
      "Seus cartões em um só lugar",
      "Reunimos todos os seus cartões",
      "Dois níveis de detalhe",
      "Navegue no tempo",
      "Do resumo ao extrato",
      "Nova transação mora em Mais",
      "Claro ou escuro, você decide",
      "Você já sabe o essencial",
    ]);
  });

  it("mantém os marcadores de negrito do corpo (parseáveis e com trechos bold)", () => {
    // Passos com negrito conhecido devem render ao menos um segmento bold.
    const boldSteps = ["cards", "views", "months", "fatura", "more", "done"];
    for (const step of cardsTourSteps) {
      const segments = parseBoldSegments(step.body);
      const hasBold = segments.some((segment) => segment.bold);
      if (boldSteps.includes(step.id)) {
        expect(hasBold).toBe(true);
      }
    }
  });

  it("inclui os trechos em negrito exatos do handoff", () => {
    const byId = Object.fromEntries(
      cardsTourSteps.map((step) => [step.id, step]),
    );
    expect(byId.cards.body).toContain("**Todos os cartões**");
    expect(byId.views.body).toContain("**Faturas**");
    expect(byId.views.body).toContain("**Analítico**");
    expect(byId.months.body).toContain("**aberta**");
    expect(byId.months.body).toContain("**fechada**");
    expect(byId.fatura.body).toContain("**extrato completo**");
    expect(byId.more.body).toContain("**Mais**");
    expect(byId.more.body).toContain("**Nova transação**");
    expect(byId.done.body).toContain("**?**");
  });

  it("descreve o before() de cada passo conforme a especificação", () => {
    const before = cardsTourSteps.map((step) => step.before);
    // 1 → setView faturas + selectAllCards + scrollTop
    expect(before[0]).toEqual({
      setView: "faturas",
      selectAllCards: true,
      scroll: "top",
    });
    // 2 → scrollTop
    expect(before[1]).toEqual({ scroll: "top" });
    // 3 → setView faturas + scrollTop
    expect(before[2]).toEqual({ setView: "faturas", scroll: "top" });
    // 4 → setView faturas + scrollTop
    expect(before[3]).toEqual({ setView: "faturas", scroll: "top" });
    // 5 → setView faturas + scrollToFatura
    expect(before[4]).toEqual({ setView: "faturas", scroll: "fatura" });
    // 6 → explicação centralizada sobre Mais (sem setup)
    expect(before[5]).toEqual({});
    // 7 → scrollTop
    expect(before[6]).toEqual({ scroll: "top" });
    // 8 → scrollTop
    expect(before[7]).toEqual({ scroll: "top" });
  });

  it("usa padding 6 para alvos redondos e 8 para retangulares", () => {
    const byId = Object.fromEntries(
      cardsTourSteps.map((step) => [step.id, step]),
    );
    expect(byId.more.padding).toBe(0);
    expect(byId.theme.padding).toBe(6);
    expect(byId.cards.padding).toBe(8);
    expect(byId.fatura.padding).toBe(8);
  });
});
