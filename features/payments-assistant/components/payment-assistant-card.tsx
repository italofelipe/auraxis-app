import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { TransactionRecord } from "@/features/transactions/contracts";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppText } from "@/shared/components/app-text";
import { safeFormatCurrency } from "@/shared/utils/currency";
import { useT } from "@/shared/i18n";

/** Formats a `YYYY-MM-DD` (or ISO) string as `dd/mm/yyyy` without timezone drift. */
const formatDate = (value: string | null): string => {
  if (!value) {
    return "—";
  }
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

/** Props for the assistant card. */
export interface PaymentAssistantCardProps {
  readonly transaction: TransactionRecord;
}

/**
 * Presentational card for one overdue transaction in the assistant deck.
 *
 * Shows type, amount, title, description, created/due dates and observation.
 * No gesture logic — the deck wraps it.
 *
 * @param props The transaction to render.
 * @returns The card body.
 */
export function PaymentAssistantCard({ transaction }: PaymentAssistantCardProps): ReactElement {
  const { t } = useT();
  const isIncome = transaction.type === "income";

  return (
    <YStack
      backgroundColor="$surfaceCard"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$4"
      padding="$4"
      gap="$3"
    >
      <XStack alignItems="center" justifyContent="space-between">
        <Paragraph
          fontFamily="$body"
          fontWeight="$7"
          fontSize="$1"
          color={isIncome ? "$success" : "$warning"}
          borderColor={isIncome ? "$success" : "$warning"}
          borderWidth={1}
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$5"
        >
          {isIncome
            ? t("paymentsAssistant.type.income")
            : t("paymentsAssistant.type.expense")}
        </Paragraph>
        <AppMoneyText fontSize="$6" fontWeight="$7" color={isIncome ? "$success" : "$color"}>
          {safeFormatCurrency(transaction.amount)}
        </AppMoneyText>
      </XStack>

      <YStack gap="$1">
        <AppText size="bodyLg" tone="default" numberOfLines={2}>
          {transaction.title}
        </AppText>
        {transaction.description ? (
          <AppText size="bodySm" tone="muted" numberOfLines={2}>
            {transaction.description}
          </AppText>
        ) : null}
      </YStack>

      <XStack gap="$5">
        <YStack gap="$1">
          <AppText size="caption" tone="muted">
            {t("paymentsAssistant.fields.createdAt")}
          </AppText>
          <AppText size="bodySm" tone="default">
            {formatDate(transaction.createdAt)}
          </AppText>
        </YStack>
        <YStack gap="$1">
          <AppText size="caption" tone="muted">
            {t("paymentsAssistant.fields.dueDate")}
          </AppText>
          <AppText size="bodySm" tone="default">
            {formatDate(transaction.dueDate)}
          </AppText>
        </YStack>
      </XStack>

      {transaction.observation ? (
        <YStack gap="$1">
          <AppText size="caption" tone="muted">
            {t("paymentsAssistant.fields.observation")}
          </AppText>
          <AppText size="bodySm" tone="default" numberOfLines={3}>
            {transaction.observation}
          </AppText>
        </YStack>
      ) : null}
    </YStack>
  );
}
