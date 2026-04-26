import type { DashboardCategoryTotal } from "@/features/dashboard/contracts";

export interface CategoryRankItem {
  readonly tagId: string | null;
  readonly categoryName: string;
  readonly totalAmount: number;
  readonly transactionsCount: number;
  readonly share: number;
}

/**
 * Pure projection that ranks dashboard categories by total amount and
 * decorates them with the share (%) of the period total.
 *
 * Class-based to keep the projection reusable across screens (dashboard,
 * monthly summary, future spending insights) and easy to swap for a
 * richer ranker (e.g. with monthly trend or comparison) without touching
 * consumers.
 */
export class CategoryRanker {
  // eslint-disable-next-line class-methods-use-this
  rank(
    categories: readonly DashboardCategoryTotal[],
    options: { readonly limit?: number } = {},
  ): readonly CategoryRankItem[] {
    const limit = options.limit ?? 5;
    const total = categories.reduce(
      (sum, category) => sum + Math.max(category.totalAmount, 0),
      0,
    );
    return [...categories]
      .filter((category) => category.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit)
      .map((category) => ({
        tagId: category.tagId,
        categoryName: category.categoryName,
        totalAmount: category.totalAmount,
        transactionsCount: category.transactionsCount,
        share: total > 0 ? Math.round((category.totalAmount / total) * 100) : 0,
      }));
  }
}

export const categoryRanker = new CategoryRanker();
