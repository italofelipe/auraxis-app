import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useFeatureAccess } from "@/features/entitlements/hooks/use-feature-access";
import { useWeeklySnapshotQuery } from "@/features/weekly-snapshot/hooks/use-weekly-snapshot-query";
import { useWeeklySnapshotCardController } from "@/features/weekly-snapshot/hooks/use-weekly-snapshot-card-controller";
import {
  loadLastSeenSignature,
  persistLastSeenSignature,
} from "@/features/weekly-snapshot/services/weekly-snapshot-seen-storage";

jest.mock("@/features/entitlements/hooks/use-feature-access", () => ({
  useFeatureAccess: jest.fn(),
}));
jest.mock("@/features/weekly-snapshot/hooks/use-weekly-snapshot-query", () => ({
  useWeeklySnapshotQuery: jest.fn(),
}));
jest.mock("@/features/weekly-snapshot/services/weekly-snapshot-seen-storage", () => ({
  loadLastSeenSignature: jest.fn(),
  persistLastSeenSignature: jest.fn(),
}));

const mockedUseFeatureAccess = jest.mocked(useFeatureAccess);
const mockedUseQuery = jest.mocked(useWeeklySnapshotQuery);
const mockedLoadSeen = jest.mocked(loadLastSeenSignature);
const mockedPersistSeen = jest.mocked(persistLastSeenSignature);

const snapshot = {
  narrative: "Semana positiva",
  weekStart: "2026-06-08",
  weekEnd: "2026-06-14",
  currentIncome: 5000,
  currentExpense: 1800,
  currentBalance: 3200,
  transactionCount: 23,
  expenseDeltaPercent: -14.3,
  balanceDeltaPercent: 10.3,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedLoadSeen.mockResolvedValue(null);
  mockedPersistSeen.mockResolvedValue();
  mockedUseFeatureAccess.mockReturnValue({ hasAccess: true, isLoading: false });
  mockedUseQuery.mockReturnValue({ data: snapshot } as never);
});

describe("useWeeklySnapshotCardController", () => {
  it("habilita a query somente com entitlement premium", () => {
    mockedUseFeatureAccess.mockReturnValue({ hasAccess: false, isLoading: false });
    renderHook(() => useWeeklySnapshotCardController());
    expect(mockedUseQuery).toHaveBeenCalledWith(false);
  });

  it("expoe hasAccess do entitlement", () => {
    const { result } = renderHook(() => useWeeklySnapshotCardController());
    expect(result.current.hasAccess).toBe(true);
    expect(mockedUseQuery).toHaveBeenCalledWith(true);
  });

  it("marca isNew=true quando a assinatura difere da ultima vista", async () => {
    mockedLoadSeen.mockResolvedValue("2026-06-01_2026-06-07_2100");
    const { result } = renderHook(() => useWeeklySnapshotCardController());
    await waitFor(() => expect(result.current.isNew).toBe(true));
  });

  it("marca isNew=false quando ja foi vista", async () => {
    mockedLoadSeen.mockResolvedValue("2026-06-08_2026-06-14_1800");
    const { result } = renderHook(() => useWeeklySnapshotCardController());
    await waitFor(() => expect(result.current.isNew).toBe(false));
  });

  it("markSeen persiste a assinatura e limpa o badge", async () => {
    mockedLoadSeen.mockResolvedValue("velha");
    const { result } = renderHook(() => useWeeklySnapshotCardController());
    await waitFor(() => expect(result.current.isNew).toBe(true));

    await act(async () => {
      await result.current.markSeen();
    });

    expect(mockedPersistSeen).toHaveBeenCalledWith("2026-06-08_2026-06-14_1800");
    expect(result.current.isNew).toBe(false);
  });
});
