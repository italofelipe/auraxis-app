import type { ToolsCatalog } from "@/types/contracts";

import { applyToolsFlags, createToolsApi } from "@/lib/tools-api";

const mockIsFeatureEnabled = jest.fn();

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: (...args: readonly unknown[]) => mockIsFeatureEnabled(...args),
}));

describe("tools api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFeatureEnabled.mockReturnValue(false);
  });

  it("carrega catalogo remoto e aplica override de feature flag", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const get = jest.fn().mockResolvedValue({
      data: {
        tools: [
          {
            id: "raise-calculator",
            name: "Pedir aumento",
            description: "Descricao",
            enabled: false,
          },
        ],
      },
    });

    const toolsApi = createToolsApi({ get });
    const response = await toolsApi.getCatalog();

    expect(get).toHaveBeenCalledWith("/tools/catalog");
    expect(response.tools[0]?.enabled).toBe(true);
    expect(mockIsFeatureEnabled).toHaveBeenCalledWith("app.tools.salary-raise-calculator");
  });

  it("nao altera ferramentas sem flag dedicada", () => {
    const catalog: ToolsCatalog = {
      tools: [
        {
          id: "bill-forecast",
          name: "Simulador de contas",
          description: "Descricao",
          enabled: true,
        },
      ],
    };

    const result = applyToolsFlags(catalog);
    expect(result.tools[0]?.enabled).toBe(true);
    expect(mockIsFeatureEnabled).not.toHaveBeenCalled();
  });
});
