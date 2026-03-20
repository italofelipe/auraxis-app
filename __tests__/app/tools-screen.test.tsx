import { render } from "@testing-library/react-native";
import type { UseQueryResult } from "@tanstack/react-query";

import { AppProviders } from "@/components/providers/app-providers";
import ToolsScreen from "@/app/(private)/ferramentas";
import { useToolsCatalogQuery } from "@/hooks/queries/use-tools-query";
import type { ToolsCatalog } from "@/types/contracts";

jest.mock("@/hooks/queries/use-tools-query", () => ({
  useToolsCatalogQuery: jest.fn(),
}));

const mockedUseToolsCatalogQuery = jest.mocked(useToolsCatalogQuery);

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

describe("ToolsScreen", () => {
  afterEach(() => {
    mockedUseToolsCatalogQuery.mockReset();
  });

  it("renderiza o estado de loading com a fundacao compartilhada", () => {
    mockedUseToolsCatalogQuery.mockReturnValue(
      buildToolsCatalogQuery({
        isFetched: false,
        isFetchedAfterMount: false,
        isLoading: true,
        isPending: true,
        status: "pending",
      }),
    );

    const { getByText } = render(
      <AppProviders>
        <ToolsScreen />
      </AppProviders>,
    );

    expect(getByText("Carregando ferramentas")).toBeTruthy();
  });

  it("renderiza o catalogo com status das ferramentas", () => {
    mockedUseToolsCatalogQuery.mockReturnValue(
      buildToolsCatalogQuery({
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
    );

    const { getByText } = render(
      <AppProviders>
        <ToolsScreen />
      </AppProviders>,
    );

    expect(getByText("Parcelado vs a vista")).toBeTruthy();
    expect(getByText("Disponivel agora")).toBeTruthy();
    expect(getByText("Em planejamento")).toBeTruthy();
  });

  it("renderiza o estado vazio quando nao houver ferramentas", () => {
    mockedUseToolsCatalogQuery.mockReturnValue(
      buildToolsCatalogQuery({
        data: {
          tools: [],
        },
        isSuccess: true,
        status: "success",
      }),
    );

    const { getByText } = render(
      <AppProviders>
        <ToolsScreen />
      </AppProviders>,
    );

    expect(getByText("Nenhuma ferramenta disponivel")).toBeTruthy();
  });
});
