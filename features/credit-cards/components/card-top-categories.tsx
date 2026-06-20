import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import type { CategoryGroup } from "@/features/credit-cards/model/credit-card-aggregation";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppSectionHeader } from "@/shared/components/app-section-header";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppText } from "@/shared/components/app-text";
import { formatCurrency } from "@/shared/utils/formatters";

/** Quantidade máxima de categorias exibidas. */
const MAX_CATEGORIES = 4;

/** Lado (px) do marcador colorido da categoria. */
const DOT_SIZE = 30;

/** Props da seção "Top categorias". */
export interface CardTopCategoriesProps {
  /** Categorias agregadas do mês (já ordenadas por total desc). */
  readonly categories: readonly CategoryGroup[];
  readonly testID?: string;
}

function CategoryRow({ category }: { readonly category: CategoryGroup }): ReactElement {
  return (
    <XStack alignItems="center" gap="$3">
      <YStack
        width={DOT_SIZE}
        height={DOT_SIZE}
        borderRadius="$2"
        backgroundColor={category.color}
        opacity={0.18}
      />
      <YStack
        position="absolute"
        width={DOT_SIZE}
        height={DOT_SIZE}
        alignItems="center"
        justifyContent="center"
      >
        <YStack
          width={10}
          height={10}
          borderRadius="$5"
          backgroundColor={category.color}
        />
      </YStack>
      <AppText size="body" fontWeight="$6" flex={1} numberOfLines={1}>
        {category.name}
      </AppText>
      <AppMoneyText fontSize="$4" fontWeight="$6">
        {formatCurrency(category.total)}
      </AppMoneyText>
    </XStack>
  );
}

/**
 * Seção "Top categorias" do detalhe do cartão: até quatro categorias com um
 * marcador colorido, o nome e o total em mono. Quando não há categorias no mês,
 * mostra um aviso curto. Apresentacional.
 *
 * @param props Categorias agregadas do mês.
 * @returns Card com as principais categorias.
 */
export function CardTopCategories({
  categories,
  testID,
}: CardTopCategoriesProps): ReactElement {
  const top = categories.slice(0, MAX_CATEGORIES);

  return (
    <AppSurfaceCard testID={testID ?? "card-top-categories"}>
      <YStack gap="$4">
        <AppSectionHeader title="Top categorias" />
        {top.length > 0 ? (
          <YStack gap="$3">
            {top.map((category) => (
              <CategoryRow
                key={category.tagId ?? "uncategorized"}
                category={category}
              />
            ))}
          </YStack>
        ) : (
          <AppText size="bodySm" tone="muted">
            Sem gastos categorizados neste mês.
          </AppText>
        )}
      </YStack>
    </AppSurfaceCard>
  );
}
