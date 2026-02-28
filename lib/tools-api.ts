import type { AxiosInstance } from "axios";

import { httpClient } from "@/lib/http-client";
import { isFeatureEnabled, resolveProviderDecision } from "@/shared/feature-flags";
import type { ToolsCatalog } from "@/types/contracts";

interface ToolsApiClient {
  readonly get: AxiosInstance["get"];
}

export const toolsPlaceholder: ToolsCatalog = {
  tools: [
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

export const createToolsApi = (client: ToolsApiClient) => {
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

export const toolsApi = createToolsApi(httpClient);
