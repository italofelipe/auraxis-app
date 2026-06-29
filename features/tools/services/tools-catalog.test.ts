import { TOOL_CATEGORIES } from "@/features/tools/contracts";
import {
  TOOL_CATEGORY_LABELS,
  getCanonicalToolsCatalog,
} from "@/features/tools/services/tools-catalog";

describe("tools catalog", () => {
  it("expõe pelo menos 30 ferramentas no catálogo canônico", () => {
    const catalog = getCanonicalToolsCatalog();
    expect(catalog.tools.length).toBeGreaterThanOrEqual(30);
  });

  it("garante que todos os ids são únicos", () => {
    const catalog = getCanonicalToolsCatalog();
    const ids = catalog.tools.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("garante que todos os slugs são únicos e em kebab-case", () => {
    const catalog = getCanonicalToolsCatalog();
    const slugs = catalog.tools.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("toda ferramenta usa uma categoria válida", () => {
    const catalog = getCanonicalToolsCatalog();
    const validCategories = new Set<string>(TOOL_CATEGORIES);
    for (const tool of catalog.tools) {
      expect(validCategories.has(tool.category)).toBe(true);
    }
  });

  it("ferramentas habilitadas precisam declarar route não-vazia", () => {
    const catalog = getCanonicalToolsCatalog();
    const enabled = catalog.tools.filter((tool) => tool.enabled);
    expect(enabled.length).toBeGreaterThan(0);
    for (const tool of enabled) {
      expect(typeof tool.route).toBe("string");
      expect(tool.route?.startsWith("/")).toBe(true);
    }
  });

  it("ferramentas em backlog (enabled false) não declaram route", () => {
    const catalog = getCanonicalToolsCatalog();
    const disabled = catalog.tools.filter((tool) => !tool.enabled);
    expect(disabled.length).toBeGreaterThan(0);
    for (const tool of disabled) {
      expect(tool.route).toBeUndefined();
    }
  });

  it("expõe um label legível para cada categoria conhecida", () => {
    for (const category of TOOL_CATEGORIES) {
      const label = TOOL_CATEGORY_LABELS[category];
      expect(label).toBeTruthy();
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("inclui as 3 ferramentas funcionais existentes (installment-vs-cash, salary-simulator, goal-simulator)", () => {
    const catalog = getCanonicalToolsCatalog();
    const ids = new Set(catalog.tools.map((tool) => tool.id));
    expect(ids.has("installment-vs-cash")).toBe(true);
    expect(ids.has("salary-simulator")).toBe(true);
    expect(ids.has("goal-simulator")).toBe(true);
  });

  it("inclui Custo de Vida Regional como ferramenta funcional premium", () => {
    const catalog = getCanonicalToolsCatalog();
    const tool = catalog.tools.find((entry) => entry.id === "regional-cost-of-living");

    expect(tool).toMatchObject({
      slug: "custo-de-vida-regional",
      name: "Custo de vida regional",
      category: "daily-life",
      enabled: true,
      requiresPremium: true,
      route: "/custo-de-vida-regional",
    });
  });

  it("marca como premium as ferramentas avançadas equivalentes ao web", () => {
    const catalog = getCanonicalToolsCatalog();
    const premiumIds = new Set([
      "installment-vs-cash",
      "compound-interest",
      "emergency-fund",
      "fifty-thirty-twenty",
      "debt-payoff",
      "split-bill",
      "cost-of-lifestyle",
      "regional-cost-of-living",
      "desconto-markup",
    ]);

    for (const tool of catalog.tools) {
      if (premiumIds.has(tool.id)) {
        expect(tool.requiresPremium).toBe(true);
      }
    }
  });
});
