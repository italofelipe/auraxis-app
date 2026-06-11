import { type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import type {
  TransactionsStatusFilter,
  TransactionsTagFilter,
  TransactionsTypeFilter,
} from "@/features/transactions/hooks/use-transactions-screen-controller";
import { AppButton } from "@/shared/components/app-button";

const TYPE_LABELS: Record<TransactionsTypeFilter, string> = {
  all: "Todas",
  income: "Receitas",
  expense: "Despesas",
};

const TYPE_ORDER: readonly TransactionsTypeFilter[] = ["all", "income", "expense"];

const STATUS_LABELS: Record<TransactionsStatusFilter, string> = {
  all: "Todos",
  pending: "Pendente",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
  postponed: "Adiado",
};

const STATUS_ORDER: readonly TransactionsStatusFilter[] = [
  "all",
  "pending",
  "paid",
  "overdue",
  "cancelled",
  "postponed",
];

export interface TransactionFiltersProps {
  readonly typeFilter: TransactionsTypeFilter;
  readonly onTypeFilterChange: (filter: TransactionsTypeFilter) => void;
  readonly statusFilter: TransactionsStatusFilter;
  readonly onStatusFilterChange: (filter: TransactionsStatusFilter) => void;
  readonly tagFilter: TransactionsTagFilter;
  readonly onTagFilterChange: (filter: TransactionsTagFilter) => void;
  readonly periodLabel: string;
  readonly onPreviousMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onClearFilters: () => void;
}

interface FilterChipProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
}

function FilterChip({ label, selected, onPress }: FilterChipProps): ReactElement {
  return (
    <AppButton
      tone={selected ? "primary" : "secondary"}
      onPress={onPress}
      accessibilityState={{ selected }}
    >
      {label}
    </AppButton>
  );
}

interface PeriodNavigatorProps {
  readonly periodLabel: string;
  readonly onPreviousMonth: () => void;
  readonly onNextMonth: () => void;
}

function PeriodNavigator({
  periodLabel,
  onPreviousMonth,
  onNextMonth,
}: PeriodNavigatorProps): ReactElement {
  return (
    <XStack alignItems="center" gap="$2">
      <AppButton
        tone="secondary"
        onPress={onPreviousMonth}
        accessibilityLabel="Mes anterior"
      >
        {"<"}
      </AppButton>
      <Paragraph
        flex={1}
        textAlign="center"
        color="$color"
        fontFamily="$body"
        fontSize="$4"
        accessibilityRole="header"
      >
        {periodLabel}
      </Paragraph>
      <AppButton
        tone="secondary"
        onPress={onNextMonth}
        accessibilityLabel="Proximo mes"
      >
        {">"}
      </AppButton>
    </XStack>
  );
}

interface TagFilterRowProps {
  readonly tagFilter: TransactionsTagFilter;
  readonly onTagFilterChange: (filter: TransactionsTagFilter) => void;
}

function TagFilterRow({
  tagFilter,
  onTagFilterChange,
}: TagFilterRowProps): ReactElement | null {
  const tagsQuery = useTagsQuery();
  const tags = tagsQuery.data?.tags ?? [];

  if (tags.length === 0) {
    return null;
  }

  return (
    <XStack gap="$2" flexWrap="wrap">
      <FilterChip
        label="Todas as tags"
        selected={tagFilter === "all"}
        onPress={() => onTagFilterChange("all")}
      />
      {tags.map((tag) => (
        <FilterChip
          key={tag.id}
          label={tag.name}
          selected={tagFilter === tag.id}
          onPress={() => onTagFilterChange(tag.id)}
        />
      ))}
    </XStack>
  );
}

/**
 * Filter bar for the transactions screen: monthly period navigation, type,
 * status and tag filters plus a reset action. Mirrors the web filters.
 */
export function TransactionFilters({
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  periodLabel,
  onPreviousMonth,
  onNextMonth,
  onClearFilters,
}: TransactionFiltersProps): ReactElement {
  return (
    <YStack gap="$3">
      <PeriodNavigator
        periodLabel={periodLabel}
        onPreviousMonth={onPreviousMonth}
        onNextMonth={onNextMonth}
      />
      <XStack gap="$2" flexWrap="wrap">
        {TYPE_ORDER.map((filter) => (
          <FilterChip
            key={filter}
            label={TYPE_LABELS[filter]}
            selected={typeFilter === filter}
            onPress={() => onTypeFilterChange(filter)}
          />
        ))}
      </XStack>
      <XStack gap="$2" flexWrap="wrap">
        {STATUS_ORDER.map((filter) => (
          <FilterChip
            key={filter}
            label={STATUS_LABELS[filter]}
            selected={statusFilter === filter}
            onPress={() => onStatusFilterChange(filter)}
          />
        ))}
      </XStack>
      <TagFilterRow tagFilter={tagFilter} onTagFilterChange={onTagFilterChange} />
      <AppButton tone="secondary" onPress={onClearFilters}>
        Limpar filtros
      </AppButton>
    </YStack>
  );
}
