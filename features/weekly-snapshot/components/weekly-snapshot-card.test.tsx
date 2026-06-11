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
  expenseDeltaPercent: -14.3,
  balanceDeltaPercent: 10.3,
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
    expect(getByText("Despesas -14.3%")).toBeTruthy();
    expect(getByText("Saldo +10.3%")).toBeTruthy();
    expect(getByText("23 transacoes")).toBeTruthy();
  });

  it("mostra badge NOVO e marca como visto quando e novo", async () => {
    mockedController.mockReturnValue(buildController({ isNew: true }) as never);
    const { getByText } = renderCard();
    expect(getByText("NOVO")).toBeTruthy();
    await waitFor(() => expect(mockMarkSeen).toHaveBeenCalled());
  });
});
