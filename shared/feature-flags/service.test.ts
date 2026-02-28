import {
  fetchUnleashSnapshot,
  getLocalFlag,
  getProviderMode,
  isFeatureEnabled,
  resetProviderCache,
  resolveEnvOverride,
  resolveProviderDecision,
  toEnvSuffix,
} from "@/shared/feature-flags/service";

/**
 * Reseta variáveis de ambiente usadas nos testes de feature flags.
 * @returns `void`.
 */
const resetFeatureFlagTestEnv = (): void => {
  delete process.env.EXPO_PUBLIC_FLAG_APP_TOOLS_SALARY_RAISE_CALCULATOR;
  delete process.env.EXPO_PUBLIC_FLAG_PROVIDER;
  delete process.env.EXPO_PUBLIC_UNLEASH_PROXY_URL;
  delete process.env.EXPO_PUBLIC_UNLEASH_CLIENT_KEY;
  delete process.env.EXPO_PUBLIC_UNLEASH_CACHE_TTL_MS;
  jest.restoreAllMocks();
  resetProviderCache();
};

describe("feature flag service - local fallback", () => {
  afterEach(() => {
    resetFeatureFlagTestEnv();
  });

  it("normaliza sufixo de env var a partir da chave da flag", () => {
    expect(toEnvSuffix("app.tools.salary-raise-calculator")).toBe(
      "APP_TOOLS_SALARY_RAISE_CALCULATOR",
    );
  });

  it("retorna undefined quando override de env nao existe", () => {
    const overrideValue = resolveEnvOverride("app.tools.salary-raise-calculator");
    expect(overrideValue).toBeUndefined();
  });

  it("retorna override de ambiente quando presente", () => {
    process.env.EXPO_PUBLIC_FLAG_APP_TOOLS_SALARY_RAISE_CALCULATOR = "true";
    const overrideValue = resolveEnvOverride("app.tools.salary-raise-calculator");
    expect(overrideValue).toBe(true);
  });

  it("retorna false para override de ambiente explicito", () => {
    process.env.EXPO_PUBLIC_FLAG_APP_TOOLS_SALARY_RAISE_CALCULATOR = "off";
    const overrideValue = resolveEnvOverride("app.tools.salary-raise-calculator");
    expect(overrideValue).toBe(false);
  });

  it("retorna undefined para override invalido", () => {
    process.env.EXPO_PUBLIC_FLAG_APP_TOOLS_SALARY_RAISE_CALCULATOR = "invalid";
    const overrideValue = resolveEnvOverride("app.tools.salary-raise-calculator");
    expect(overrideValue).toBeUndefined();
  });

  it("retorna definicao da flag quando ela existe no catalogo", () => {
    const localFlag = getLocalFlag("app.tools.salary-raise-calculator");
    expect(localFlag?.key).toBe("app.tools.salary-raise-calculator");
  });

  it("considera flag desabilitada quando status local e draft", () => {
    expect(isFeatureEnabled("app.tools.salary-raise-calculator")).toBe(false);
  });

  it("respeita decisao explicita do provider externo", () => {
    expect(isFeatureEnabled("app.tools.salary-raise-calculator", true)).toBe(true);
    expect(isFeatureEnabled("app.tools.salary-raise-calculator", false)).toBe(false);
  });

  it("retorna false quando flag nao existe no catalogo e sem override", () => {
    const isEnabled = isFeatureEnabled("app.unknown-flag");
    expect(isEnabled).toBe(false);
  });
});

describe("feature flag service - unleash provider", () => {
  afterEach(() => {
    resetFeatureFlagTestEnv();
  });

  it("retorna modo local quando provider nao esta configurado", () => {
    expect(getProviderMode()).toBe("local");
  });

  it("retorna modo unleash quando provider esta configurado", () => {
    process.env.EXPO_PUBLIC_FLAG_PROVIDER = "unleash";
    expect(getProviderMode()).toBe("unleash");
  });

  it("resolve decisao remota quando provider unleash esta ativo", async () => {
    process.env.EXPO_PUBLIC_FLAG_PROVIDER = "unleash";
    process.env.EXPO_PUBLIC_UNLEASH_PROXY_URL = "https://flags.local";
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            name: "app.tools.salary-raise-calculator",
            enabled: true,
          },
        ],
      }),
    } as unknown as Response);

    const providerDecision = await resolveProviderDecision(
      "app.tools.salary-raise-calculator",
    );
    expect(providerDecision).toBe(true);
  });

  it("retorna snapshot vazio quando provider remoto retorna payload invalido", async () => {
    process.env.EXPO_PUBLIC_FLAG_PROVIDER = "unleash";
    process.env.EXPO_PUBLIC_UNLEASH_PROXY_URL = "https://flags.local";
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        features: ["invalid-feature-entry"],
      }),
    } as unknown as Response);

    const snapshot = await fetchUnleashSnapshot();
    expect(snapshot).toEqual({});
  });

  it("retorna snapshot vazio quando provider remoto responde com erro HTTP", async () => {
    process.env.EXPO_PUBLIC_FLAG_PROVIDER = "unleash";
    process.env.EXPO_PUBLIC_UNLEASH_PROXY_URL = "https://flags.local";
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as unknown as Response);

    const snapshot = await fetchUnleashSnapshot();
    expect(snapshot).toEqual({});
  });

  it("usa cache curto para snapshot remoto", async () => {
    process.env.EXPO_PUBLIC_FLAG_PROVIDER = "unleash";
    process.env.EXPO_PUBLIC_UNLEASH_PROXY_URL = "https://flags.local";
    process.env.EXPO_PUBLIC_UNLEASH_CACHE_TTL_MS = "-1";
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            name: "app.tools.salary-raise-calculator",
            enabled: true,
          },
        ],
      }),
    } as unknown as Response);

    const firstSnapshot = await fetchUnleashSnapshot();
    const secondSnapshot = await fetchUnleashSnapshot();

    expect(firstSnapshot["app.tools.salary-raise-calculator"]).toBe(true);
    expect(secondSnapshot["app.tools.salary-raise-calculator"]).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("retorna undefined quando provider remoto falha", async () => {
    process.env.EXPO_PUBLIC_FLAG_PROVIDER = "unleash";
    process.env.EXPO_PUBLIC_UNLEASH_PROXY_URL = "https://flags.local";
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

    const providerDecision = await resolveProviderDecision(
      "app.tools.salary-raise-calculator",
    );
    expect(providerDecision).toBeUndefined();
  });

  it("retorna undefined quando provider remoto nao conhece a flag", async () => {
    process.env.EXPO_PUBLIC_FLAG_PROVIDER = "unleash";
    process.env.EXPO_PUBLIC_UNLEASH_PROXY_URL = "https://flags.local";
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [],
      }),
    } as unknown as Response);

    const providerDecision = await resolveProviderDecision(
      "app.tools.salary-raise-calculator",
    );
    expect(providerDecision).toBeUndefined();
  });
});
