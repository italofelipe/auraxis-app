import type { InsightSectionSource } from "@/shared/insights/insight-section-contracts";
import { toInsightSectionVM } from "@/shared/insights/insight-section-vm";

const buildSource = (
  override: Partial<InsightSectionSource> = {},
): InsightSectionSource => ({
  dimension: "transactions",
  severity: "attention",
  title: "Dia leve, mês concentrado",
  lead: "Ontem houve só uma compra pequena, mas a fatura pesa.",
  highlights: [
    { label: "Maior gasto do mês", value: "R$ 11.000,00", sub: "Fatura Maio" },
    { label: "Único crédito", value: "R$ 27.675,37", sub: "Salário · 30/06" },
    { label: "Gasto de ontem", value: "R$ 156,30", sub: "Eletrônicos" },
  ],
  ...override,
});

describe("toInsightSectionVM", () => {
  it("carries the lead identity (dimension, severity, title, lead)", () => {
    const vm = toInsightSectionVM(buildSource());

    expect(vm).toMatchObject({
      dimension: "transactions",
      severity: "attention",
      title: "Dia leve, mês concentrado",
      lead: "Ontem houve só uma compra pequena, mas a fatura pesa.",
    });
  });

  it("keeps at most two highlights by default (compact recorte)", () => {
    const vm = toInsightSectionVM(buildSource());

    expect(vm.highlights).toHaveLength(2);
    expect(vm.highlights[0]).toMatchObject({ label: "Maior gasto do mês" });
    expect(vm.highlights[1]).toMatchObject({ label: "Único crédito" });
  });

  it("honours a custom highlight cap", () => {
    const vm = toInsightSectionVM(buildSource(), { maxHighlights: 1 });

    expect(vm.highlights).toHaveLength(1);
    expect(vm.highlights[0]).toMatchObject({ label: "Maior gasto do mês" });
  });

  it("tolerates a source with no highlights", () => {
    const vm = toInsightSectionVM(buildSource({ highlights: [] }));

    expect(vm.highlights).toEqual([]);
  });

  it("does not mutate the source highlights array", () => {
    const source = buildSource();

    toInsightSectionVM(source, { maxHighlights: 1 });

    expect(source.highlights).toHaveLength(3);
  });
});
