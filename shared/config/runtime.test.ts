import type * as RuntimeConfigModule from "@/shared/config/runtime";

describe("runtime production API guard", () => {
  const originalEnv = process.env;
  const loadRuntime = (): typeof RuntimeConfigModule =>
    jest.requireActual("@/shared/config/runtime") as typeof RuntimeConfigModule;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_APP_ENV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("bloqueia localhost quando o app roda como production", () => {
    const { assertProductionApiBaseUrl } = loadRuntime();

    expect(() =>
      assertProductionApiBaseUrl({
        apiBaseUrl: "http://localhost:5000",
        appEnvironment: "production",
      }),
    ).toThrow(
      "Production app runtime requires EXPO_PUBLIC_API_URL to be an HTTPS URL",
    );
  });

  it("bloqueia endpoints nao-HTTPS quando o app roda como production", () => {
    const { assertProductionApiBaseUrl } = loadRuntime();

    expect(() =>
      assertProductionApiBaseUrl({
        apiBaseUrl: "http://api.auraxis.com.br",
        appEnvironment: "production",
      }),
    ).toThrow(
      "Production app runtime requires EXPO_PUBLIC_API_URL to be an HTTPS URL",
    );
  });

  it("aceita API HTTPS normalizada em production", () => {
    const { assertProductionApiBaseUrl, normalizeBaseUrl } = loadRuntime();

    expect(
      assertProductionApiBaseUrl({
        apiBaseUrl: normalizeBaseUrl("https://api.auraxis.com.br/"),
        appEnvironment: "production",
      }),
    ).toBe("https://api.auraxis.com.br");
  });

  it("mantem localhost permitido fora de production", () => {
    const { assertProductionApiBaseUrl } = loadRuntime();

    expect(
      assertProductionApiBaseUrl({
        apiBaseUrl: "http://localhost:5000",
        appEnvironment: "development",
      }),
    ).toBe("http://localhost:5000");
  });

  it("normaliza ambientes Expo conhecidos e cai para development quando ausente", () => {
    const { resolveAppEnvironment } = loadRuntime();

    expect(resolveAppEnvironment("production")).toBe("production");
    expect(resolveAppEnvironment("preview")).toBe("preview");
    expect(resolveAppEnvironment("development")).toBe("development");
    expect(resolveAppEnvironment("")).toBe("development");
    expect(resolveAppEnvironment(undefined)).toBe("development");
  });

  it("falha ao montar o singleton quando production nao define API HTTPS", () => {
    process.env.EXPO_PUBLIC_APP_ENV = "production";

    expect(() => loadRuntime()).toThrow(
      "Production app runtime requires EXPO_PUBLIC_API_URL to be an HTTPS URL",
    );
  });

  it("monta o singleton em production quando a API publica e HTTPS", () => {
    process.env.EXPO_PUBLIC_APP_ENV = "production";
    process.env.EXPO_PUBLIC_API_URL = "https://api.auraxis.com.br/";

    const { appRuntimeConfig } = loadRuntime();

    expect(appRuntimeConfig.apiBaseUrl).toBe("https://api.auraxis.com.br");
  });
});
