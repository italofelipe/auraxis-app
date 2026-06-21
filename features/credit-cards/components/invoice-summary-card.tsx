import type { ReactElement } from "react";

import { XStack, YStack, useTheme } from "tamagui";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { BillStatusVM } from "@/features/credit-cards/model/credit-card-statement";
import { AppBadge } from "@/shared/components/app-badge";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppText } from "@/shared/components/app-text";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { iconSizes } from "@/shared/theme";
import { formatCurrency } from "@/shared/utils/formatters";

/** Props do resumo da fatura (consolidada ou de um cartão). */
export interface InvoiceSummaryCardProps {
  /** Sobrescrita do eyebrow ("Fatura consolidada" ou nome do cartão). */
  readonly eyebrow: string;
  /** Rótulo extenso do mês ("junho de 2026"). */
  readonly monthLabel: string;
  /** Total da fatura. */
  readonly total: number;
  /** Status (Aberta/Fechada) — opcional no consolidado. */
  readonly status: BillStatusVM | null;
  /** Data de vencimento (`YYYY-MM-DD`) — opcional. */
  readonly dueDate: string | null;
  /** Quantidade de lançamentos. */
  readonly itemCount: number;
  /** Abre o detalhe da fatura. */
  readonly onOpenInvoice: () => void;
  readonly testID?: string;
}

const dayFromDate = (date: string | null): string | null => {
  if (date === null) {
    return null;
  }
  const match = /^\d{4}-\d{2}-(\d{2})$/u.exec(date);
  return match ? match[1] : null;
};

const statusTone = (status: BillStatusVM): "primary" | "default" =>
  status.tone === "open" ? "primary" : "default";

/**
 * Card de resumo da fatura: eyebrow, "Fatura de {mês}", total em mono grande,
 * pílula de status e linha "vence dia X · N lançamentos" com chevron. O card
 * inteiro é tocável e abre o detalhe da fatura.
 *
 * @param props Eyebrow, mês, total, status, vencimento, contagem e handler.
 * @returns Card de resumo pressionável.
 */
export function InvoiceSummaryCard({
  eyebrow,
  monthLabel,
  total,
  status,
  dueDate,
  itemCount,
  onOpenInvoice,
  testID,
}: InvoiceSummaryCardProps): ReactElement {
  const theme = useTheme();
  const chevronColor = theme.muted?.val ?? theme.color?.val ?? "#000000";
  const dueDay = dayFromDate(dueDate);

  return (
    <AppSurfaceCard
      variant="interactive"
      onPress={onOpenInvoice}
      testID={testID ?? "invoice-summary-card"}
    >
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <AppText size="caption" tone="muted" textTransform="uppercase">
            {eyebrow}
          </AppText>
          <XStack alignItems="center" gap="$2">
            {status ? (
              <AppBadge tone={statusTone(status)}>{status.label}</AppBadge>
            ) : null}
            <MaterialCommunityIcons
              name="chevron-right"
              size={iconSizes.md}
              color={chevronColor}
            />
          </XStack>
        </XStack>

        <AppText size="bodyLg" fontWeight="$7">
          {`Fatura de ${monthLabel}`}
        </AppText>

        <AppMoneyText fontSize="$8" fontWeight="$6">
          {formatCurrency(total)}
        </AppMoneyText>

        <AppText size="bodySm" tone="muted">
          {dueDay
            ? `vence dia ${dueDay} · ${itemCount} lançamentos`
            : `${itemCount} lançamentos`}
        </AppText>
      </YStack>
    </AppSurfaceCard>
  );
}
