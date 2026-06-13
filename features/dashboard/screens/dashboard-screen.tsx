import {
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
} from "react";
import type { LayoutChangeEvent } from "react-native";

import { useLocalSearchParams } from "expo-router";
import { Paragraph, YStack } from "tamagui";

import { DashboardComparisonCard } from "@/features/dashboard/components/dashboard-comparison-card";
import { DashboardCountsCard } from "@/features/dashboard/components/dashboard-counts-card";
import { DashboardGoalsSummaryCard } from "@/features/dashboard/components/dashboard-goals-summary-card";
import { DashboardQuickAddFab } from "@/features/dashboard/components/dashboard-quick-add-fab";
import { DashboardSurvivalIndexCard } from "@/features/dashboard/components/dashboard-survival-index-card";
import { DashboardTopCategoriesCard } from "@/features/dashboard/components/dashboard-top-categories-card";
import { DashboardTrendsChartCard } from "@/features/dashboard/components/dashboard-trends-chart-card";
import { DashboardUpcomingDueCard } from "@/features/dashboard/components/dashboard-upcoming-due-card";
import { DashboardWalletSummaryCard } from "@/features/dashboard/components/dashboard-wallet-summary-card";
import { SpendingPatternsCard } from "@/features/spending-patterns/components/spending-patterns-card";
import { WeeklySnapshotCard } from "@/features/weekly-snapshot/components/weekly-snapshot-card";
import type {
  DashboardOverview,
  DashboardTrendPoint,
} from "@/features/dashboard/contracts";
import {
  useDashboardScreenController,
  type DashboardScreenController,
} from "@/features/dashboard/hooks/use-dashboard-screen-controller";
import {
  WeeklyInsightCard,
  type WeeklyInsightAiConsent,
} from "@/features/insights/components/weekly-insight-card";
import { useAiInsightConsent } from "@/features/insights/hooks/use-ai-insight-consent";
import {
  AI_INSIGHT_TRANSPARENCY_FEATURE_FLAG_KEY,
  WEEKLY_INSIGHT_DASHBOARD_FOCUS_TARGET,
  WEEKLY_INSIGHT_FEATURE_FLAG_KEY,
} from "@/features/insights/weekly-insight-config";
import type { UserProfileRecord } from "@/features/user-profile/contracts";
import { useUserProfileQuery } from "@/features/user-profile/hooks/use-user-profile-query";
import type {
  SavingsRateAssessment,
  SavingsRateLevel,
} from "@/features/dashboard/services/savings-rate-calculator";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppPeriodChips } from "@/shared/components/app-period-chips";
import { AppQueryState } from "@/shared/components/app-query-state";
import { DashboardSkeleton, MetricGridSkeleton } from "@/shared/skeletons";
import {
  AppScreen,
  type AppScreenScrollHandle,
} from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { formatCurrency } from "@/shared/utils/formatters";

const SAVINGS_TONE: Record<SavingsRateLevel, "$danger" | "$muted" | "$success"> = {
  negative: "$danger",
  low: "$muted",
  healthy: "$success",
  excellent: "$success",
};

const formatSavingsRate = (rate: number): string => {
  return `${(rate * 100).toFixed(1)}%`;
};

const WEEKLY_INSIGHT_SCROLL_PADDING = 16;

const normalizeFocusParam = (
  value: string | readonly string[] | undefined,
): string | null => {
  if (typeof value === "string") {
    return value;
  }

  return value?.[0] ?? null;
};

/**
 * Canonical dashboard screen composition for the mobile app.
 *
 * @returns Greeting, balance, savings rate and monthly snapshot panels.
 */

export function DashboardScreen(): ReactElement {
  const weeklyInsightFeatureEnabled = isFeatureEnabled(WEEKLY_INSIGHT_FEATURE_FLAG_KEY);
  const aiTransparencyEnabled = isFeatureEnabled(AI_INSIGHT_TRANSPARENCY_FEATURE_FLAG_KEY);
  const aiInsightConsent = useAiInsightConsent({
    enabled: weeklyInsightFeatureEnabled && aiTransparencyEnabled,
  });
  const weeklyInsightEnabled =
    weeklyInsightFeatureEnabled && (!aiTransparencyEnabled || aiInsightConsent.hasConsent);
  const controller = useDashboardScreenController({ weeklyInsightEnabled });
  const overview = controller.overviewQuery.data;
  const trendsSeries = controller.trendsQuery.data?.series ?? [];
  const profile = useUserProfileQuery().data ?? null;
  const params = useLocalSearchParams<{ focus?: string | string[] }>();
  const scrollViewRef = useRef<AppScreenScrollHandle>(null);
  const weeklyInsightOffsetYRef = useRef<number | null>(null);
  const shouldFocusWeeklyInsight =
    weeklyInsightFeatureEnabled &&
    normalizeFocusParam(params.focus) === WEEKLY_INSIGHT_DASHBOARD_FOCUS_TARGET;

  const scrollToWeeklyInsight = useCallback((): void => {
    const offsetY = weeklyInsightOffsetYRef.current;
    if (offsetY === null) {
      return;
    }

    scrollViewRef.current?.scrollTo({
      y: Math.max(offsetY - WEEKLY_INSIGHT_SCROLL_PADDING, 0),
      animated: true,
    });
  }, []);

  const handleWeeklyInsightLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      weeklyInsightOffsetYRef.current = event.nativeEvent.layout.y;
      if (shouldFocusWeeklyInsight) {
        scrollToWeeklyInsight();
      }
    },
    [scrollToWeeklyInsight, shouldFocusWeeklyInsight],
  );

  useEffect(() => {
    if (shouldFocusWeeklyInsight) {
      scrollToWeeklyInsight();
    }
  }, [scrollToWeeklyInsight, shouldFocusWeeklyInsight]);

  return (
    <AppScreen scrollViewRef={scrollViewRef}>
      <BalanceCard controller={controller} />
      <WeeklyInsightSection
        controller={controller}
        enabled={weeklyInsightFeatureEnabled}
        aiConsent={{
          enabled: aiTransparencyEnabled,
          isHydrated: aiInsightConsent.isHydrated,
          hasConsent: aiInsightConsent.hasConsent,
          onGrantConsent: aiInsightConsent.grantConsent,
        }}
        onLayout={handleWeeklyInsightLayout}
      />
      <DashboardComparisonCards controller={controller} />
      <WeeklySnapshotCard />
      <SpendingPatternsCard />
      <DashboardUpcomingDueCard />
      <DashboardGoalsSummaryCard />
      <DashboardWalletSummaryCard />
      {controller.savingsRate ? (
        <SavingsRateCard assessment={controller.savingsRate} />
      ) : null}
      <MonthSnapshotCard controller={controller} />
      <DashboardOverviewCards
        overview={overview}
        profile={profile}
        trendsSeries={trendsSeries}
      />
      <DashboardQuickAddFab />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: DashboardScreenController;
}

interface WeeklyInsightSectionProps extends ControllerProps {
  readonly enabled: boolean;
  readonly aiConsent: WeeklyInsightAiConsent;
  readonly onLayout: (event: LayoutChangeEvent) => void;
}

type ComparisonMetrics = NonNullable<
  DashboardScreenController["comparison"]["delta"]
>;

const readComparisonMetric = (
  metrics: DashboardScreenController["comparison"]["delta"],
  key: keyof ComparisonMetrics,
): number | null => metrics?.[key] ?? null;

function WeeklyInsightSection({
  controller,
  enabled,
  aiConsent,
  onLayout,
}: WeeklyInsightSectionProps): ReactElement | null {
  if (!enabled) {
    return null;
  }

  return (
    <YStack onLayout={onLayout} testID="dashboard-weekly-insight-anchor">
      <DashboardWeeklyInsightCard controller={controller} aiConsent={aiConsent} />
    </YStack>
  );
}

function DashboardComparisonCards({
  controller,
}: ControllerProps): ReactElement | null {
  if (!controller.monthSnapshot) {
    return null;
  }

  return (
    <>
      <DashboardComparisonCard
        title="Saldo"
        value={controller.monthSnapshot.balance}
        delta={readComparisonMetric(controller.comparison.delta, "balance")}
        percent={readComparisonMetric(controller.comparison.percent, "balance")}
        positiveIsGood
        testID="dashboard-comparison-balance"
      />
      <DashboardComparisonCard
        title="Receitas"
        value={controller.monthSnapshot.incomes}
        delta={readComparisonMetric(controller.comparison.delta, "income")}
        percent={readComparisonMetric(controller.comparison.percent, "income")}
        positiveIsGood
        testID="dashboard-comparison-income"
      />
      <DashboardComparisonCard
        title="Despesas"
        value={controller.monthSnapshot.expenses}
        delta={readComparisonMetric(controller.comparison.delta, "expenses")}
        percent={readComparisonMetric(controller.comparison.percent, "expenses")}
        positiveIsGood={false}
        testID="dashboard-comparison-expenses"
      />
    </>
  );
}

interface DashboardOverviewCardsProps {
  readonly overview: DashboardOverview | undefined;
  readonly profile: UserProfileRecord | null;
  readonly trendsSeries: readonly DashboardTrendPoint[];
}

function DashboardOverviewCards({
  overview,
  profile,
  trendsSeries,
}: DashboardOverviewCardsProps): ReactElement {
  return (
    <>
      {profile ? (
        <DashboardSurvivalIndexCard
          netWorth={profile.netWorth}
          monthlyExpenses={profile.monthlyExpenses}
        />
      ) : null}
      {overview ? <DashboardCountsCard counts={overview.counts} /> : null}
      {trendsSeries.length > 0 ? (
        <DashboardTrendsChartCard series={trendsSeries} />
      ) : null}
      {overview ? (
        <DashboardTopCategoriesCard
          title="Top despesas"
          description="Categorias que mais consumiram do periodo."
          categories={overview.topCategories.expense}
          tone="expense"
        />
      ) : null}
      {overview ? (
        <DashboardTopCategoriesCard
          title="Top receitas"
          description="Categorias que mais entraram no periodo."
          categories={overview.topCategories.income}
          tone="income"
        />
      ) : null}
    </>
  );
}

function BalanceCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      glow
      accentBar
      title={controller.greetingName ? `Ola, ${controller.greetingName}` : "Ola"}
      description="Aqui esta o resumo das suas financas."
    >
      <AppQueryState
        query={controller.overviewQuery}
        options={{
          loading: {
            title: "Carregando dashboard",
            description: "Buscando o consolidado financeiro mais recente.",
          },
          empty: {
            title: "Nenhum consolidado encontrado",
            description:
              "Os totais vao aparecer aqui assim que houver movimentacoes.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar o dashboard",
            fallbackDescription: "Tente novamente em alguns instantes.",
          },
          loadingPresentation: "skeleton",
        }}
        loadingComponent={<DashboardSkeleton />}
      >
        {() => (
          <YStack gap="$1">
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              Saldo geral
            </Paragraph>
            <AppMoneyText fontSize="$8">
              {formatCurrency(controller.currentBalance)}
            </AppMoneyText>
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface DashboardWeeklyInsightCardProps extends ControllerProps {
  readonly aiConsent: WeeklyInsightAiConsent;
}

function DashboardWeeklyInsightCard({
  controller,
  aiConsent,
}: DashboardWeeklyInsightCardProps): ReactElement {
  return (
    <WeeklyInsightCard
      insight={controller.weeklyInsight.insight}
      isLoading={controller.weeklyInsight.isLoading}
      isNew={controller.weeklyInsight.isNew}
      onMarkAsRead={controller.weeklyInsight.markAsRead}
      aiConsent={aiConsent}
    />
  );
}

interface SavingsRateCardProps {
  readonly assessment: SavingsRateAssessment;
}

function SavingsRateCard({ assessment }: SavingsRateCardProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Taxa de poupanca"
      description="Quanto voce manteve do que recebeu no periodo."
    >
      <YStack gap="$2">
        <Paragraph
          color={SAVINGS_TONE[assessment.level]}
          fontFamily="$heading"
          fontSize="$8"
        >
          {formatSavingsRate(assessment.rate)}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {assessment.summary}
        </Paragraph>
      </YStack>
    </AppSurfaceCard>
  );
}

function MonthSnapshotCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Resumo por mes"
      description="Receitas, despesas e saldo do periodo selecionado."
    >
      <YStack gap="$3">
        <AppPeriodChips
          options={controller.monthOptions}
          value={controller.selectedMonth}
          onChange={controller.setSelectedMonth}
          testID="dashboard-month-chips"
        />

        <AppQueryState
          query={controller.trendsQuery}
          options={{
            loading: {
              title: "Carregando tendencias",
              description: "Preparando a leitura mensal do seu fluxo.",
            },
            empty: {
              title: "Sem movimentos no periodo",
              description:
                "Os totais mensais vao aparecer aqui assim que houver dados.",
            },
            error: {
              fallbackTitle: "Nao foi possivel carregar as tendencias",
              fallbackDescription: "Tente novamente em instantes.",
            },
            isEmpty: (data) =>
              data.series.length === 0 || controller.monthSnapshot === null,
            loadingPresentation: "skeleton",
          }}
          loadingComponent={<MetricGridSkeleton tiles={3} />}
        >
          {() => <MonthSnapshotValues controller={controller} />}
        </AppQueryState>
      </YStack>
    </AppSurfaceCard>
  );
}

function MonthSnapshotValues({ controller }: ControllerProps): ReactElement {
  return (
    <YStack gap="$2">
      <Paragraph color="$color" fontFamily="$body" fontSize="$4">
        Receitas: {formatCurrency(controller.monthSnapshot?.incomes ?? 0)}
      </Paragraph>
      <Paragraph color="$color" fontFamily="$body" fontSize="$4">
        Despesas: {formatCurrency(controller.monthSnapshot?.expenses ?? 0)}
      </Paragraph>
      <Paragraph color="$color" fontFamily="$body" fontSize="$4">
        Saldo: {formatCurrency(controller.monthSnapshot?.balance ?? 0)}
      </Paragraph>
    </YStack>
  );
}
