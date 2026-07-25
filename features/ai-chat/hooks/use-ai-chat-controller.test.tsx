import { act, renderHook } from "@testing-library/react-native";

import { useAnalytics } from "@/core/observability/use-analytics";
import { useAiChatController } from "@/features/ai-chat/hooks/use-ai-chat-controller";
import { useAskFinancialQuestionMutation } from "@/features/ai-chat/hooks/use-ask-financial-question-mutation";
import { useFeatureAccess } from "@/features/entitlements/hooks/use-feature-access";
import { useAiInsightConsent } from "@/features/insights/hooks/use-ai-insight-consent";
import { isFeatureEnabled } from "@/shared/feature-flags";

jest.mock("@/core/observability/use-analytics", () => ({
  useAnalytics: jest.fn(),
}));
jest.mock("@/features/ai-chat/hooks/use-ask-financial-question-mutation", () => ({
  useAskFinancialQuestionMutation: jest.fn(),
}));
jest.mock("@/features/entitlements/hooks/use-feature-access", () => ({
  useFeatureAccess: jest.fn(),
}));
jest.mock("@/features/insights/hooks/use-ai-insight-consent", () => ({
  useAiInsightConsent: jest.fn(),
}));
jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

const mockedUseAnalytics = jest.mocked(useAnalytics);
const mockedUseMutation = jest.mocked(useAskFinancialQuestionMutation);
const mockedUseFeatureAccess = jest.mocked(useFeatureAccess);
const mockedUseConsent = jest.mocked(useAiInsightConsent);
const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);

const capture = jest.fn();
const mutateAsync = jest.fn();
const grantConsent = jest.fn();

const answer = {
  answer: "Você gastou R$ 320.",
  model: "gpt-test",
  tokensUsed: 42,
  costUsd: 0.001,
  periodLabel: "julho/2026",
  toolRounds: 1,
} as const;

const setupDefaults = (): void => {
  mockedIsFeatureEnabled.mockReturnValue(true);
  mockedUseFeatureAccess.mockReturnValue({
    hasAccess: true,
    isLoading: false,
  });
  mockedUseConsent.mockReturnValue({
    hasConsent: true,
    grantedAt: "2026-07-24T20:00:00Z",
    isHydrated: true,
    grantConsent,
  });
  mockedUseMutation.mockReturnValue({ mutateAsync } as never);
  mockedUseAnalytics.mockReturnValue({
    capture,
    identify: jest.fn(),
    screen: jest.fn(),
    reset: jest.fn(),
  });
  mutateAsync.mockResolvedValue(answer);
  grantConsent.mockResolvedValue(undefined);
};

describe("useAiChatController gates", () => {
  beforeEach(setupDefaults);

  it("desliga consultas dependentes quando o kill switch está inativo", () => {
    mockedIsFeatureEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useAiChatController());

    expect(result.current.isEnabled).toBe(false);
    expect(mockedUseFeatureAccess).toHaveBeenCalledWith("advanced_simulations", false);
    expect(mockedUseConsent).toHaveBeenCalledWith({ enabled: false });
  });

  it("expõe carregamento, paywall e hidratação do consentimento", () => {
    mockedUseFeatureAccess.mockReturnValue({
      hasAccess: false,
      isLoading: true,
    });
    mockedUseConsent.mockReturnValue({
      hasConsent: false,
      grantedAt: null,
      isHydrated: false,
      grantConsent,
    });

    const { result } = renderHook(() => useAiChatController());

    expect(result.current.isPremiumLoading).toBe(true);
    expect(result.current.hasPremiumAccess).toBe(false);
    expect(result.current.isConsentHydrated).toBe(false);
  });
});

describe("useAiChatController session", () => {
  beforeEach(setupDefaults);

  it("preserva o transcript ao fechar e reabrir e não envia texto ao analytics", async () => {
    const { result } = renderHook(() =>
      useAiChatController({
        now: () => new Date("2026-07-24T20:00:00Z"),
        createId: jest.fn().mockReturnValueOnce("message-user").mockReturnValueOnce("message-ai"),
      }),
    );

    act(() => result.current.open());
    await act(async () => {
      await result.current.ask("  Quanto gastei?  ");
    });
    act(() => result.current.close());
    act(() => result.current.open());

    expect(result.current.messages).toEqual([
      {
        id: "message-user",
        role: "user",
        content: "Quanto gastei?",
        createdAt: "2026-07-24T20:00:00.000Z",
      },
      {
        id: "message-ai",
        role: "assistant",
        content: "Você gastou R$ 320.",
        createdAt: "2026-07-24T20:00:00.000Z",
        periodLabel: "julho/2026",
      },
    ]);
    expect(result.current.isOpen).toBe(true);
    expect(mutateAsync).toHaveBeenCalledWith("Quanto gastei?");

    const analyticsPayload = JSON.stringify(capture.mock.calls);
    expect(analyticsPayload).not.toContain("Quanto gastei?");
    expect(analyticsPayload).not.toContain("Você gastou R$ 320.");
    expect(capture).toHaveBeenCalledWith("ai.chat.answer.received", {
      periodAnchored: true,
      usedTools: true,
    });
  });

  it("faz retry transitório sem duplicar a mensagem do usuário", async () => {
    mutateAsync
      .mockRejectedValueOnce({ status: 500, code: "INTERNAL_ERROR" })
      .mockResolvedValueOnce(answer);
    const { result } = renderHook(() => useAiChatController());

    await act(async () => {
      await result.current.ask("Qual foi meu maior gasto?");
    });
    expect(result.current.errorKind).toBe("server");
    expect(result.current.canRetry).toBe(true);
    expect(result.current.messages).toHaveLength(1);

    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.errorKind).toBeNull();
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages.filter((message) => message.role === "user")).toHaveLength(1);
    expect(mutateAsync).toHaveBeenCalledTimes(2);
    expect(capture).toHaveBeenCalledWith("ai.chat.question.sent", {
      attempt: "retry",
    });
  });

  it("ignora pergunta vazia e bloqueia texto acima do contrato", async () => {
    const { result } = renderHook(() => useAiChatController());

    await act(async () => {
      await result.current.ask("   ");
      await result.current.ask("a".repeat(1_001));
    });

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.errorKind).toBe("validation");
    expect(result.current.canRetry).toBe(false);
  });

  it("registra consentimento remoto e classifica falha ao conceder", async () => {
    const { result } = renderHook(() => useAiChatController());

    await act(async () => {
      await result.current.grantConsent();
    });
    expect(grantConsent).toHaveBeenCalledTimes(1);
    expect(result.current.consentErrorKind).toBeNull();

    grantConsent.mockRejectedValueOnce({
      status: 0,
      message: "timeout of 15000ms exceeded",
    });
    await act(async () => {
      await result.current.grantConsent();
    });
    expect(result.current.consentErrorKind).toBe("timeout");
  });

  it("repete automaticamente a pergunta após renovar consentimento", async () => {
    mutateAsync
      .mockRejectedValueOnce({
        status: 403,
        code: "AI_CONSENT_REQUIRED",
      })
      .mockResolvedValueOnce(answer);
    const { result } = renderHook(() => useAiChatController());

    await act(async () => {
      await result.current.ask("Como estão minhas finanças?");
    });
    expect(result.current.errorKind).toBe("consent");

    await act(async () => {
      await result.current.grantConsent();
    });

    expect(grantConsent).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledTimes(2);
    expect(result.current.errorKind).toBeNull();
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages.filter((message) => message.role === "user")).toHaveLength(1);
  });
});
