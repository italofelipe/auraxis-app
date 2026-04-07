import { Paragraph, XStack, YStack } from "tamagui";

import { useDashboardScreenController } from "@/features/dashboard/hooks/use-dashboard-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";
import { formatCurrency } from "@/shared/utils/formatters";

export default function DashboardScreen() {
  const controller = useDashboardScreenController();

  return (
    <AppScreen>
      <AppSurfaceCard title="Saldo geral" description="Resumo consolidado.">
        {controller.overviewQuery.isPending ? (
          <AsyncStateNotice
            kind="loading"
            title="Carregando dashboard"
            description="Buscando o consolidado financeiro mais recente."
          />
        ) : controller.overviewQuery.isError ? (
          <AsyncStateNotice
            kind="error"
            title="Nao foi possivel carregar o dashboard"
            description="Tente novamente em alguns instantes."
          />
        ) : (
          <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
            {formatCurrency(controller.currentBalance)}
          </Paragraph>
        )}
      </AppSurfaceCard>

      <AppSurfaceCard
        title="Resumo por mes"
        description="Receitas, despesas e saldo do periodo selecionado.">
        <YStack gap="$3">
          <XStack gap="$2" flexWrap="wrap">
            {controller.monthOptions.map((month) => (
              <AppButton
                key={month.value}
                tone={controller.selectedMonth === month.value ? "primary" : "secondary"}
                onPress={() => controller.setSelectedMonth(month.value)}>
                {month.label}
              </AppButton>
            ))}
          </XStack>

          {controller.trendsQuery.isPending ? (
            <AsyncStateNotice
              kind="loading"
              title="Carregando tendencias"
              description="Preparando a leitura mensal do seu fluxo."
            />
          ) : controller.trendsQuery.isError ? (
            <AsyncStateNotice
              kind="error"
              title="Nao foi possivel carregar as tendencias"
              description="Tente novamente em instantes."
            />
          ) : controller.monthSnapshot ? (
            <YStack gap="$2">
              <Paragraph color="$color" fontFamily="$body" fontSize="$4">
                Receitas: {formatCurrency(controller.monthSnapshot.incomes)}
              </Paragraph>
              <Paragraph color="$color" fontFamily="$body" fontSize="$4">
                Despesas: {formatCurrency(controller.monthSnapshot.expenses)}
              </Paragraph>
              <Paragraph color="$color" fontFamily="$body" fontSize="$4">
                Saldo: {formatCurrency(controller.monthSnapshot.balance)}
              </Paragraph>
            </YStack>
          ) : (
            <AsyncStateNotice
              kind="empty"
              title="Sem movimentos no periodo"
              description="Os totais mensais vao aparecer aqui assim que houver dados."
            />
          )}
        </YStack>
      </AppSurfaceCard>
    </AppScreen>
  );
}
