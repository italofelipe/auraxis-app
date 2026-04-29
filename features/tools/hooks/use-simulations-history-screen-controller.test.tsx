import { act, renderHook } from "@testing-library/react-native";

import {
  useDeleteSimulationMutation,
  useSimulationsListQuery,
} from "@/features/tools/hooks/use-simulations-query";
import { useSimulationsHistoryScreenController } from "@/features/tools/hooks/use-simulations-history-screen-controller";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("@/features/tools/hooks/use-simulations-query", () => ({
  useSimulationsListQuery: jest.fn(),
  useDeleteSimulationMutation: jest.fn(),
}));

const mockedListQuery = jest.mocked(useSimulationsListQuery);
const mockedDeleteMutation = jest.mocked(useDeleteSimulationMutation);

const buildQueryStub = (
  overrides: Partial<ReturnType<typeof useSimulationsListQuery>> = {},
) =>
  ({
    data: { items: [], pagination: { page: 1, perPage: 30, total: 0, hasMore: false } },
    isLoading: false,
    isFetching: false,
    refetch: jest.fn().mockResolvedValue({ data: undefined }),
    ...overrides,
  }) as never;

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  isPending: false,
  reset: jest.fn(),
});

describe("useSimulationsHistoryScreenController", () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it("expõe items derivados da query e isRefreshing quando há fetch sem loading inicial", () => {
    mockedListQuery.mockReturnValue(
      buildQueryStub({
        data: {
          items: [
            {
              id: "sim-1",
              toolId: "installment-vs-cash",
              ruleVersion: "v1",
              inputs: {},
              result: {}, metadata: null,
              saved: true,
              goalId: null,
              createdAt: "2026-04-28T00:00:00Z",
            },
          ],
          pagination: { page: 1, perPage: 30, total: 1, hasMore: false },
        },
        isLoading: false,
        isFetching: true,
      }),
    );
    mockedDeleteMutation.mockReturnValue(buildMutationStub() as never);

    const { result } = renderHook(() => useSimulationsHistoryScreenController());

    expect(result.current.items).toHaveLength(1);
    expect(result.current.isRefreshing).toBe(true);
  });

  it("handleDelete dispara mutation e marca/limpa deletingId", async () => {
    const mutateAsync = jest.fn().mockResolvedValue(undefined);
    mockedListQuery.mockReturnValue(buildQueryStub() as never);
    mockedDeleteMutation.mockReturnValue({
      ...buildMutationStub(),
      mutateAsync,
    } as never);

    const { result } = renderHook(() => useSimulationsHistoryScreenController());

    await act(async () => {
      await result.current.handleDelete({
        id: "sim-9",
        toolId: "x",
        ruleVersion: "v1",
        inputs: {},
        result: {}, metadata: null,
        saved: true,
        goalId: null,
        createdAt: "",
      });
    });

    expect(mutateAsync).toHaveBeenCalledWith({ simulationId: "sim-9" });
    expect(result.current.deletingId).toBeNull();
  });

  it("handleRefresh chama refetch da query", async () => {
    const refetch = jest.fn().mockResolvedValue({ data: undefined });
    mockedListQuery.mockReturnValue(buildQueryStub({ refetch }) as never);
    mockedDeleteMutation.mockReturnValue(buildMutationStub() as never);

    const { result } = renderHook(() => useSimulationsHistoryScreenController());

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(refetch).toHaveBeenCalled();
  });

  it("handleBack invoca router.back sem tocar mutation", () => {
    mockedListQuery.mockReturnValue(buildQueryStub() as never);
    const mutationStub = buildMutationStub();
    mockedDeleteMutation.mockReturnValue(mutationStub as never);

    const { result } = renderHook(() => useSimulationsHistoryScreenController());

    act(() => {
      result.current.handleBack();
    });

    expect(mockBack).toHaveBeenCalled();
    expect(mutationStub.mutateAsync).not.toHaveBeenCalled();
  });
});
