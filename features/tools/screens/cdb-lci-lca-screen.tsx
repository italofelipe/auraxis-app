import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";
import { useRouter } from "expo-router";

import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { CdbLciLcaForm } from "@/features/tools/components/cdb-lci-lca-form";
import { CdbLciLcaResultCard } from "@/features/tools/components/cdb-lci-lca-result-card";
import { useCdbLciLcaController } from "@/features/tools/hooks/use-cdb-lci-lca-controller";

function CdbLciLcaHeader({ onBack }: { readonly onBack: () => void }): ReactElement {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <YStack gap="$1" flex={1}>
        <Paragraph color="$color" fontFamily="$heading" fontSize="$7">
          CDB · LCI · LCA
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Compare a rentabilidade líquida entre os principais títulos de renda fixa.
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

/**
 * CDB · LCI · LCA comparator screen — lote B of the canonical tools hub
 * (DEC-196). LCI/LCA are IR-exempt; CDB applies the regressive bracket.
 * @returns The screen tree.
 */
export function CdbLciLcaScreen(): ReactElement {
  const controller = useCdbLciLcaController();
  const router = useRouter();

  return (
    <AppScreen testID="cdb-lci-lca-screen">
      <CdbLciLcaHeader onBack={() => router.back()} />
      <AppSurfaceCard
        title="Configure o cenário"
        description="Escolha entre taxa atrelada ao CDI ou prefixada."
      >
        <CdbLciLcaForm
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
        <CdbLciLcaResultCard
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
