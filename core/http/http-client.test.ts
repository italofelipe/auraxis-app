import { httpClient } from "@/core/http/http-client";

describe("httpClient", () => {
  it("normaliza o baseURL sem barras duplicadas", () => {
    expect(httpClient.defaults.baseURL?.endsWith("/")).toBe(false);
  });

  it("envia o header canônico de contrato por padrão", () => {
    expect(httpClient.defaults.headers["X-API-Contract"]).toBeDefined();
  });
});
