import {
  DEFAULT_CATEGORY_ICON,
  resolveCategoryIcon,
} from "@/features/transactions/utils/category-icon";

describe("resolveCategoryIcon", () => {
  it("mapeia apelidos de ícone conhecidos (case-insensitive)", () => {
    expect(resolveCategoryIcon("cash", "Qualquer")).toBe("cash");
    expect(resolveCategoryIcon("WALLET", "Qualquer")).toBe("wallet-outline");
    expect(resolveCategoryIcon("credit-card", "Qualquer")).toBe("credit-card-outline");
  });

  it("infere pelo nome da categoria quando o ícone não é reconhecido", () => {
    expect(resolveCategoryIcon(null, "Impostos")).toBe("file-document-outline");
    expect(resolveCategoryIcon("desconhecido", "Salário")).toBe("briefcase-outline");
    expect(resolveCategoryIcon(null, "Moradia")).toBe("home-outline");
  });

  it("ignora acentos e caixa ao inferir pelo nome", () => {
    expect(resolveCategoryIcon(null, "ALIMENTAÇÃO")).toBe("silverware-fork-knife");
    expect(resolveCategoryIcon(null, "Saúde")).toBe("heart-pulse");
  });

  it("usa o fallback quando não há pista de ícone nem nome", () => {
    expect(resolveCategoryIcon(null, "Categoria Estranha")).toBe(
      DEFAULT_CATEGORY_ICON,
    );
    expect(resolveCategoryIcon("", "")).toBe(DEFAULT_CATEGORY_ICON);
  });

  it("prioriza o apelido do ícone sobre a inferência por nome", () => {
    // ícone "gift" tem prioridade mesmo com nome que casaria com outra regra.
    expect(resolveCategoryIcon("gift", "Impostos")).toBe("gift-outline");
  });
});
