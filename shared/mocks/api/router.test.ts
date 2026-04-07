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
});
