import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { AppAsyncState } from "@/shared/components/app-async-state";
import { AppButton } from "@/shared/components/app-button";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { InstallmentVsCashForm } from "@/features/tools/components/installment-vs-cash-form";
import { InstallmentVsCashHistoryList } from "@/features/tools/components/installment-vs-cash-history-list";
import { InstallmentVsCashResultCard } from "@/features/tools/components/installment-vs-cash-result-card";
import { useInstallmentVsCashScreenController } from "@/features/tools/hooks/use-installment-vs-cash-screen-controller";

function InstallmentVsCashHeader({ onBack }: { readonly onBack: () => void }): ReactElement {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <YStack gap="$1" flex={1}>
        <Paragraph color="$color" fontFamily="$heading" fontSize="$7">
          Parcelado vs a vista
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Compare desconto, parcelas, inflacao e custo de oportunidade com uma experiencia adaptada
          para o mobile.
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

/**
 * Canonical installment-vs-cash screen for the mobile app.
 *
 * @returns Full simulation flow composed from feature components and controller bindings.
 */
export function InstallmentVsCashScreen(): ReactElement {
  const controller = useInstallmentVsCashScreenController();

  return (
    <AppScreen testID="installment-vs-cash-screen">
      <InstallmentVsCashHeader onBack={controller.handleGoBack} />

      <AppSurfaceCard
        title="Simule sua compra"
        description="Resposta rapida para decidir melhor sem perder a camada de detalhe."
      >
        <InstallmentVsCashForm
          draft={controller.draft}
          errors={controller.errors}
          isSubmitting={controller.calculateMutation.isPending}
          onTextChange={controller.setTextField}
          onInstallmentModeChange={controller.setInstallmentMode}
          onDelayPresetChange={controller.setDelayPreset}
          onOpportunityRateTypeChange={controller.setOpportunityRateType}
          onFeesEnabledChange={controller.setFeesEnabled}
          onSubmit={() => {
            void controller.handleCalculate();
          }}
        />
      </AppSurfaceCard>

      {controller.calculateMutation.isPending ? (
        <AppAsyncState
          state={{
            kind: "loading",
            title: "Calculando cenario",
            description: "Conferindo valor presente, poder de compra e break-even.",
            presentation: "notice",
            skeletonLines: 3,
          }}
        />
      ) : null}

      {controller.calculateMutation.isError ? (
        <AppAsyncState
          state={{
            kind: "error",
            error: controller.calculateMutation.error,
            fallbackTitle: "Nao foi possivel calcular agora",
            fallbackDescription: "Revise os dados e tente novamente em alguns instantes.",
            onAction: (): void => {
              void controller.handleCalculate();
            },
          }}
        />
      ) : null}

      {controller.calculation ? (
        <InstallmentVsCashResultCard
          calculation={controller.calculation}
          selectedOption={controller.selectedOption}
          isSaving={controller.saveMutation.isPending}
          isCreatingGoal={controller.createGoalMutation.isPending}
          isCreatingPlannedExpense={controller.createPlannedExpenseMutation.isPending}
          hasPremiumAccess={controller.premiumQuery.data === true}
          onSelectedOptionChange={controller.setSelectedOption}
          onSave={() => {
            void controller.handleSave();
          }}
          onCreateGoal={() => {
            void controller.handleCreateGoal();
          }}
          onCreatePlannedExpense={() => {
            void controller.handleCreatePlannedExpense();
          }}
        />
      ) : null}

      <AppQueryState
        query={controller.historyQuery}
        options={{
          loading: {
            title: "Carregando historico",
            description: "Buscando suas ultimas simulacoes salvas desta ferramenta.",
          },
          empty: {
            title: "Nenhuma simulacao salva ainda",
            description: "Seus cenarios salvos vao aparecer aqui para comparacoes futuras.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar o historico",
            fallbackDescription:
              "Tente novamente em alguns instantes para recuperar suas simulacoes.",
          },
          isEmpty: (data) => data.length === 0,
          loadingPresentation: "notice",
        }}
      >
        {(data) => <InstallmentVsCashHistoryList items={data} />}
      </AppQueryState>
    </AppScreen>
  );
}
