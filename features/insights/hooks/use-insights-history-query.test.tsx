import { renderHook, waitFor } from "@testing-library/react-native";

import type { InsightHistoryResponse } from "@/features/insights/contracts";
import { useInsightsHistoryQuery } from "@/features/insights/hooks/use-insights-history-query";
import { insightService } from "@/features/insights/services/insight-service";
import { createTestQueryClient } from "@/shared/testing/test-query-client";
import { createTestHookWrapper } from "@/shared/testing/test-providers";

jest.mock("@/features/insights/services/insight-service", () => ({
  insightService: {
    history: jest.fn(),
  },
}));

const mockedInsightService = jest.mocked(insightService);

const historyFixture: InsightHistoryResponse = {
  items: [],
  page: 2,
  perPage: 10,
  total: 0,
};

describe("useInsightsHistoryQuery", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("carrega historico com paginacao canonica", async () => {
    mockedInsightService.history.mockResolvedValue(historyFixture);
    const queryClient = createTestQueryClient();
    const wrapper = createTestHookWrapper({ queryClient });

    const { result } = renderHook(
      () => useInsightsHistoryQuery({ page: 2, perPage: 10 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(historyFixture);
    });

    expect(mockedInsightService.history).toHaveBeenCalledWith({
      page: 2,
      perPage: 10,
    });
  });
});
