import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import type { EnrichedTransaction } from "@/features/credit-cards/model/card-transactions";
import { AppHeading } from "@/shared/components/app-heading";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppText } from "@/shared/components/app-text";
import { formatCurrency } from "@/shared/utils/formatters";

/** Quantidade máxima de lançamentos recentes exibidos. */
const MAX_ITEMS = 5;

/** Props da seção "Lançamentos recentes". */
export interface CardRecentTransactionsProps {
  /** Lançamentos do mês (mais novos primeiro). */
  readonly transactions: readonly EnrichedTransaction[];
  /** Abre a fatura completa (link "Ver fatura"). */
  readonly onSeeInvoice: () => void;
  readonly testID?: string;
}

const itemHelper = (item: EnrichedTransaction): string => {
  if (item.isInstallment && item.installmentCount) {
    return `Parcelado ${item.installmentCount}x`;
  }
  return item.purchaseDate;
};

function TransactionRow({
  item,
}: {
  readonly item: EnrichedTransaction;
}): ReactElement {
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

/**
 * Seção "Lançamentos recentes" do detalhe do cartão: cabeçalho com um link
 * "Ver fatura" e até cinco lançamentos do mês. Quando vazio, mostra um aviso
 * curto. Apresentacional — o handler de abertura vem por prop.
 *
 * @param props Lançamentos e handler de abrir a fatura.
 * @returns Card com os lançamentos recentes.
 */
export function CardRecentTransactions({
  transactions,
  onSeeInvoice,
  testID,
}: CardRecentTransactionsProps): ReactElement {
  const items = transactions.slice(0, MAX_ITEMS);

  return (
    <AppSurfaceCard testID={testID ?? "card-recent-transactions"}>
      <YStack gap="$3">
        <XStack alignItems="center" justifyContent="space-between" gap="$3">
          <AppHeading level={2} fontSize="$6">
            Lançamentos recentes
          </AppHeading>
          <AppText
            size="bodySm"
            tone="primary"
            fontWeight="$7"
            accessibilityRole="button"
            accessibilityLabel="Ver fatura"
            onPress={onSeeInvoice}
            testID="card-recent-see-invoice"
          >
            Ver fatura
          </AppText>
        </XStack>
        {items.length > 0 ? (
          <YStack gap="$3">
            {items.map((item) => (
              <TransactionRow key={item.id} item={item} />
            ))}
          </YStack>
        ) : (
          <AppText size="bodySm" tone="muted">
            Sem lançamentos neste mês.
          </AppText>
        )}
      </YStack>
    </AppSurfaceCard>
  );
}
