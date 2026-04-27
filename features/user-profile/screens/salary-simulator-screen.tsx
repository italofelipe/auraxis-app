import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { SalarySimulatorForm } from "@/features/user-profile/components/salary-simulator-form";
import type { SalaryIncreaseSimulation } from "@/features/user-profile/contracts";
import { useSalarySimulatorScreenController } from "@/features/user-profile/hooks/use-salary-simulator-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

export function SalarySimulatorScreen(): ReactElement {
  const controller = useSalarySimulatorScreenController();
  return (
    <AppScreen>
      <SalarySimulatorForm
        isSubmitting={controller.isSubmitting}
        submitError={controller.submitError}
        onSubmit={controller.handleSubmit}
        onDismissError={controller.dismissSubmitError}
      />
      {controller.result ? (
        <ResultCard
          simulation={controller.result}
          onReset={controller.handleReset}
        />
      ) : null}
    </AppScreen>
  );
}

interface ResultCardProps {
  readonly simulation: SalaryIncreaseSimulation;
  readonly onReset: () => void;
}

function ResultCard({ simulation, onReset }: ResultCardProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Resultado"
      description="Recomposicao de inflacao + aumento real."
    >
      <YStack gap="$2">
        <AppKeyValueRow
          label="Recomposicao"
          value={formatCurrency(simulation.recomposition)}
        />
        <AppKeyValueRow
          label="Salario alvo"
          value={formatCurrency(simulation.target)}
        />
        <AppButton tone="secondary" onPress={onReset}>
          Limpar
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}
