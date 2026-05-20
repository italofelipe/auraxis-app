import { act, renderHook, waitFor } from "@testing-library/react-native";

import type {
  GeneratedInsightResponse,
  UserInsight,
} from "@/features/insights/contracts";
import { useGenerateInsightMutation } from "@/features/insights/hooks/use-generate-insight-mutation";
import { insightService } from "@/features/insights/services/insight-service";
import { createTestQueryClient } from "@/shared/testing/test-query-client";
import { createTestHookWrapper } from "@/shared/testing/test-providers";

jest.mock("@/features/insights/services/insight-service", () => ({
  insightService: {
    generate: jest.fn(),
  },
}));

const mockedInsightService = jest.mocked(insightService);

const insightFixture: UserInsight = {
  id: "ins-1",
  content: "Resumo global",
  keyMetric: "Resumo global",
  items: [
    {
      type: "saude_financeira",
      dimension: "general",
      title: "Resumo global",
      message: "O caixa segue positivo.",
    },
  ],
  summary: null,
  periodType: "daily",
  periodLabel: "2026-05-19",
  periodStart: "2026-05-19",
  periodEnd: "2026-05-19",
  status: "delivered",
  generatedAt: "2026-05-19",
  readAt: null,
  metadata: {
    model: "gpt-4o-mini",
    tokensUsed: 420,
    costUsd: 0.000063,
    cached: false,
    contextVersion: "financial_insight_snapshot.v1",
  },
};

const generatedFixture: GeneratedInsightResponse = {
  insight: insightFixture,
  callsRemaining: 1,
};

describe("useGenerateInsightMutation", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("gera insight e publica a mesma record no cache compartilhado", async () => {
    mockedInsightService.generate.mockResolvedValue(generatedFixture);
    const queryClient = createTestQueryClient();
    const wrapper = createTestHookWrapper({ queryClient });

    const { result } = renderHook(() => useGenerateInsightMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ periodType: "daily" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockedInsightService.generate).toHaveBeenCalledWith({ periodType: "daily" });
    expect(queryClient.getQueryData(["insights", "current"])).toEqual(insightFixture);
  });
});
