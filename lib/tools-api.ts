import type { AxiosInstance } from "axios";

import { httpClient } from "@/lib/http-client";
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
      return response.data;
    },
  };
};

export const toolsApi = createToolsApi(httpClient);
