import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { PlanPresentation } from "@/features/subscription/services/subscription-plan-comparator";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const BENEFITS_BY_TIER: Record<string, readonly string[]> = {
  free: [
    "Carteira basica e dashboard mensal",
    "Metas com acompanhamento manual",
    "1 simulador essencial",
  ],
  premium: [
    "Simuladores premium com auto-fill",
    "Compartilhamento de despesas",
    "Alertas inteligentes e projecoes",
    "Exportar relatorios em PDF",
  ],
};

const resolveBenefits = (tier: string): readonly string[] => {
  return BENEFITS_BY_TIER[tier] ?? [];
};

export interface BillingPlanCardProps {
  readonly presentation: PlanPresentation;
  readonly onPress: () => void;
  readonly testID?: string;
}

/**
 * View-only card for a billing plan presentation.
 *
 * @param props - Comparator output, action handler and optional testID.
 * @returns Card showing price, benefits and a state-driven CTA.
 */
export function BillingPlanCard({
  presentation,
  onPress,
  testID,
}: BillingPlanCardProps): ReactElement {
  const benefits = resolveBenefits(presentation.plan.tier);

  return (
    <AppSurfaceCard
      title={presentation.plan.displayName}
      description={presentation.plan.description}
      testID={testID}
    >
      <YStack gap="$3">
        <PriceBlock presentation={presentation} />
        {benefits.length > 0 ? <BenefitsList benefits={benefits} /> : null}
        <AppButton
          onPress={onPress}
          disabled={presentation.ctaDisabled}
          testID={testID ? `${testID}-cta` : undefined}
        >
          {presentation.ctaLabel}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function PriceBlock({
  presentation,
}: {
  readonly presentation: PlanPresentation;
}): ReactElement {
  return (
    <YStack gap="$2">
      <XStack gap="$2" alignItems="baseline" flexWrap="wrap">
        <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
          {presentation.priceLabel}
        </Paragraph>
        {presentation.intervalLabel ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {presentation.intervalLabel}
          </Paragraph>
        ) : null}
        {presentation.highlighted ? (
          <AppBadge tone="primary">Recomendado</AppBadge>
        ) : null}
      </XStack>
      {presentation.savingsLabel ? (
        <Paragraph color="$success" fontFamily="$body" fontSize="$3">
          {presentation.savingsLabel}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

function BenefitsList({
  benefits,
}: {
  readonly benefits: readonly string[];
}): ReactElement {
  return (
    <YStack gap="$1">
      {benefits.map((label) => (
        <Paragraph key={label} color="$color" fontFamily="$body" fontSize="$3">
          · {label}
        </Paragraph>
      ))}
    </YStack>
  );
}
