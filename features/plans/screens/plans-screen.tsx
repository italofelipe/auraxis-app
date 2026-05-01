import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import {
  usePlansScreenController,
  type PlansScreenController,
} from "@/features/plans/hooks/use-plans-screen-controller";
import type {
  PlansBillingCycle,
  PlansFeatureRow,
  PlansTierView,
} from "@/features/plans/contracts";
import { AppAsyncState } from "@/shared/components/app-async-state";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";
import { formatCurrency } from "@/shared/utils/formatters";

const centsToBrl = (cents: number): string => formatCurrency(cents / 100);

interface HeaderProps {
  readonly title: string;
  readonly subtitle: string;
  readonly onBack: () => void;
}

function Header({ title, subtitle, onBack }: HeaderProps): ReactElement {
  return (
    <XStack justifyContent="space-between" alignItems="flex-start">
      <YStack gap="$1" flex={1}>
        <Paragraph color="$color" fontFamily="$heading" fontSize="$7">
          {title}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {subtitle}
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

interface BillingCycleToggleProps {
  readonly cycle: PlansBillingCycle;
  readonly onToggle: () => void;
  readonly annualDiscountPercent: number;
}

function BillingCycleToggle(props: BillingCycleToggleProps): ReactElement {
  const { t } = useT();
  const { cycle, onToggle, annualDiscountPercent } = props;
  const annualLabel = annualDiscountPercent > 0
    ? `${t("plans.cycle.annual")} (-${annualDiscountPercent}%)`
    : t("plans.cycle.annual");
  return (
    <XStack gap="$2" justifyContent="center">
      <AppButton
        tone={cycle === "monthly" ? "primary" : "secondary"}
        onPress={cycle === "monthly" ? () => undefined : onToggle}
      >
        {t("plans.cycle.monthly")}
      </AppButton>
      <AppButton
        tone={cycle === "annual" ? "primary" : "secondary"}
        onPress={cycle === "annual" ? () => undefined : onToggle}
      >
        {annualLabel}
      </AppButton>
    </XStack>
  );
}

interface TierCardProps {
  readonly tier: PlansTierView;
  readonly cycle: PlansBillingCycle;
  readonly featureRows: readonly PlansFeatureRow[];
  readonly onSelect: () => void;
}

function priceForCycle(tier: PlansTierView, cycle: PlansBillingCycle): number {
  return cycle === "annual"
    ? tier.priceAnnualCents / 12
    : tier.priceMonthlyCents;
}

function TierCard({ tier, cycle, featureRows, onSelect }: TierCardProps): ReactElement {
  const { t } = useT();
  const theme = useTheme();
  const monthlyEquivalent = priceForCycle(tier, cycle);
  const isFree = tier.tier === "free";
  const ctaLabel = isFree ? t("plans.cta.free") : t("plans.cta.premium");
  const description = isFree
    ? t("plans.tier.free.description")
    : t("plans.tier.premium.description");
  return (
    <AppSurfaceCard
      title={tier.displayName}
      description={description}
      testID={`plans-tier-${tier.tier}`}
    >
      <YStack gap="$3">
        <YStack gap="$1">
          <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
            {centsToBrl(monthlyEquivalent)}
          </Paragraph>
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            {cycle === "annual"
              ? t("plans.priceCaption.annualBilledMonthly")
              : t("plans.priceCaption.monthly")}
          </Paragraph>
          {cycle === "annual" && tier.priceAnnualCents > 0 ? (
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              {t("plans.priceCaption.totalAnnual", {
                total: centsToBrl(tier.priceAnnualCents),
              })}
            </Paragraph>
          ) : null}
        </YStack>
        <YStack gap="$2">
          {featureRows.map((row) => {
            const included = isFree ? row.free : row.premium;
            return (
              <XStack key={row.key} gap="$2" alignItems="center">
                <MaterialCommunityIcons
                  name={included ? "check" : "close"}
                  size={18}
                  color={
                    included
                      ? theme.success?.val ?? "#1f9d55"
                      : theme.muted?.val ?? "#8a8a8a"
                  }
                />
                <Paragraph
                  color={included ? "$color" : "$muted"}
                  fontFamily="$body"
                  fontSize="$3"
                  flex={1}
                >
                  {t(`plans.feature.${row.key}`)}
                </Paragraph>
              </XStack>
            );
          })}
        </YStack>
        <AppButton hapticTone="medium" onPress={onSelect}>
          {ctaLabel}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

interface PlansBodyProps {
  readonly controller: PlansScreenController;
}

function PlansBody({ controller }: PlansBodyProps): ReactElement {
  const { t } = useT();
  return (
    <YStack gap="$3">
      <BillingCycleToggle
        cycle={controller.billingCycle}
        onToggle={controller.toggleCycle}
        annualDiscountPercent={controller.annualDiscountPercent}
      />
      {controller.tiers.length === 0 ? (
        <AppErrorNotice
          error={null}
          fallbackTitle={t("plans.empty.title")}
          fallbackDescription={t("plans.empty.description")}
        />
      ) : (
        controller.tiers.map((tier) => (
          <TierCard
            key={tier.slug}
            tier={tier}
            cycle={controller.billingCycle}
            featureRows={controller.featureRows}
            onSelect={
              tier.tier === "free"
                ? controller.handleSelectFreeTier
                : controller.handleSelectPremiumTier
            }
          />
        ))
      )}
    </YStack>
  );
}

/**
 * Public plans landing — mirrors auraxis-web /plans.
 *
 * Lists the canonical Free + Premium tiers with a monthly/annual cycle
 * toggle and a feature comparison. CTAs route to the registration flow
 * for anonymous users and to the existing subscription screen for
 * authenticated ones (the subscription screen already owns the canonical
 * checkout flow via `useCheckoutFlow`).
 *
 * @returns The screen tree.
 */
export function PlansScreen(): ReactElement {
  const { t } = useT();
  const controller = usePlansScreenController();
  const router = useRouter();
  const handleBack = (): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(appRoutes.public.login);
  };

  if (controller.isLoading) {
    return (
      <AppScreen scrollable testID="plans-screen">
        <AppAsyncState
          state={{
            kind: "loading",
            title: t("plans.loading.title"),
            description: t("plans.loading.description"),
            presentation: "notice",
            skeletonLines: 3,
          }}
        />
      </AppScreen>
    );
  }

  if (controller.isError) {
    return (
      <AppScreen scrollable testID="plans-screen">
        <Header
          title={t("plans.title")}
          subtitle={t("plans.subtitle")}
          onBack={handleBack}
        />
        <AppErrorNotice
          error={controller.error}
          fallbackTitle={t("plans.error.title")}
          fallbackDescription={t("plans.error.description")}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scrollable testID="plans-screen">
      <Header
        title={t("plans.title")}
        subtitle={t("plans.subtitle")}
        onBack={handleBack}
      />
      <PlansBody controller={controller} />
    </AppScreen>
  );
}
