import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { useDashboardScreenController } from "@/features/dashboard/hooks/use-dashboard-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

/**
 * Canonical dashboard screen composition for the mobile app.
 *
 * @returns Overview and monthly snapshot panels for the authenticated user.
 */
export function DashboardScreen(): ReactElement {
  const controller = useDashboardScreenController();

  return (
    <AppScreen>
      <AppSurfaceCard title="Saldo geral" description="Resumo consolidado.">
        <AppQueryState
          query={controller.overviewQuery}
          options={{
            loading: {
              title: "Carregando dashboard",
              description: "Buscando o consolidado financeiro mais recente.",
            },
            empty: {
              title: "Nenhum consolidado encontrado",
              description: "Os totais vao aparecer aqui assim que houver movimentacoes.",
            },
            error: {
              fallbackTitle: "Nao foi possivel carregar o dashboard",
              fallbackDescription: "Tente novamente em alguns instantes.",
            },
            loadingPresentation: "skeleton",
          }}
        >
          {() => (
            <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
              {formatCurrency(controller.currentBalance)}
            </Paragraph>
          )}
        </AppQueryState>
      </AppSurfaceCard>

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
                description: "Os totais mensais vao aparecer aqui assim que houver dados.",
              },
              error: {
                fallbackTitle: "Nao foi possivel carregar as tendencias",
                fallbackDescription: "Tente novamente em instantes.",
              },
              isEmpty: (data) => data.series.length === 0 || controller.monthSnapshot === null,
              loadingPresentation: "notice",
            }}
          >
            {() => (
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
            )}
          </AppQueryState>
        </YStack>
      </AppSurfaceCard>
    </AppScreen>
  );
}
