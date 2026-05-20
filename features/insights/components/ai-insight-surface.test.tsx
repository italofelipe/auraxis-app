import { fireEvent, render } from "@testing-library/react-native";

import { ApiError } from "@/core/http/api-error";
import { AiInsightSurface } from "@/features/insights/components/ai-insight-surface";
import type { UserInsight } from "@/features/insights/contracts";
import type { AiInsightsController } from "@/features/insights/hooks/use-ai-insights-controller";
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
  keyMetric: "Resumo global",
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
      type: "alerta_orcamento",
      dimension: "budgets",
      title: "Orcamento em alerta",
      message: "Mercado chegou a 91%.",
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

const createController = (
  override: Partial<AiInsightsController> = {},
): AiInsightsController => ({
  currentInsight: insightFixture,
  visibleItems: insightFixture.items.slice(0, 2),
  dimensionGroups: [],
  history: [insightFixture],
  historyQuery: {} as AiInsightsController["historyQuery"],
  isGenerating: false,
  generateError: null,
  generateErrorTitle: null,
  callsRemaining: 1,
  hasGeneratedInsight: true,
  shouldShowContextualEmptyState: false,
  generate: jest.fn(),
  dismissGenerateError: jest.fn(),
  ...override,
});

describe("AiInsightSurface", () => {
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

  it("mostra apenas itens general e da dimensao contextual", () => {
    const { getByText, queryByText } = render(
      <TestProviders>
        <AiInsightSurface
          dimension="transactions"
          controller={createController()}
        />
      </TestProviders>,
    );

    expect(getByText("Resumo global")).toBeTruthy();
    expect(getByText("Padrao em transacoes")).toBeTruthy();
    expect(queryByText("Orcamento em alerta")).toBeNull();
  });

  it("dispara geracao daily pelo botao da superficie", () => {
    const generate = jest.fn().mockResolvedValue(undefined);
    const { getByText } = render(
      <TestProviders>
        <AiInsightSurface
          dimension="transactions"
          controller={createController({ generate })}
        />
      </TestProviders>,
    );

    fireEvent.press(getByText("Gerar insights"));

    expect(generate).toHaveBeenCalledWith({ periodType: "daily" });
  });

  it("mostra mensagem amigavel para quota 429", () => {
    const quotaError = new ApiError({
      message: "Daily limit exceeded",
      status: 429,
      code: "AI_DAILY_LIMIT_EXCEEDED",
    });
    const { getByText } = render(
      <TestProviders>
        <AiInsightSurface
          dimension="transactions"
          controller={createController({
            generateError: quotaError,
            generateErrorTitle: "Voce atingiu o limite de 2 insights/dia",
          })}
        />
      </TestProviders>,
    );

    expect(getByText("Voce atingiu o limite de 2 insights/dia")).toBeTruthy();
  });
});
