import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";
import { useRouter } from "expo-router";

import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { CompoundInterestForm } from "@/features/tools/components/compound-interest-form";
import { CompoundInterestResultCard } from "@/features/tools/components/compound-interest-result-card";
import { useCompoundInterestController } from "@/features/tools/hooks/use-compound-interest-controller";

function CompoundInterestHeader({ onBack }: { readonly onBack: () => void }): ReactElement {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <YStack gap="$1" flex={1}>
        <Paragraph color="$color" fontFamily="$heading" fontSize="$7">
          Juros compostos
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Quanto seu dinheiro rende com aporte mensal recorrente.
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

/**
 * Juros compostos screen — lote B of the canonical tools hub (DEC-196).
 * Presents the input form, computes the result client-side and offers
 * the canonical Salvar simulação flow with a leave-without-save prompt.
 * @returns The screen tree.
 */
export function CompoundInterestScreen(): ReactElement {
  const controller = useCompoundInterestController();
  const router = useRouter();

  return (
    <AppScreen testID="compound-interest-screen">
      <CompoundInterestHeader onBack={() => router.back()} />
      <AppSurfaceCard
        title="Configure o cenário"
        description="Use 0 quando não houver aporte mensal."
      >
        <CompoundInterestForm
          draft={controller.draft}
          errors={controller.errors}
          onChange={controller.setField}
          onSubmit={controller.handleCalculate}
          onReset={controller.handleReset}
        />
      </AppSurfaceCard>
      {controller.saveError !== null ? (
        <AppErrorNotice
          error={controller.saveError}
          fallbackTitle="Não foi possível salvar"
          fallbackDescription="Confira a conexão e tente novamente."
        />
      ) : null}
      {controller.result !== null ? (
        <CompoundInterestResultCard
          result={controller.result}
          isSaving={controller.isSaving}
          isSaved={controller.savedSimulationId !== null}
          onSave={() => {
            void controller.handleSave();
          }}
        />
      ) : null}
    </AppScreen>
  );
}
