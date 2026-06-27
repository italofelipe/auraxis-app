import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { XStack, YStack } from "tamagui";

import type { CategoryGroup } from "@/features/credit-cards/model/credit-card-aggregation";
import type { EnrichedTransaction } from "@/features/credit-cards/model/card-transactions";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppSectionHeader } from "@/shared/components/app-section-header";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppText } from "@/shared/components/app-text";
import { iconSizes } from "@/shared/theme";
import { formatCurrency } from "@/shared/utils/formatters";

/** Quantidade máxima de categorias renderizadas. */
const MAX_GROUPS = 6;
/** Quantidade máxima de itens por categoria. */
const MAX_ITEMS_PER_GROUP = 6;

/** Props da seção "Itens da fatura" agrupada por categoria. */
export interface InvoiceGroupedItemsProps {
  /** Grupos de categoria com seus itens (ordenados por total desc). */
  readonly groups: readonly CategoryGroup[];
  readonly onEditExpense?: (item: EnrichedTransaction) => void;
  readonly onDuplicateExpense?: (item: EnrichedTransaction) => void;
  readonly onRequestDeleteExpense?: (item: EnrichedTransaction) => void;
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

interface ItemActionButtonProps {
  readonly item: EnrichedTransaction;
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly label: string;
  readonly tone?: "default" | "danger";
  readonly testID: string;
  readonly onPress?: (item: EnrichedTransaction) => void;
}

function ItemActionButton({
  item,
  icon,
  label,
  tone = "default",
  testID,
  onPress,
}: ItemActionButtonProps): ReactElement {
  return (
    <XStack
      accessibilityRole="button"
      accessibilityLabel={`${label} ${item.title}`}
      testID={testID}
      width={44}
      height={44}
      borderRadius="$2"
      borderWidth={1}
      borderColor={tone === "danger" ? "$dangerSubtle" : "$borderColor"}
      backgroundColor="$surfaceRaised"
      alignItems="center"
      justifyContent="center"
      pressStyle={{ scale: 0.94 }}
      onPress={() => onPress?.(item)}
    >
      <MaterialCommunityIcons
        name={icon}
        size={iconSizes.sm}
        color={tone === "danger" ? "#C2414D" : "#087FA7"}
      />
    </XStack>
  );
}

interface ItemRowProps {
  readonly item: EnrichedTransaction;
  readonly onEditExpense?: (item: EnrichedTransaction) => void;
  readonly onDuplicateExpense?: (item: EnrichedTransaction) => void;
  readonly onRequestDeleteExpense?: (item: EnrichedTransaction) => void;
}

function ItemRow({
  item,
  onEditExpense,
  onDuplicateExpense,
  onRequestDeleteExpense,
}: ItemRowProps): ReactElement {
  const hasActions = Boolean(
    onEditExpense || onDuplicateExpense || onRequestDeleteExpense,
  );
  return (
    <YStack gap="$2">
      <XStack alignItems="center" gap="$3">
        <YStack
          flex={1}
          gap="$1"
          accessibilityRole="button"
          accessibilityLabel={`Editar ${item.title}`}
          testID={`invoice-item-open-${item.id}`}
          onPress={() => onEditExpense?.(item)}
          paddingVertical="$1"
          pressStyle={{ opacity: 0.78 }}
        >
          <AppText size="body" fontWeight="$6" numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText size="caption" tone="muted" numberOfLines={1}>
            {itemHelper(item)}
          </AppText>
        </YStack>
        <AppMoneyText fontSize="$4">{formatCurrency(item.amount)}</AppMoneyText>
      </XStack>
      {hasActions ? (
        <XStack alignItems="center" justifyContent="space-between" gap="$2">
          <XStack
            alignItems="center"
            gap="$1"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            backgroundColor="$primarySubtle"
          >
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={iconSizes.xs}
              color="#087FA7"
            />
            <AppText size="caption" color="$primary" fontWeight="$6">
              Também em Transações
            </AppText>
          </XStack>
          <XStack gap="$2">
            <ItemActionButton
              item={item}
              icon="pencil-outline"
              label="Editar"
              testID={`invoice-item-edit-${item.id}`}
              onPress={onEditExpense}
            />
            <ItemActionButton
              item={item}
              icon="content-copy"
              label="Duplicar"
              testID={`invoice-item-duplicate-${item.id}`}
              onPress={onDuplicateExpense}
            />
            <ItemActionButton
              item={item}
              icon="trash-can-outline"
              label="Remover"
              tone="danger"
              testID={`invoice-item-delete-${item.id}`}
              onPress={onRequestDeleteExpense}
            />
          </XStack>
        </XStack>
      ) : null}
    </YStack>
  );
}

interface CategorySectionProps {
  readonly group: CategoryGroup;
  readonly onEditExpense?: (item: EnrichedTransaction) => void;
  readonly onDuplicateExpense?: (item: EnrichedTransaction) => void;
  readonly onRequestDeleteExpense?: (item: EnrichedTransaction) => void;
}

function CategorySection({
  group,
  onEditExpense,
  onDuplicateExpense,
  onRequestDeleteExpense,
}: CategorySectionProps): ReactElement {
  const items = group.items.slice(0, MAX_ITEMS_PER_GROUP);
  return (
    <YStack gap="$3">
      <GroupHeader group={group} />
      <YStack gap="$3">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onEditExpense={onEditExpense}
            onDuplicateExpense={onDuplicateExpense}
            onRequestDeleteExpense={onRequestDeleteExpense}
          />
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
  onEditExpense,
  onDuplicateExpense,
  onRequestDeleteExpense,
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
                onEditExpense={onEditExpense}
                onDuplicateExpense={onDuplicateExpense}
                onRequestDeleteExpense={onRequestDeleteExpense}
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
