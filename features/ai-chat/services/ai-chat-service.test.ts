import { ApiError } from "@/core/http/api-error";
import { AI_CHAT_REQUEST_TIMEOUT_MS } from "@/features/ai-chat/ai-chat-config";
import {
  createAiChatService,
  normalizeAiChatQuestion,
} from "@/features/ai-chat/services/ai-chat-service";

const createClient = () => ({
  post: jest.fn(),
});

describe("aiChatService", () => {
  it("envia a pergunta normalizada e mapeia o envelope snake_case", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: {
        data: {
          answer: "Você gastou R$ 320.",
          model: "gpt-4o-mini",
          tokens_used: 380,
          cost_usd: 0.000057,
          period_label: "julho/2026",
          tool_rounds: 1,
        },
      },
    });

    const service = createAiChatService(client as never);
    await expect(service.askFinancialQuestion({ question: "  Quanto gastei?  " })).resolves.toEqual(
      {
        answer: "Você gastou R$ 320.",
        model: "gpt-4o-mini",
        tokensUsed: 380,
        costUsd: 0.000057,
        periodLabel: "julho/2026",
        toolRounds: 1,
      },
    );
    expect(client.post).toHaveBeenCalledWith(
      "/ai/chat",
      { question: "Quanto gastei?" },
      { timeout: AI_CHAT_REQUEST_TIMEOUT_MS },
    );
  });

  it("aceita payload flat e torna metadados opcionais absence-safe", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: {
        answer: "Sem dados suficientes.",
        model: "gpt-test",
      },
    });

    const service = createAiChatService(client as never);
    await expect(service.askFinancialQuestion({ question: "Minha meta?" })).resolves.toEqual({
      answer: "Sem dados suficientes.",
      model: "gpt-test",
      tokensUsed: 0,
      costUsd: 0,
      periodLabel: null,
      toolRounds: null,
    });
  });

  it("rejeita pergunta vazia ou acima do limite antes da rede", async () => {
    expect(() => normalizeAiChatQuestion("   ")).toThrow(ApiError);
    expect(() => normalizeAiChatQuestion("a".repeat(1_001))).toThrow(
      expect.objectContaining({
        status: 400,
        code: "VALIDATION_ERROR",
      }),
    );
  });

  it("rejeita resposta sem campos essenciais", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: { data: { answer: "", model: "gpt-test" } },
    });

    await expect(
      createAiChatService(client as never).askFinancialQuestion({
        question: "Quanto gastei?",
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: "INVALID_RESPONSE",
      }),
    );
  });
});
