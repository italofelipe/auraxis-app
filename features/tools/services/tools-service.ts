import type { AxiosInstance } from "axios";

import { httpClient } from "@/core/http/http-client";
import { isFeatureEnabled, resolveProviderDecision } from "@/shared/feature-flags";
import type { ToolsCatalog } from "@/features/tools/contracts";

interface ToolsServiceClient {
  readonly get: AxiosInstance["get"];
}

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

export const createToolsService = (client: ToolsServiceClient) => {
  return {
    getCatalog: async (): Promise<ToolsCatalog> => {
      const response = await client.get<ToolsCatalog>("/tools/catalog");
      return await applyToolsFlags(response.data);
    },
  };
};

/**
 * Aplica overrides de feature flags no catalogo de ferramentas.
 * @param catalog Catalogo base vindo do backend ou placeholder.
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

export const toolsService = createToolsService(httpClient);
