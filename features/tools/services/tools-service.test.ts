import type { ToolsCatalog } from "@/features/tools/contracts";
import {
  applyToolsFlags,
  createToolsService,
} from "@/features/tools/services/tools-service";

const mockIsFeatureEnabled = jest.fn();
const mockResolveProviderDecision = jest.fn();

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: (...args: readonly unknown[]) => mockIsFeatureEnabled(...args),
  resolveProviderDecision: (...args: readonly unknown[]) => mockResolveProviderDecision(...args),
}));

describe("tools api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFeatureEnabled.mockReturnValue(false);
    mockResolveProviderDecision.mockResolvedValue(undefined);
  });

  it("carrega catalogo remoto e aplica override de feature flag", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockResolveProviderDecision.mockResolvedValue(true);
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

    const toolsService = createToolsService({ get });
    const response = await toolsService.getCatalog();

    expect(get).toHaveBeenCalledWith("/tools/catalog");
    expect(response.tools[0]?.enabled).toBe(true);
    expect(mockResolveProviderDecision).toHaveBeenCalledWith("app.tools.salary-raise-calculator");
    expect(mockIsFeatureEnabled).toHaveBeenCalledWith("app.tools.salary-raise-calculator", true);
  });

  it("nao altera ferramentas sem flag dedicada", async () => {
    const catalog: ToolsCatalog = {
      tools: [
        {
          id: "installment-vs-cash",
          name: "Parcelado vs a vista",
          description: "Descricao",
          enabled: true,
        },
      ],
    };

    const result = await applyToolsFlags(catalog);
    expect(result.tools[0]?.enabled).toBe(true);
    expect(mockIsFeatureEnabled).not.toHaveBeenCalled();
  });
});
