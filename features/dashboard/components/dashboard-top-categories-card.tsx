import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import {
  categoryRanker,
  type CategoryRankItem,
} from "@/features/dashboard/services/category-ranker";
import type { DashboardCategoryTotal } from "@/features/dashboard/contracts";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

export interface DashboardTopCategoriesCardProps {
  readonly title: string;
  readonly description: string;
  readonly categories: readonly DashboardCategoryTotal[];
  readonly tone?: "expense" | "income";
  readonly limit?: number;
}

/**
 * Visual card that ranks the top categories of a dashboard period
 * using `CategoryRanker.rank`. Pure view — no query or mutation.
 */
export function DashboardTopCategoriesCard({
  title,
  description,
  categories,
  tone = "expense",
  limit = 5,
}: DashboardTopCategoriesCardProps): ReactElement {
  const ranked = categoryRanker.rank(categories, { limit });

  if (ranked.length === 0) {
    return (
      <AppSurfaceCard title={title} description={description}>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Nenhuma categoria com movimento neste periodo.
        </Paragraph>
      </AppSurfaceCard>
    );
  }

  return (
    <AppSurfaceCard title={title} description={description}>
      <YStack gap="$3">
        {ranked.map((item) => (
          <CategoryRow key={item.tagId ?? item.categoryName} item={item} tone={tone} />
        ))}
      </YStack>
    </AppSurfaceCard>
  );
}

interface CategoryRowProps {
  readonly item: CategoryRankItem;
  readonly tone: "expense" | "income";
}

function CategoryRow({ item, tone }: CategoryRowProps): ReactElement {
  const amountColor = tone === "income" ? "$success" : "$danger";
  return (
    <AppKeyValueRow
      label={item.categoryName}
      value={
        <XStack alignItems="center" gap="$2">
          <YStack alignItems="flex-end" gap="$1">
            <Paragraph color={amountColor} fontFamily="$body" fontSize="$4">
              {formatCurrency(item.totalAmount)}
            </Paragraph>
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              {item.share}% · {item.transactionsCount} mov.
            </Paragraph>
          </YStack>
        </XStack>
      }
    />
  );
}
