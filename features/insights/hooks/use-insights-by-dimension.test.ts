import {
  filterInsightItemsByDimension,
  groupInsightItemsByDimension,
} from "@/features/insights/hooks/use-insights-by-dimension";
import type { InsightItem } from "@/features/insights/contracts";

const items: readonly InsightItem[] = [
  {
    type: "saude_financeira",
    dimension: "general",
    title: "Resumo global",
    message: "O caixa segue positivo.",
  },
  {
    type: "padrao_gasto",
    dimension: "transactions",
    title: "Padrao em transacoes",
    message: "Despesas pequenas se repetiram.",
  },
  {
    type: "alerta_orcamento",
    dimension: "budgets",
    title: "Orcamento em alerta",
    message: "Mercado chegou a 91%.",
  },
  {
    type: "legacy",
    title: "Legado sem dimensao",
    message: "Deve entrar na visao geral.",
  },
];

describe("insight dimension helpers", () => {
  it("filtra contexto com itens general e da propria dimensao", () => {
    expect(filterInsightItemsByDimension(items, "transactions")).toEqual([
      expect.objectContaining({ title: "Resumo global", dimension: "general" }),
      expect.objectContaining({
        title: "Padrao em transacoes",
        dimension: "transactions",
      }),
      expect.objectContaining({
        title: "Legado sem dimensao",
        dimension: "general",
      }),
    ]);
  });

  it("agrupa na ordem canonica omitindo dimensoes vazias", () => {
    const groups = groupInsightItemsByDimension(items);

    expect(groups.map((group) => group.dimension)).toEqual([
      "general",
      "transactions",
      "budgets",
    ]);
    expect(groups[0]?.items).toHaveLength(2);
  });
});
