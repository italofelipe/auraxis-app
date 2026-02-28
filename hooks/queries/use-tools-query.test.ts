import type { ToolsCatalog } from "@/types/contracts";

import { useToolsCatalogQuery } from "@/hooks/queries/use-tools-query";

const mockUseQuery = jest.fn();
const mockGetCatalog = jest.fn();
const mockApplyToolsFlags = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: readonly unknown[]) => mockUseQuery(...args),
}));

jest.mock("@/lib/tools-api", () => ({
  toolsApi: {
    getCatalog: (...args: readonly unknown[]) => mockGetCatalog(...args),
  },
  toolsPlaceholder: {
    tools: [
      {
        id: "raise-calculator",
        name: "Pedir aumento",
        description: "Placeholder",
        enabled: false,
      },
    ],
  },
  applyToolsFlags: (...args: readonly unknown[]) => mockApplyToolsFlags(...args),
}));

describe("useToolsCatalogQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockImplementation((options: { readonly queryFn: () => Promise<ToolsCatalog> }) => options);
  });

  it("retorna catalogo remoto quando backend responde com sucesso", async () => {
    const remoteCatalog: ToolsCatalog = {
      tools: [
        {
          id: "raise-calculator",
          name: "Pedir aumento",
          description: "Remoto",
          enabled: true,
        },
      ],
    };
    mockGetCatalog.mockResolvedValue(remoteCatalog);

    const query = useToolsCatalogQuery() as unknown as { readonly queryFn: () => Promise<ToolsCatalog> };
    const result = await query.queryFn();

    expect(result).toEqual(remoteCatalog);
    expect(mockApplyToolsFlags).not.toHaveBeenCalled();
  });

  it("retorna placeholder com flags quando backend falha", async () => {
    const flaggedPlaceholder: ToolsCatalog = {
      tools: [
        {
          id: "raise-calculator",
          name: "Pedir aumento",
          description: "Placeholder",
          enabled: true,
        },
      ],
    };
    mockGetCatalog.mockRejectedValue(new Error("backend down"));
    mockApplyToolsFlags.mockResolvedValue(flaggedPlaceholder);

    const query = useToolsCatalogQuery() as unknown as { readonly queryFn: () => Promise<ToolsCatalog> };
    const result = await query.queryFn();

    expect(mockApplyToolsFlags).toHaveBeenCalledTimes(1);
    expect(result).toEqual(flaggedPlaceholder);
  });
});
