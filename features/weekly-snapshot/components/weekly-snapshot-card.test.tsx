import { render, waitFor } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { WeeklySnapshotCard } from "@/features/weekly-snapshot/components/weekly-snapshot-card";
import { useWeeklySnapshotCardController } from "@/features/weekly-snapshot/hooks/use-weekly-snapshot-card-controller";

jest.mock("@/features/weekly-snapshot/hooks/use-weekly-snapshot-card-controller", () => ({
  useWeeklySnapshotCardController: jest.fn(),
}));

const mockedController = jest.mocked(useWeeklySnapshotCardController);
const mockMarkSeen = jest.fn().mockResolvedValue(undefined);

const snapshot = {
  narrative: "Sua semana fechou positiva.",
  weekStart: "2026-06-08",
  weekEnd: "2026-06-14",
  currentIncome: 5000,
  currentExpense: 1800,
  currentBalance: 3200,
  transactionCount: 23,
  expenseDelta: -300,
  balanceDelta: 300,
};

const buildController = (overrides: Record<string, unknown> = {}) => ({
  hasAccess: true,
  isLoading: false,
  snapshot,
  query: { data: snapshot, isLoading: false, isError: false } as never,
  isNew: false,
  markSeen: mockMarkSeen,
  ...overrides,
});

const renderCard = () =>
  render(
    <TestProviders>
      <WeeklySnapshotCard />
    </TestProviders>,
  );

beforeEach(() => {
  jest.clearAllMocks();
});

describe("WeeklySnapshotCard", () => {
  it("nao renderiza nada para usuario sem entitlement premium", () => {
    mockedController.mockReturnValue(
      buildController({ hasAccess: false, snapshot: null, query: { data: undefined } }) as never,
    );
    const { toJSON } = renderCard();
    expect(toJSON()).toBeNull();
  });

  it("exibe narrativa, totais e deltas para premium", () => {
    mockedController.mockReturnValue(buildController() as never);
    const { getByText } = renderCard();
    expect(getByText("Sua semana fechou positiva.")).toBeTruthy();
    expect(getByText("Despesas R$ 300,00 a menos")).toBeTruthy();
    expect(getByText("Saldo R$ 300,00 acima")).toBeTruthy();
    expect(getByText("23 transações")).toBeTruthy();
  });

  it("suprime narrativa, métricas e percentuais quando a semana está vazia", () => {
    const emptySnapshot = {
      ...snapshot,
      narrative: "Narrativa enganosa.",
      currentIncome: 0,
      currentExpense: 0,
      currentBalance: 0,
      transactionCount: 0,
      expenseDelta: -1800,
      balanceDelta: -3200,
    };
    mockedController.mockReturnValue(
      buildController({
        snapshot: emptySnapshot,
        query: { data: emptySnapshot, isLoading: false, isError: false },
      }) as never,
    );
    const { getByText, queryByText } = renderCard();
    expect(getByText("Sem movimentações nesta semana")).toBeTruthy();
    expect(queryByText("Narrativa enganosa.")).toBeNull();
    expect(queryByText(/-100%/)).toBeNull();
  });

  it("descreve deltas negativos com texto e tom contextual", () => {
    const negativeSnapshot = {
      ...snapshot,
      expenseDelta: 250,
      balanceDelta: -800,
    };
    mockedController.mockReturnValue(
      buildController({
        snapshot: negativeSnapshot,
        query: { data: negativeSnapshot, isLoading: false, isError: false },
      }) as never,
    );
    const { getByText } = renderCard();
    expect(getByText("Despesas R$ 250,00 a mais")).toBeTruthy();
    expect(getByText("Saldo R$ 800,00 abaixo")).toBeTruthy();
  });

  it("mostra badge NOVO e marca como visto quando e novo", async () => {
    mockedController.mockReturnValue(buildController({ isNew: true }) as never);
    const { getByText } = renderCard();
    expect(getByText("NOVO")).toBeTruthy();
    await waitFor(() => expect(mockMarkSeen).toHaveBeenCalled());
  });
});
