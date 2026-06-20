import { memo, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { XStack, YStack } from "tamagui";

import type { ExpenseFaturaPreview } from "@/features/credit-cards/hooks/use-expense-form";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppText } from "@/shared/components/app-text";
import { iconSizes } from "@/shared/theme";
import { formatCurrency, formatShortDate } from "@/shared/utils/formatters";

/** Props da prévia da fatura. */
export interface FaturaPreviewProps {
  /** Prévia derivada do controller (cartão + ciclo). */
  readonly preview: ExpenseFaturaPreview;
  /** Valor total da compra (em reais), exibido como impacto na fatura. */
  readonly amount: number;
  readonly testID?: string;
}

const formatDateOrDash = (value: string | null): string => {
  return value ? formatShortDate(value) : "—";
};

/**
 * Card "Prévia da fatura": quando há cartão com ciclo, mostra "Cai na fatura de
 * {mês}" com fechamento, vencimento, valor e limite; sem cartão (ou sem ciclo),
 * mostra o estado "Defina o cartão" orientando o usuário. Reaproveita
 * `AppSurfaceCard` + `AppKeyValueRow` do DS.
 *
 * @param props Prévia da fatura e valor total da compra.
 * @returns Card de prévia da fatura.
 */
const FaturaPreviewComponent = ({
  preview,
  amount,
  testID,
}: FaturaPreviewProps): ReactElement => {
  const hasCycle = preview.hasCard && preview.billLabel !== null;
  return (
    <AppSurfaceCard testID={testID ?? "fatura-preview"}>
      <XStack alignItems="center" gap="$2">
        <MaterialCommunityIcons
          name={hasCycle ? "calendar-check" : "credit-card-outline"}
          size={iconSizes.md}
          color="$primary"
        />
        <YStack flex={1}>
          <AppText size="caption" tone="muted">
            Prévia da fatura
          </AppText>
          <AppText size="body" tone={hasCycle ? "default" : "muted"} fontWeight="$6">
            {hasCycle
              ? `Cai na fatura de ${preview.billLabel}`
              : "Defina o cartão para ver a fatura"}
          </AppText>
        </YStack>
      </XStack>
      {hasCycle ? (
        <YStack gap="$2">
          <AppKeyValueRow label="Fecha" value={formatDateOrDash(preview.closingDate)} />
          <AppKeyValueRow label="Vence" value={formatDateOrDash(preview.dueDate)} />
          <AppKeyValueRow
            label="Valor"
            value={<AppMoneyText fontSize="$4">{formatCurrency(amount)}</AppMoneyText>}
          />
          {preview.limitAmount !== null ? (
            <AppKeyValueRow
              label="Limite do cartão"
              value={
                <AppMoneyText fontSize="$4">
                  {formatCurrency(preview.limitAmount)}
                </AppMoneyText>
              }
            />
          ) : null}
        </YStack>
      ) : (
        <AppKeyValueRow
          label="Valor da compra"
          value={<AppMoneyText fontSize="$4">{formatCurrency(amount)}</AppMoneyText>}
        />
      )}
    </AppSurfaceCard>
  );
};

export const FaturaPreview = memo(FaturaPreviewComponent);
