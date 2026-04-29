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

  it("carrega catalogo canônico e aplica override do flag de salary-raise", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockResolveProviderDecision.mockResolvedValue(true);

    const toolsService = createToolsService();
    const response = await toolsService.getCatalog();

    const salaryRaise = response.tools.find((tool) => tool.id === "salary-raise");
    expect(salaryRaise?.enabled).toBe(true);
    expect(mockResolveProviderDecision).toHaveBeenCalledWith(
      "app.tools.salary-raise-calculator",
    );
    expect(mockIsFeatureEnabled).toHaveBeenCalledWith(
      "app.tools.salary-raise-calculator",
      true,
    );
  });

  it("nao altera ferramentas sem flag dedicada", async () => {
    const catalog: ToolsCatalog = {
      tools: [
        {
          id: "installment-vs-cash",
          slug: "parcelado-vs-a-vista",
          name: "Parcelado vs à vista",
          description: "Descricao",
          category: "daily-life",
          enabled: true,
          route: "/installment-vs-cash",
        },
      ],
    };

    const result = await applyToolsFlags(catalog);
    expect(result.tools[0]?.enabled).toBe(true);
    expect(mockIsFeatureEnabled).not.toHaveBeenCalled();
  });

  it("preserva enabled true quando flag retorna true para salary-raise", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockResolveProviderDecision.mockResolvedValue(true);

    const catalog: ToolsCatalog = {
      tools: [
        {
          id: "salary-raise",
          slug: "pedir-aumento",
          name: "Pedir aumento",
          description: "Recomposição da inflação + ganho real desejado.",
          category: "salary-and-work",
          enabled: false,
        },
      ],
    };

    const result = await applyToolsFlags(catalog);
    expect(result.tools[0]?.enabled).toBe(true);
  });

  it("força enabled false quando flag retorna false para salary-raise", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);

    const catalog: ToolsCatalog = {
      tools: [
        {
          id: "salary-raise",
          slug: "pedir-aumento",
          name: "Pedir aumento",
          description: "Recomposição da inflação + ganho real desejado.",
          category: "salary-and-work",
          enabled: true,
        },
      ],
    };

    const result = await applyToolsFlags(catalog);
    expect(result.tools[0]?.enabled).toBe(false);
  });
});
