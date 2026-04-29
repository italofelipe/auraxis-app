import type { InstallmentVsCashHistoryResponse, ToolsCatalog } from "@/features/tools/contracts";

export const toolsCatalogFixture: ToolsCatalog = {
  tools: [
    {
      id: "installment-vs-cash",
      slug: "parcelado-vs-a-vista",
      name: "Parcelado vs à vista",
      description: "Compara juros, desconto e custo de oportunidade.",
      category: "daily-life",
      enabled: true,
      route: "/installment-vs-cash",
    },
    {
      id: "salary-raise",
      slug: "pedir-aumento",
      name: "Pedir aumento",
      description: "Simula metas salariais e impacto líquido.",
      category: "salary-and-work",
      enabled: false,
    },
  ],
};

export const installmentVsCashHistoryFixture: InstallmentVsCashHistoryResponse = {
  items: [],
};
