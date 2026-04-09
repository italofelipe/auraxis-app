import { render } from "@testing-library/react-native";
import type { UseQueryResult } from "@tanstack/react-query";

import ToolsScreen from "@/app/(private)/ferramentas";
import { useToolsScreenController } from "@/features/tools/hooks/use-tools-screen-controller";
import type { ToolsCatalog } from "@/features/tools/contracts";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("@/features/tools/hooks/use-tools-screen-controller", () => ({
  useToolsScreenController: jest.fn(),
}));

const mockedUseToolsScreenController = jest.mocked(useToolsScreenController);

const buildToolsCatalogQuery = (
  overrides: Partial<UseQueryResult<ToolsCatalog, Error>>,
): UseQueryResult<ToolsCatalog, Error> => {
  return {
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    fetchStatus: "idle",
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPending: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: false,
    refetch: jest.fn(),
    status: "pending",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    isEnabled: true,
    promise: Promise.resolve(undefined),
    ...overrides,
  } as UseQueryResult<ToolsCatalog, Error>;
};

const buildToolsScreenController = (
  overrides: Partial<ReturnType<typeof useToolsScreenController>> = {},
): ReturnType<typeof useToolsScreenController> => ({
  toolsCatalogQuery: buildToolsCatalogQuery({}),
  handleOpenTool: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("ToolsScreen", () => {
  afterEach(() => {
    mockedUseToolsScreenController.mockReset();
  });

  it("renderiza o estado de loading com a fundacao compartilhada", () => {
    mockedUseToolsScreenController.mockReturnValue(
      buildToolsScreenController({
        toolsCatalogQuery: buildToolsCatalogQuery({
          isFetched: false,
          isFetchedAfterMount: false,
          isLoading: true,
          isPending: true,
          status: "pending",
        }),
      }),
    );

    const { getByText } = render(
      <TestProviders>
        <ToolsScreen />
      </TestProviders>,
    );

    expect(getByText("Carregando ferramentas")).toBeTruthy();
  });

  it("renderiza o catalogo com status das ferramentas", () => {
    mockedUseToolsScreenController.mockReturnValue(
      buildToolsScreenController({
        toolsCatalogQuery: buildToolsCatalogQuery({
          data: {
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
                description: "Planeje o ganho real que voce quer buscar.",
                enabled: false,
              },
            ],
          },
          isSuccess: true,
          status: "success",
        }),
      }),
    );

    const { getByText } = render(
      <TestProviders>
        <ToolsScreen />
      </TestProviders>,
    );

    expect(getByText("Parcelado vs a vista")).toBeTruthy();
    expect(getByText("Disponivel agora")).toBeTruthy();
    expect(getByText("Em planejamento")).toBeTruthy();
  });

  it("renderiza o estado vazio quando nao houver ferramentas", () => {
    mockedUseToolsScreenController.mockReturnValue(
      buildToolsScreenController({
        toolsCatalogQuery: buildToolsCatalogQuery({
          data: {
            tools: [],
          },
          isSuccess: true,
          status: "success",
        }),
      }),
    );

    const { getByText } = render(
      <TestProviders>
        <ToolsScreen />
      </TestProviders>,
    );

    expect(getByText("Nenhuma ferramenta disponivel")).toBeTruthy();
  });
});
