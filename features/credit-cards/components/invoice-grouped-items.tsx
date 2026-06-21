import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import type { CategoryGroup } from "@/features/credit-cards/model/credit-card-aggregation";
import type { EnrichedTransaction } from "@/features/credit-cards/model/card-transactions";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppSectionHeader } from "@/shared/components/app-section-header";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppText } from "@/shared/components/app-text";
import { formatCurrency } from "@/shared/utils/formatters";

/** Quantidade máxima de categorias renderizadas. */
const MAX_GROUPS = 6;
/** Quantidade máxima de itens por categoria. */
const MAX_ITEMS_PER_GROUP = 6;

/** Props da seção "Itens da fatura" agrupada por categoria. */
export interface InvoiceGroupedItemsProps {
  /** Grupos de categoria com seus itens (ordenados por total desc). */
  readonly groups: readonly CategoryGroup[];
  readonly testID?: string;
}

const itemHelper = (item: EnrichedTransaction): string => {
  if (item.isInstallment && item.installmentCount) {
    return `Parcelado ${item.installmentCount}x`;
  }
  return item.purchaseDate;
};

function GroupHeader({ group }: { readonly group: CategoryGroup }): ReactElement {
  return (
    <XStack alignItems="center" gap="$2">
      <YStack
        width={9}
        height={9}
        borderRadius="$1"
        backgroundColor={group.color}
      />
      <AppText size="bodySm" fontWeight="$7" numberOfLines={1}>
        {group.name}
      </AppText>
      <YStack flex={1} height={1} backgroundColor="$borderColor" />
      <AppMoneyText fontSize="$2" fontWeight="$6" color="$muted">
        {formatCurrency(group.total)}
      </AppMoneyText>
    </XStack>
  );
}

function ItemRow({ item }: { readonly item: EnrichedTransaction }): ReactElement {
  return (
    <XStack alignItems="center" gap="$3">
      <YStack flex={1} gap="$1">
        <AppText size="body" fontWeight="$6" numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText size="caption" tone="muted" numberOfLines={1}>
          {itemHelper(item)}
        </AppText>
      </YStack>
      <AppMoneyText fontSize="$4">{formatCurrency(item.amount)}</AppMoneyText>
    </XStack>
  );
}

function CategorySection({ group }: { readonly group: CategoryGroup }): ReactElement {
  const items = group.items.slice(0, MAX_ITEMS_PER_GROUP);
  return (
    <YStack gap="$3">
      <GroupHeader group={group} />
      <YStack gap="$3">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </YStack>
    </YStack>
  );
}

/**
 * Seção "Itens da fatura" agrupada POR CATEGORIA: para cada categoria, um
 * cabeçalho (ponto + nome + linha + total) seguido dos seus lançamentos. Quando
 * não há itens, mostra um aviso curto. Apresentacional.
 *
 * @param props Grupos de categoria com itens.
 * @returns Card com os itens agrupados por categoria.
 */
export function InvoiceGroupedItems({
  groups,
  testID,
}: InvoiceGroupedItemsProps): ReactElement {
  const visibleGroups = groups
    .filter((group) => group.items.length > 0)
    .slice(0, MAX_GROUPS);

  return (
    <AppSurfaceCard testID={testID ?? "invoice-grouped-items"}>
      <YStack gap="$4">
        <AppSectionHeader title="Itens da fatura" />
        {visibleGroups.length > 0 ? (
          <YStack gap="$4">
            {visibleGroups.map((group) => (
              <CategorySection
                key={group.tagId ?? "uncategorized"}
                group={group}
              />
            ))}
          </YStack>
        ) : (
          <AppText size="bodySm" tone="muted">
            Sem lançamentos nesta fatura.
          </AppText>
        )}
      </YStack>
    </AppSurfaceCard>
  );
}
