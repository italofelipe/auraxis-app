import type { ReactElement } from "react";

import { XStack, YStack, useTheme } from "tamagui";

import type { CreditCardLimitBlock } from "@/features/credit-cards/model/credit-card-detail";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppText } from "@/shared/components/app-text";
import { LimitRing } from "@/shared/components/charts";
import { formatCurrency } from "@/shared/utils/formatters";

/** Props do bloco de limite (anel + linhas). */
export interface CardLimitBlockProps {
  /** Bloco de limite derivado pelo controller. */
  readonly limit: CreditCardLimitBlock;
  readonly testID?: string;
}

const dash = (value: number | null): string =>
  value === null ? "—" : formatCurrency(value);

interface LimitRowProps {
  readonly label: string;
  readonly value: string;
  readonly valueColor?: string;
  readonly divider: boolean;
}

function LimitRow({
  label,
  value,
  valueColor,
  divider,
}: LimitRowProps): ReactElement {
  return (
    <XStack
      alignItems="baseline"
      justifyContent="space-between"
      gap="$2"
      paddingBottom={divider ? "$2" : undefined}
      borderBottomWidth={divider ? 1 : 0}
      borderColor="$borderColor"
    >
      <AppText size="bodySm" tone="muted">
        {label}
      </AppText>
      <AppMoneyText fontSize="$4" fontWeight="$6" color={valueColor}>
        {value}
      </AppMoneyText>
    </XStack>
  );
}

/**
 * Bloco "Limite" do detalhe do cartão: um {@link LimitRing} ("X% usado") à
 * esquerda e três linhas à direita (Limite total, Disponível em verde, Fatura
 * atual). A cor do anel vem do tom resolvido pelo controller (perigo acima do
 * limiar). Apresentacional.
 *
 * @param props Bloco de limite.
 * @returns Card com o anel e as linhas de limite.
 */
export function CardLimitBlock({
  limit,
  testID,
}: CardLimitBlockProps): ReactElement {
  const theme = useTheme();
  const ringColor =
    limit.tone === "danger"
      ? theme.danger?.val ?? "#000000"
      : theme.primary?.val ?? "#000000";
  const successColor = theme.success?.val ?? theme.color?.val ?? "#000000";

  return (
    <AppSurfaceCard testID={testID ?? "card-limit-block"}>
      <XStack alignItems="center" gap="$4">
        <LimitRing pct={limit.usedPct} color={ringColor} centerLabel="usado" />
        <YStack flex={1} gap="$3">
          <LimitRow
            label="Limite total"
            value={dash(limit.limitAmount)}
            divider
          />
          <LimitRow
            label="Disponível"
            value={dash(limit.availableAmount)}
            valueColor={successColor}
            divider
          />
          <LimitRow
            label="Fatura atual"
            value={formatCurrency(limit.currentBillTotal)}
            divider={false}
          />
        </YStack>
      </XStack>
    </AppSurfaceCard>
  );
}
