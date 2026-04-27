import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { DashboardComparisonCard } from "@/features/dashboard/components/dashboard-comparison-card";
import { DashboardCountsCard } from "@/features/dashboard/components/dashboard-counts-card";
import { DashboardGoalsSummaryCard } from "@/features/dashboard/components/dashboard-goals-summary-card";
import { DashboardQuickAddFab } from "@/features/dashboard/components/dashboard-quick-add-fab";
import { DashboardSurvivalIndexCard } from "@/features/dashboard/components/dashboard-survival-index-card";
import { DashboardTopCategoriesCard } from "@/features/dashboard/components/dashboard-top-categories-card";
import { DashboardTrendsChartCard } from "@/features/dashboard/components/dashboard-trends-chart-card";
import { DashboardUpcomingDueCard } from "@/features/dashboard/components/dashboard-upcoming-due-card";
import { DashboardWalletSummaryCard } from "@/features/dashboard/components/dashboard-wallet-summary-card";
import {
  useDashboardScreenController,
  type DashboardScreenController,
} from "@/features/dashboard/hooks/use-dashboard-screen-controller";
import { useUserProfileQuery } from "@/features/user-profile/hooks/use-user-profile-query";
import type {
  SavingsRateAssessment,
  SavingsRateLevel,
} from "@/features/dashboard/services/savings-rate-calculator";
import { AppButton } from "@/shared/components/app-button";
import { AppQueryState } from "@/shared/components/app-query-state";
import { DashboardSkeleton, MetricGridSkeleton } from "@/shared/skeletons";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
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

/**
 * Canonical dashboard screen composition for the mobile app.
 *
 * @returns Greeting, balance, savings rate and monthly snapshot panels.
 */
// eslint-disable-next-line complexity
export function DashboardScreen(): ReactElement {
  const controller = useDashboardScreenController();
  const overview = controller.overviewQuery.data;
  const trendsSeries = controller.trendsQuery.data?.series ?? [];
  const profile = useUserProfileQuery().data ?? null;

  return (
    <AppScreen>
      <BalanceCard controller={controller} />
      {controller.monthSnapshot ? (
        <DashboardComparisonCard
          title="Saldo"
          value={controller.monthSnapshot.balance}
          delta={controller.comparison.delta?.balance ?? null}
          percent={controller.comparison.percent?.balance ?? null}
          positiveIsGood
          testID="dashboard-comparison-balance"
        />
      ) : null}
      {controller.monthSnapshot ? (
        <DashboardComparisonCard
          title="Receitas"
          value={controller.monthSnapshot.incomes}
          delta={controller.comparison.delta?.income ?? null}
          percent={controller.comparison.percent?.income ?? null}
          positiveIsGood
          testID="dashboard-comparison-income"
        />
      ) : null}
      {controller.monthSnapshot ? (
        <DashboardComparisonCard
          title="Despesas"
          value={controller.monthSnapshot.expenses}
          delta={controller.comparison.delta?.expenses ?? null}
          percent={controller.comparison.percent?.expenses ?? null}
          positiveIsGood={false}
          testID="dashboard-comparison-expenses"
        />
      ) : null}
      <DashboardUpcomingDueCard />
      <DashboardGoalsSummaryCard />
      <DashboardWalletSummaryCard />
      {controller.savingsRate ? (
        <SavingsRateCard assessment={controller.savingsRate} />
      ) : null}
      <MonthSnapshotCard controller={controller} />
      {profile ? (
        <DashboardSurvivalIndexCard
          netWorth={profile.netWorth}
          monthlyExpenses={profile.monthlyExpenses}
        />
      ) : null}
      {overview ? (
        <DashboardCountsCard counts={overview.counts} />
      ) : null}
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
      <DashboardQuickAddFab />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: DashboardScreenController;
}

function BalanceCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
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
            <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
              {formatCurrency(controller.currentBalance)}
            </Paragraph>
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
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
        <XStack gap="$2" flexWrap="wrap">
          {controller.monthOptions.map((month) => (
            <AppButton
              key={month.value}
              tone={controller.selectedMonth === month.value ? "primary" : "secondary"}
              onPress={() => controller.setSelectedMonth(month.value)}
            >
              {month.label}
            </AppButton>
          ))}
        </XStack>

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
