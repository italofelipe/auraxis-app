import type { ReactElement } from "react";
import { ScrollView } from "react-native";

import { Paragraph, XStack, YStack } from "tamagui";

import type {
  CreditCard,
  CreditCardBrand,
} from "@/features/credit-cards/contracts";
import { useCreditCardUtilizationQuery } from "@/features/credit-cards/hooks/use-credit-card-utilization-query";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

const utilizationFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

const brandLabels: Record<CreditCardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  hipercard: "Hipercard",
  amex: "Amex",
  other: "Outra",
};

export type CreditCardUtilizationTone = "success" | "warning" | "danger" | "muted";

const utilizationColorByTone: Record<CreditCardUtilizationTone, string> = {
  success: "$success",
  warning: "$warning",
  danger: "$danger",
  muted: "$borderColor",
};

const hasBillCycleConfig = (creditCard: CreditCard): boolean => {
  return creditCard.closingDay !== null && creditCard.dueDay !== null;
};

export const clampCreditCardUtilizationPercent = (
  value: number | null,
): number | null => {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }
  return Math.min(100, Math.max(0, value));
};

export const resolveCreditCardUtilizationTone = (
  value: number | null,
): CreditCardUtilizationTone => {
  if (value === null || !Number.isFinite(value)) {
    return "muted";
  }
  if (value >= 80) {
    return "danger";
  }
  if (value >= 60) {
    return "warning";
  }
  return "success";
};

export const formatCreditCardValidity = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-\d{2}$/u.exec(value);
  if (match === null) {
    return value;
  }
  return `${match[2]}/${match[1]}`;
};

const formatUtilizationPercent = (value: number): string => {
  return `${utilizationFormatter.format(value)}%`;
};

interface CreditCardUtilizationBarProps {
  readonly utilizationPct: number | null;
}

function CreditCardUtilizationBar({
  utilizationPct,
}: CreditCardUtilizationBarProps): ReactElement {
  const clamped = clampCreditCardUtilizationPercent(utilizationPct) ?? 0;
  const tone = resolveCreditCardUtilizationTone(utilizationPct);

  return (
    <YStack
      height={8}
      width="100%"
      backgroundColor="$surfaceRaised"
      borderRadius="$4"
      overflow="hidden"
    >
      <YStack
        height={8}
        width={`${clamped}%`}
        backgroundColor={utilizationColorByTone[tone]}
        borderRadius="$4"
      />
    </YStack>
  );
}

interface UtilizationLabelInput {
  readonly creditCard: CreditCard;
  readonly data: ReturnType<typeof useCreditCardUtilizationQuery>["data"];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

const buildUtilizationLabel = ({
  creditCard,
  data,
  isLoading,
  isError,
}: UtilizationLabelInput): string => {
  if (!hasBillCycleConfig(creditCard)) {
    return "Configure fechamento e vencimento para calcular a fatura.";
  }
  if (isLoading) {
    return "Calculando utilizacao...";
  }
  if (isError) {
    return "Utilizacao indisponivel.";
  }
  if (data === undefined) {
    return creditCard.limitAmount !== null
      ? `Limite: ${formatCurrency(creditCard.limitAmount)}`
      : "Limite nao configurado.";
  }
  if (data.utilizationPct === null || data.limitAmount === null) {
    return `Fatura atual: ${formatCurrency(data.committedAmount)}`;
  }
  return `Utilizado: ${formatUtilizationPercent(data.utilizationPct)} · ${formatCurrency(
    data.committedAmount,
  )} / ${formatCurrency(data.limitAmount)}`;
};

function CreditCardHeader({
  creditCard,
}: {
  readonly creditCard: CreditCard;
}): ReactElement {
  return (
    <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
      <YStack flex={1} gap="$1">
        <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
          {creditCard.name}
        </Paragraph>
        {creditCard.bank ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {creditCard.bank}
          </Paragraph>
        ) : null}
      </YStack>
      {creditCard.limitAmount !== null ? (
        <Paragraph color="$color" fontFamily="$heading" fontSize="$5">
          {formatCurrency(creditCard.limitAmount)}
        </Paragraph>
      ) : null}
    </XStack>
  );
}

function CreditCardBadges({
  creditCard,
  validity,
}: {
  readonly creditCard: CreditCard;
  readonly validity: string | null;
}): ReactElement {
  return (
    <XStack gap="$2" flexWrap="wrap">
      {creditCard.brand ? (
        <AppBadge tone="primary">{brandLabels[creditCard.brand]}</AppBadge>
      ) : null}
      {creditCard.lastFourDigits ? (
        <AppBadge>Final {creditCard.lastFourDigits}</AppBadge>
      ) : null}
      {validity ? <AppBadge>Validade {validity}</AppBadge> : null}
    </XStack>
  );
}

function CreditCardBenefits({
  benefits,
}: {
  readonly benefits: readonly string[];
}): ReactElement | null {
  if (benefits.length === 0) {
    return null;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <XStack gap="$2" paddingRight="$2">
        {benefits.map((benefit) => (
          <AppBadge key={benefit}>{benefit}</AppBadge>
        ))}
      </XStack>
    </ScrollView>
  );
}

interface CreditCardActionsProps {
  readonly canViewBill: boolean;
  readonly isDeleting: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onViewBill: () => void;
}

function CreditCardActions({
  canViewBill,
  isDeleting,
  onEdit,
  onDelete,
  onViewBill,
}: CreditCardActionsProps): ReactElement {
  return (
    <XStack gap="$2" flexWrap="wrap">
      <AppButton tone="primary" onPress={onViewBill} disabled={!canViewBill}>
        Ver fatura
      </AppButton>
      <AppButton tone="secondary" onPress={onEdit} disabled={isDeleting}>
        Editar
      </AppButton>
      <AppButton tone="secondary" onPress={onDelete} disabled={isDeleting}>
        {isDeleting ? "Excluindo..." : "Excluir"}
      </AppButton>
    </XStack>
  );
}

export interface CreditCardCardProps {
  readonly creditCard: CreditCard;
  readonly isDeleting: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onViewBill: () => void;
}

export function CreditCardCard({
  creditCard,
  isDeleting,
  onEdit,
  onDelete,
  onViewBill,
}: CreditCardCardProps): ReactElement {
  const canViewBill = hasBillCycleConfig(creditCard);
  const utilizationQuery = useCreditCardUtilizationQuery(creditCard.id, {
    enabled: canViewBill,
  });
  const utilizationPct = utilizationQuery.data?.utilizationPct ?? null;
  const validity = formatCreditCardValidity(creditCard.validityDate);
  const utilizationLabel = buildUtilizationLabel({
    creditCard,
    data: utilizationQuery.data,
    isLoading: utilizationQuery.isLoading,
    isError: utilizationQuery.isError,
  });

  return (
    <AppSurfaceCard testID={`credit-card-card-${creditCard.id}`}>
      <YStack gap="$3">
        <CreditCardHeader creditCard={creditCard} />
        <CreditCardBadges creditCard={creditCard} validity={validity} />

        <YStack gap="$2">
          <CreditCardUtilizationBar utilizationPct={utilizationPct} />
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {utilizationLabel}
          </Paragraph>
        </YStack>

        <CreditCardBenefits benefits={creditCard.benefits} />

        {creditCard.description ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {creditCard.description}
          </Paragraph>
        ) : null}

        <CreditCardActions
          canViewBill={canViewBill}
          isDeleting={isDeleting}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewBill={onViewBill}
        />
      </YStack>
    </AppSurfaceCard>
  );
}
