import { useCallback, type ReactElement } from "react";

import { useRouter } from "expo-router";
import { Paragraph, XStack, YStack } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import { useWalletValuationQuery } from "@/features/wallet/hooks/use-wallet-query";
import { AppButton } from "@/shared/components/app-button";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { MetricGridSkeleton } from "@/shared/skeletons";
import { useT } from "@/shared/i18n";
import { formatCurrency } from "@/shared/utils/formatters";

/**
 * Embedded wallet summary on the dashboard. Shows total value and
 * total profit/loss so the user has the headline number without
 * navigating to /carteira.
 */
export function DashboardWalletSummaryCard(): ReactElement {
  const { t } = useT();
  const router = useRouter();
  const query = useWalletValuationQuery();

  const handleViewAll = useCallback((): void => {
    router.push(appRoutes.private.wallet);
  }, [router]);

  return (
    <AppSurfaceCard title={t("dashboard.embeddedSummaries.wallet.title")}>
      <YStack gap="$3">
        <AppQueryState
          query={query}
          options={{
            loading: {
              title: t("dashboard.embeddedSummaries.wallet.title"),
            },
            loadingPresentation: "skeleton",
            empty: {
              title: t("dashboard.embeddedSummaries.wallet.empty"),
            },
            error: {
              fallbackTitle: t("dashboard.embeddedSummaries.wallet.title"),
            },
            isEmpty: (data) => data.totalCurrentValue === 0 && data.totalInvestedAmount === 0,
          }}
          loadingComponent={<MetricGridSkeleton tiles={2} />}
        >
          {(summary) => {
            const profitColor =
              summary.totalProfitLossPercent >= 0 ? "$success" : "$danger";
            return (
              <XStack gap="$3" flexWrap="wrap">
                <YStack gap="$1" flex={1}>
                  <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
                    Patrimônio
                  </Paragraph>
                  <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
                    {formatCurrency(summary.totalCurrentValue)}
                  </Paragraph>
                </YStack>
                <YStack gap="$1" flex={1}>
                  <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
                    Lucro / Prejuízo
                  </Paragraph>
                  <Paragraph color={profitColor} fontFamily="$heading" fontSize="$6">
                    {summary.totalProfitLossPercent.toFixed(2)}%
                  </Paragraph>
                </YStack>
              </XStack>
            );
          }}
        </AppQueryState>
        <AppButton tone="secondary" onPress={handleViewAll}>
          {t("dashboard.embeddedSummaries.wallet.viewAll")}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}
