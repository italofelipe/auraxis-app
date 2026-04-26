import { categoryRanker } from "@/features/dashboard/services/category-ranker";
import type { DashboardCategoryTotal } from "@/features/dashboard/contracts";

const buildCategory = (
  override: Partial<DashboardCategoryTotal> = {},
): DashboardCategoryTotal => ({
  tagId: "t-1",
  categoryName: "Mercado",
  totalAmount: 100,
  transactionsCount: 1,
  ...override,
});

describe("CategoryRanker.rank", () => {
  it("retorna lista vazia quando nao ha categorias", () => {
    expect(categoryRanker.rank([])).toEqual([]);
  });

  it("ordena por totalAmount decrescente", () => {
    const ranked = categoryRanker.rank([
      buildCategory({ tagId: "a", categoryName: "A", totalAmount: 50 }),
      buildCategory({ tagId: "b", categoryName: "B", totalAmount: 200 }),
      buildCategory({ tagId: "c", categoryName: "C", totalAmount: 100 }),
    ]);
    expect(ranked.map((c) => c.categoryName)).toEqual(["B", "C", "A"]);
  });

  it("calcula share como percentual do total", () => {
    const ranked = categoryRanker.rank([
      buildCategory({ tagId: "a", categoryName: "A", totalAmount: 200 }),
      buildCategory({ tagId: "b", categoryName: "B", totalAmount: 100 }),
    ]);
    const totalShare = ranked.reduce((sum, item) => sum + item.share, 0);
    expect(ranked[0].share).toBe(67);
    expect(ranked[1].share).toBe(33);
    expect(totalShare).toBeGreaterThanOrEqual(99);
  });

  it("respeita limit configurado", () => {
    const categories = Array.from({ length: 10 }, (_, index) =>
      buildCategory({ tagId: `t-${index}`, categoryName: `C${index}`, totalAmount: index + 1 }),
    );
    const ranked = categoryRanker.rank(categories, { limit: 3 });
    expect(ranked).toHaveLength(3);
  });

  it("filtra categorias com totalAmount zero ou negativo", () => {
    const ranked = categoryRanker.rank([
      buildCategory({ totalAmount: 100 }),
      buildCategory({ totalAmount: 0 }),
      buildCategory({ totalAmount: -10 }),
    ]);
    expect(ranked).toHaveLength(1);
  });
});
