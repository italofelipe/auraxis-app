import { render } from "@testing-library/react-native";

import { InsightHub } from "@/features/insights/components/insight-hub";
import type { UserInsight } from "@/features/insights/contracts";
import type { AiInsightsController } from "@/features/insights/hooks/use-ai-insights-controller";
import { groupInsightItemsByDimension } from "@/features/insights/hooks/use-insights-by-dimension";
import { TestProviders } from "@/shared/testing/test-providers";

const mockUseFeatureAccess = jest.fn();
const mockUseAiInsightConsent = jest.fn();

jest.mock("@/features/entitlements/hooks/use-feature-access", () => ({
  useFeatureAccess: (...args: readonly unknown[]) => mockUseFeatureAccess(...args),
}));

jest.mock("@/features/insights/hooks/use-ai-insight-consent", () => ({
  useAiInsightConsent: (...args: readonly unknown[]) => mockUseAiInsightConsent(...args),
}));

const insightFixture: UserInsight = {
  id: "ins-1",
  content: "Resumo global",
  keyMetric: "Resumo global do periodo",
  items: [
    {
      type: "saude_financeira",
      dimension: "general",
      title: "Resumo global",
      message: "O caixa segue positivo.",
    },
    {
      type: "padrao_gasto",
      dimension: "transactions",
      title: "Padrao em transacoes",
      message: "Despesas pequenas se repetiram.",
    },
    {
      type: "alerta_meta",
      dimension: "goals",
      title: "Meta em atencao",
      message: "A reserva ficou abaixo do ritmo planejado.",
    },
  ],
  summary: { headline: "Periodo equilibrado" },
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

const historyQuery = {
  data: {
    items: [insightFixture],
    page: 1,
    perPage: 20,
    total: 1,
  },
  error: null,
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: jest.fn(),
} as unknown as AiInsightsController["historyQuery"];

const controller: AiInsightsController = {
  currentInsight: insightFixture,
  visibleItems: insightFixture.items,
  dimensionGroups: groupInsightItemsByDimension(insightFixture.items),
  history: [insightFixture],
  historyQuery,
  isGenerating: false,
  generateError: null,
  generateErrorTitle: null,
  callsRemaining: 1,
  hasGeneratedInsight: true,
  shouldShowContextualEmptyState: false,
  generate: jest.fn(),
  dismissGenerateError: jest.fn(),
};

describe("InsightHub", () => {
  beforeEach(() => {
    mockUseFeatureAccess.mockReturnValue({ hasAccess: true, isLoading: false });
    mockUseAiInsightConsent.mockReturnValue({
      hasConsent: true,
      isHydrated: true,
      grantConsent: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("agrupa o insight atual por dimensao", () => {
    const tree = render(
      <TestProviders>
        <InsightHub controller={controller} />
      </TestProviders>,
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
