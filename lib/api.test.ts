import { ApiClient } from "./api";

describe("ApiClient", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it("normaliza a base URL removendo barra final", () => {
    const client = new ApiClient("http://localhost:5000/");

    expect(client.getBaseUrl()).toBe("http://localhost:5000");
  });

  it("executa healthcheck em /health", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ status: "ok" }),
      text: async () => "",
    } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new ApiClient("http://localhost:5000");
    const response = await client.checkHealth();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/health", { method: "GET" });
    expect(response).toEqual({ status: "ok" });
  });

  it("lanca erro tipado quando resposta nao e sucesso", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ error: "Service unavailable" }),
      text: async () => "",
    } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new ApiClient("http://localhost:5000");

    await expect(client.checkHealth()).rejects.toEqual(
      expect.objectContaining({
        name: "ApiRequestError",
        status: 503,
        payload: { error: "Service unavailable" },
      }),
    );
  });
});
