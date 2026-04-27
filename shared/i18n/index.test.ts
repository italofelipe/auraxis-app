import { initI18n, i18n, switchLocale } from "@/shared/i18n";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "pt" }],
}));

describe("shared/i18n", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  it("traduz chave em PT por default", () => {
    expect(i18n.t("common.actions.save")).toBe("Salvar");
  });

  it("troca para EN via switchLocale", async () => {
    await switchLocale("en");
    expect(i18n.t("common.actions.save")).toBe("Save");
  });

  it("ignora locale nao suportado e mantem o atual", async () => {
    await switchLocale("en");
    const resolved = await switchLocale("zz" as never);
    expect(resolved).toBe("pt");
  });
});
