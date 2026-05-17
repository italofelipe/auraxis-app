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
      periodStart: "2026-05-04T00:00:00.000Z",
      periodEnd: "2026-05-10T23:59:59.000Z",
      status: "delivered",
      generatedAt: "2026-05-11T09:00:00.000Z",
      readAt: null,
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
});
