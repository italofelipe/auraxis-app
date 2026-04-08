import { isFeatureEnabled, resolveProviderDecision } from "@/shared/feature-flags";
import type { ToolsCatalog } from "@/features/tools/contracts";

export const toolsPlaceholder: ToolsCatalog = {
  tools: [
    {
      id: "installment-vs-cash",
      name: "Parcelado vs a vista",
      description: "Compare desconto, parcelas e custo de oportunidade.",
      enabled: true,
    },
    {
      id: "raise-calculator",
      name: "Pedir aumento",
      description: "Calculo de inflacao + ganho real desejado.",
      enabled: false,
    },
    {
      id: "bill-forecast",
      name: "Simulador de contas",
      description: "Previsao de saldo apos contas recorrentes.",
      enabled: false,
    },
  ],
};

/**
 * Aplica overrides de feature flags no catalogo de ferramentas local.
 * Enquanto a API nao expor um catalogo canônico, o app usa este baseline
 * tipado para evitar drift com endpoints inexistentes.
 *
 * @param catalog Catalogo base local.
 * @returns Catalogo com campo `enabled` normalizado por flags locais.
 */
export const applyToolsFlags = async (catalog: ToolsCatalog): Promise<ToolsCatalog> => {
  const toolsWithFlagsPromises = catalog.tools.map(async (tool): Promise<ToolsCatalog["tools"][number]> => {
    if (tool.id !== "raise-calculator") {
      return tool;
    }

    const flagKey = "app.tools.salary-raise-calculator";
    const providerDecision = await resolveProviderDecision(flagKey);
    const isRaiseCalculatorEnabled = isFeatureEnabled(flagKey, providerDecision);
    return {
      ...tool,
      enabled: isRaiseCalculatorEnabled,
    };
  });
  const toolsWithFlags = await Promise.all(toolsWithFlagsPromises);

  return {
    tools: toolsWithFlags,
  };
};

export const createToolsService = () => {
  return {
    getCatalog: async (): Promise<ToolsCatalog> => {
      return await applyToolsFlags(toolsPlaceholder);
    },
  };
};

export const toolsService = createToolsService();
