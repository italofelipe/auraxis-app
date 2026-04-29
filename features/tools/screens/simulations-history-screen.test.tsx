import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import type { SimulationRecord } from "@/features/tools/contracts";
import { SimulationsHistoryScreen } from "@/features/tools/screens/simulations-history-screen";
import { useSimulationsHistoryScreenController } from "@/features/tools/hooks/use-simulations-history-screen-controller";

jest.mock(
  "@/features/tools/hooks/use-simulations-history-screen-controller",
  () => ({
    useSimulationsHistoryScreenController: jest.fn(),
  }),
);

const mockedUseController = jest.mocked(useSimulationsHistoryScreenController);

const buildSim = (overrides: Partial<SimulationRecord> = {}): SimulationRecord => ({
  id: overrides.id ?? "sim-1",
  toolId: overrides.toolId ?? "installment-vs-cash",
  ruleVersion: overrides.ruleVersion ?? "v1",
  inputs: overrides.inputs ?? {},
  result: overrides.result ?? {},
  metadata: overrides.metadata ?? null,
  saved: overrides.saved ?? true,
  goalId: overrides.goalId ?? null,
  createdAt: overrides.createdAt ?? "2026-04-28T12:00:00Z",
});

const buildController = (
  overrides: Partial<ReturnType<typeof useSimulationsHistoryScreenController>> = {},
) =>
  ({
    query: {
      data: { items: [], pagination: { page: 1, perPage: 30, total: 0, hasMore: false } },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    },
    items: [],
    deletingId: null,
    isRefreshing: false,
    handleRefresh: jest.fn().mockResolvedValue(undefined),
    handleDelete: jest.fn().mockResolvedValue(undefined),
    handleBack: jest.fn(),
    ...overrides,
  }) as never;

const renderWithProviders = (
  controller: ReturnType<typeof buildController>,
): ReturnType<typeof render> => {
  mockedUseController.mockReturnValue(controller);
  return render(
    <AppProviders>
      <SimulationsHistoryScreen />
    </AppProviders>,
  );
};

describe("SimulationsHistoryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza header com botões Voltar e Atualizar", () => {
    const { getByText, getByTestId } = renderWithProviders(buildController());
    expect(getByText("Voltar")).toBeTruthy();
    expect(getByTestId("simulations-refresh")).toBeTruthy();
  });

  it("encaminha refresh para o controller", () => {
    const handleRefresh = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = renderWithProviders(buildController({ handleRefresh }));
    fireEvent.press(getByTestId("simulations-refresh"));
    expect(handleRefresh).toHaveBeenCalled();
  });

  it("desabilita Atualizar quando isRefreshing", () => {
    const { getByTestId } = renderWithProviders(
      buildController({ isRefreshing: true }),
    );
    const button = getByTestId("simulations-refresh");
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it("renderiza linha por simulação e dispara delete", () => {
    const handleDelete = jest.fn().mockResolvedValue(undefined);
    const sim = buildSim({ id: "sim-42" });
    const { getByTestId } = renderWithProviders(
      buildController({
        items: [sim],
        handleDelete,
      }),
    );
    fireEvent.press(getByTestId("simulation-delete-sim-42"));
    expect(handleDelete).toHaveBeenCalledWith(sim);
  });

  it("mostra label Excluindo quando deletingId bate com a simulação", () => {
    const sim = buildSim({ id: "sim-99" });
    const { getByText } = renderWithProviders(
      buildController({
        items: [sim],
        deletingId: "sim-99",
      }),
    );
    expect(getByText(/Excluindo/i)).toBeTruthy();
  });

  it("mostra empty state quando não há simulações", () => {
    const { getByText } = renderWithProviders(buildController({ items: [] }));
    expect(getByText(/ainda não salvou simulações|nenhuma simulação salva/i)).toBeTruthy();
  });
});
