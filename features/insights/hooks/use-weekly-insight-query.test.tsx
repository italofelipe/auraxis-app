import { act, renderHook, waitFor } from "@testing-library/react-native";

import type { UserInsight } from "@/features/insights/contracts";
import { useWeeklyInsight } from "@/features/insights/hooks/use-weekly-insight-query";
import { insightService } from "@/features/insights/services/insight-service";
import { createTestQueryClient } from "@/shared/testing/test-query-client";
import { createTestHookWrapper } from "@/shared/testing/test-providers";

jest.mock("@/features/insights/services/insight-service", () => ({
  insightService: {
    getLatest: jest.fn(),
    markAsRead: jest.fn(),
  },
}));

const mockedInsightService = jest.mocked(insightService);

const insightFixture: UserInsight = {
  id: "ins-1",
  content: "Voce reduziu gastos variaveis sem cortar lazer.",
  keyMetric: "Voce economizou R$ 320 nesta semana",
  periodStart: "2026-05-04T00:00:00.000Z",
  periodEnd: "2026-05-10T23:59:59.000Z",
  status: "delivered",
  generatedAt: "2026-05-11T09:00:00.000Z",
  readAt: null,
};

describe("useWeeklyInsight", () => {
  beforeEach(() => {
    mockedInsightService.getLatest.mockResolvedValue(insightFixture);
    mockedInsightService.markAsRead.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("carrega o insight semanal e expõe isNew quando ainda nao foi lido", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = createTestHookWrapper({ queryClient });

    const { result } = renderHook(() => useWeeklyInsight(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.insight).toEqual(insightFixture);
    expect(result.current.isNew).toBe(true);
    expect(mockedInsightService.getLatest).toHaveBeenCalledTimes(1);
  });

  it("expõe insight null e isNew false quando nao ha insight disponivel", async () => {
    mockedInsightService.getLatest.mockResolvedValueOnce(null);
    const queryClient = createTestQueryClient();
    const wrapper = createTestHookWrapper({ queryClient });

    const { result } = renderHook(() => useWeeklyInsight(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.insight).toBeNull();
    expect(result.current.isNew).toBe(false);
  });

  it("marca como lido com atualizacao otimista no cache", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = createTestHookWrapper({ queryClient });

    const { result } = renderHook(() => useWeeklyInsight(), { wrapper });

    await waitFor(() => {
      expect(result.current.insight?.id).toBe("ins-1");
    });

    await act(async () => {
      await result.current.markAsRead("ins-1");
    });

    expect(mockedInsightService.markAsRead).toHaveBeenCalledWith("ins-1");
    await waitFor(() => {
      expect(result.current.insight?.status).toBe("read");
    });
    expect(result.current.insight?.readAt).toEqual(expect.any(String));
    expect(result.current.isNew).toBe(false);
  });
});
