import type { AxiosInstance } from "axios";

import { ApiError } from "@/core/http/api-error";
import { createInsightService } from "@/features/insights/services/insight-service";

const createClient = (): jest.Mocked<Pick<AxiosInstance, "get" | "post">> => ({
  get: jest.fn(),
  post: jest.fn(),
});

describe("insightService", () => {
  it("carrega o insight semanal mais recente mapeando snake_case", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          insight: {
            id: "ins-1",
            content: "Voce reduziu gastos variaveis sem cortar lazer.",
            key_metric: "Voce economizou R$ 320 nesta semana",
            period_start: "2026-05-04T00:00:00.000Z",
            period_end: "2026-05-10T23:59:59.000Z",
            status: "delivered",
            generated_at: "2026-05-11T09:00:00.000Z",
            read_at: null,
          },
        },
      },
    });

    const service = createInsightService(client as unknown as AxiosInstance);
    const result = await service.getLatest();

    expect(client.get).toHaveBeenCalledWith("/v1/insights/latest");
    expect(result).toEqual({
      id: "ins-1",
      content: "Voce reduziu gastos variaveis sem cortar lazer.",
      keyMetric: "Voce economizou R$ 320 nesta semana",
      items: [
        {
          type: "weekly_summary",
          dimension: "general",
          title: "Voce economizou R$ 320 nesta semana",
          message: "Voce reduziu gastos variaveis sem cortar lazer.",
        },
      ],
      summary: null,
      periodType: "weekly",
      periodLabel: "2026-05-04 a 2026-05-10",
      periodStart: "2026-05-04T00:00:00.000Z",
      periodEnd: "2026-05-10T23:59:59.000Z",
      status: "delivered",
      generatedAt: "2026-05-11T09:00:00.000Z",
      readAt: null,
      metadata: {
        model: null,
        tokensUsed: null,
        costUsd: null,
        cached: null,
        contextVersion: null,
      },
    });
  });

  it("mapeia o contrato estruturado de insights financeiros", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          insight: {
            id: "ins-structured-1",
            content: "Resumo consolidado da semana.",
            key_metric: "Saldo semanal positivo",
            items: [
              {
                type: "weekly_cashflow",
                dimension: "transactions",
                title: "Fluxo de caixa",
                message: "As entradas superaram as saidas em R$ 420.",
                evidence: ["current_period.net_balance"],
              },
            ],
            summary: {
              headline: "Semana mais equilibrada",
              net_balance: 420,
            },
            period_type: "weekly",
            period_label: "Semana 20 · 2026",
            period_start: "2026-05-11T00:00:00.000Z",
            period_end: "2026-05-17T23:59:59.000Z",
            status: "delivered",
            generated_at: "2026-05-17T09:00:00.000Z",
            read_at: null,
            model: "gpt-4o-mini",
            tokens_used: 728,
            cost_usd: 0.0042,
            cached: false,
            context_version: "financial_insight_snapshot.v1",
          },
        },
      },
    });

    const service = createInsightService(client as unknown as AxiosInstance);
    const result = await service.getLatest();

    expect(result).toMatchObject({
      id: "ins-structured-1",
      keyMetric: "Saldo semanal positivo",
      items: [
        {
          type: "weekly_cashflow",
          dimension: "transactions",
          title: "Fluxo de caixa",
          message: "As entradas superaram as saidas em R$ 420.",
          evidence: ["current_period.net_balance"],
        },
      ],
      summary: {
        headline: "Semana mais equilibrada",
        net_balance: 420,
      },
      periodType: "weekly",
      periodLabel: "Semana 20 · 2026",
      metadata: {
        model: "gpt-4o-mini",
        tokensUsed: 728,
        costUsd: 0.0042,
        cached: false,
        contextVersion: "financial_insight_snapshot.v1",
      },
    });
  });

  it("retorna null quando a API responde 404 para insight ausente", async () => {
    const client = createClient();
    client.get.mockRejectedValue(
      new ApiError({
        message: "Insight nao encontrado",
        status: 404,
        code: "NOT_FOUND",
      }),
    );

    const service = createInsightService(client as unknown as AxiosInstance);

    await expect(service.getLatest()).resolves.toBeNull();
  });

  it("marca o insight como lido no endpoint canonico", async () => {
    const client = createClient();
    client.post.mockResolvedValue({ data: { data: {} } });

    const service = createInsightService(client as unknown as AxiosInstance);
    await service.markAsRead("ins-1");

    expect(client.post).toHaveBeenCalledWith("/v1/insights/ins-1/read");
  });

  it("gera insight period-aware com dimensoes e cabecalho de quota", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      headers: { "x-ai-calls-remaining": "1" },
      data: {
        data: {
          summary: "Resumo do periodo.",
          context_hash: "hash-1",
          context_version: "financial_insight_snapshot.v1",
          period_type: "daily",
          period_label: "2026-05-19",
          period_start: "2026-05-19",
          period_end: "2026-05-19",
          model: "gpt-4o-mini",
          tokens_used: 420,
          cost_usd: 0.000063,
          cached: false,
          items: [
            {
              type: "saude_financeira",
              dimension: "general",
              title: "Saldo positivo",
              message: "Voce terminou o periodo com saldo positivo.",
              evidence: ["current_period.paid.balance"],
            },
          ],
        },
      },
    });

    const service = createInsightService(client as unknown as AxiosInstance);
    const result = await service.generate({
      periodType: "daily",
      anchorDate: "2026-05-19",
    });

    expect(client.post).toHaveBeenCalledWith("/ai/insights/generate", {
      period_type: "daily",
      anchor_date: "2026-05-19",
    });
    expect(result.callsRemaining).toBe(1);
    expect(result.insight).toMatchObject({
      id: "hash-1",
      keyMetric: "Resumo do periodo.",
      periodType: "daily",
      periodLabel: "2026-05-19",
      metadata: {
        model: "gpt-4o-mini",
        tokensUsed: 420,
        costUsd: 0.000063,
        cached: false,
        contextVersion: "financial_insight_snapshot.v1",
      },
      items: [
        {
          type: "saude_financeira",
          dimension: "general",
          title: "Saldo positivo",
          message: "Voce terminou o periodo com saldo positivo.",
          evidence: ["current_period.paid.balance"],
        },
      ],
    });
  });

  it("carrega historico com fallback general para item legado sem dimension", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              id: "hist-1",
              content: JSON.stringify({
                summary: "Resumo legado",
                items: [
                  {
                    type: "padrao_gasto",
                    title: "Padrao recorrente",
                    message: "Compras pequenas se repetiram no periodo.",
                  },
                ],
              }),
              insight_type: "daily",
              period_label: "2026-05-19",
              period_start: "2026-05-19",
              period_end: "2026-05-19",
              created_at: "2026-05-19T10:00:00.000Z",
            },
          ],
          page: 1,
          per_page: 20,
          total: 1,
        },
      },
    });

    const service = createInsightService(client as unknown as AxiosInstance);
    const result = await service.history({ page: 1, perPage: 20 });

    expect(client.get).toHaveBeenCalledWith("/ai/insights/history", {
      params: { page: 1, per_page: 20 },
    });
    expect(result.items[0]?.items).toEqual([
      {
        type: "padrao_gasto",
        dimension: "general",
        title: "Padrao recorrente",
        message: "Compras pequenas se repetiram no periodo.",
      },
    ]);
  });
});
