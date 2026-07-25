import { createMockApiAdapter } from "@/shared/mocks/api/router";

describe("createMockApiAdapter", () => {
  it("responde com login mockado para a rota de auth", async () => {
    const adapter = createMockApiAdapter(0);
    const response = await adapter({
      method: "post",
      url: "/auth/login",
      headers: {},
      data: {
        email: "italo@auraxis.com.br",
        password: "MinhaSenha@123",
      },
    } as never);

    expect(response.status).toBe(200);
    expect(response.data.data.user.email).toBe("italo@auraxis.com.br");
  });

  it("considera config.params ao resolver entitlement premium", async () => {
    const adapter = createMockApiAdapter(0);
    const response = await adapter({
      method: "get",
      url: "/entitlements/check",
      params: {
        feature_key: "advanced_simulations",
      },
      headers: {},
    } as never);

    expect(response.status).toBe(200);
    expect(response.data.data).toEqual({
      feature_key: "advanced_simulations",
      active: true,
    });
  });

  it("simula consentimento e resposta do assistente financeiro", async () => {
    const adapter = createMockApiAdapter(0);
    const consent = await adapter({
      method: "post",
      url: "/me/consents",
      headers: {},
      data: {
        kind: "ai",
        version: "1.0",
        action: "granted",
        source: "app",
      },
    } as never);
    const response = await adapter({
      method: "post",
      url: "/ai/chat",
      headers: {},
      data: {
        question: "Quanto gastei?",
      },
    } as never);

    expect(consent.status).toBe(201);
    expect(consent.data.data.action).toBe("granted");
    expect(response.status).toBe(200);
    expect(response.data.data.answer).toContain("alimentação");
    expect(response.data.data.period_label).toBe("julho/2026");
  });
});
