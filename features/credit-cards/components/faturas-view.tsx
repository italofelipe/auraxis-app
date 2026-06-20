import type { ReactElement } from "react";

import { YStack } from "tamagui";

import type { EnrichedTransaction } from "@/features/credit-cards/model/card-transactions";
import type { StatementViewModel } from "@/features/credit-cards/model/credit-card-statement";
import { InvoiceSummaryCard } from "@/features/credit-cards/components/invoice-summary-card";
import { OndeFoiGasto } from "@/features/credit-cards/components/onde-foi-gasto";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppSectionHeader } from "@/shared/components/app-section-header";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppText } from "@/shared/components/app-text";
import { formatCurrency } from "@/shared/utils/formatters";

/** Quantidade máxima de lançamentos recentes listados. */
const MAX_ITEMS = 8;

/** Props da visão "Faturas". */
export interface FaturasViewProps {
  /** View-model da visão Faturas. */
  readonly faturas: StatementViewModel;
  /** Eyebrow do resumo ("Fatura consolidada" ou nome do cartão). */
  readonly eyebrow: string;
  /** Abre o detalhe da fatura. */
  readonly onOpenInvoice: () => void;
  readonly testID?: string;
}

const flattenRecentItems = (
  faturas: StatementViewModel,
): readonly EnrichedTransaction[] =>
  faturas.categories
    .flatMap((category) => category.items)
    .slice()
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
    .slice(0, MAX_ITEMS);

const itemHelper = (item: EnrichedTransaction): string => {
  if (item.isInstallment && item.installmentCount) {
    return `Parcelado ${item.installmentCount}x`;
  }
  return item.purchaseDate;
};

/**
 * Visão "Faturas": resumo da fatura (tocável), "Onde foi gasto" por categoria e
 * a lista dos lançamentos recentes do mês. Apresentacional — recebe o
 * view-model e o handler de abertura via props.
 *
 * @param props View-model de Faturas, eyebrow e handler de abertura.
 * @returns Composição da visão Faturas.
 */
export function FaturasView({
  faturas,
  eyebrow,
  onOpenInvoice,
  testID,
}: FaturasViewProps): ReactElement {
  const recentItems = flattenRecentItems(faturas);

  return (
    <YStack gap="$4" testID={testID ?? "faturas-view"}>
      <InvoiceSummaryCard
        eyebrow={eyebrow}
        monthLabel={faturas.monthLabel}
        total={faturas.total}
        status={faturas.status}
        dueDate={faturas.dueDate}
        itemCount={faturas.itemCount}
        onOpenInvoice={onOpenInvoice}
      />

      <OndeFoiGasto categories={faturas.categories} />

      <AppSurfaceCard>
        <YStack gap="$3">
          <AppSectionHeader title="Itens da fatura" />
          {recentItems.length > 0 ? (
            <YStack gap="$3">
              {recentItems.map((item) => (
                <AppKeyValueRow
                  key={item.id}
                  label={item.title}
                  helperText={itemHelper(item)}
                  value={
                    <AppMoneyText fontSize="$4">
                      {formatCurrency(item.amount)}
                    </AppMoneyText>
                  }
                />
              ))}
            </YStack>
          ) : (
            <AppText size="bodySm" tone="muted">
              Sem lançamentos neste mês.
            </AppText>
          )}
        </YStack>
      </AppSurfaceCard>
    </YStack>
  );
}
