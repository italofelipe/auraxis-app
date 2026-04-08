import type { InstallmentVsCashHistoryResponse, ToolsCatalog } from "@/features/tools/contracts";

export const toolsCatalogFixture: ToolsCatalog = {
  tools: [
    {
      id: "installment-vs-cash",
      name: "Parcelado vs à vista",
      description: "Compara juros, desconto e custo de oportunidade.",
      enabled: true,
    },
    {
      id: "raise-calculator",
      name: "Pedir aumento",
      description: "Simula metas salariais e impacto líquido.",
      enabled: false,
    },
  ],
};

export const installmentVsCashHistoryFixture: InstallmentVsCashHistoryResponse = {
  items: [],
};
