import { getLocalFlag, isFeatureEnabled, resolveEnvOverride, toEnvSuffix } from "@/shared/feature-flags/service";

describe("feature flag service", () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_FLAG_APP_TOOLS_SALARY_RAISE_CALCULATOR;
  });

  it("normaliza sufixo de env var a partir da chave da flag", () => {
    expect(toEnvSuffix("app.tools.salary-raise-calculator")).toBe("APP_TOOLS_SALARY_RAISE_CALCULATOR");
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
});
