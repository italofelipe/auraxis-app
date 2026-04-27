import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { GoalSimulatorForm } from "@/features/goals/components/goal-simulator-form";
import type { SimulatedGoalPlan } from "@/features/goals/contracts";
import { useGoalSimulatorScreenController } from "@/features/goals/hooks/use-goal-simulator-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

export function GoalSimulatorScreen(): ReactElement {
  const controller = useGoalSimulatorScreenController();
  return (
    <AppScreen>
      <GoalSimulatorForm
        isSubmitting={controller.isSubmitting}
        submitError={controller.submitError}
        onSubmit={controller.handleSubmit}
        onDismissError={controller.dismissSubmitError}
      />
      {controller.result ? (
        <ResultCard
          plan={controller.result}
          onReset={controller.handleReset}
        />
      ) : null}
    </AppScreen>
  );
}

interface ResultCardProps {
  readonly plan: SimulatedGoalPlan;
  readonly onReset: () => void;
}

function ResultCard({ plan, onReset }: ResultCardProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Plano simulado"
      description="Resultado preliminar - ajuste os parametros para refinar."
    >
      <YStack gap="$2">
        <AppKeyValueRow
          label="Contribuicao mensal"
          value={formatCurrency(plan.monthlyContribution)}
        />
        <AppKeyValueRow
          label="Meses ate o alvo"
          value={plan.monthsToTarget?.toString() ?? "—"}
        />
        <AppKeyValueRow
          label="Taxa recomendada"
          value={
            plan.recommendedSavingsRate !== null
              ? `${(plan.recommendedSavingsRate * 100).toFixed(1)}%`
              : "—"
          }
        />
        <AppKeyValueRow
          label="Conclusao prevista"
          value={plan.projectedFinishDate ?? "—"}
        />
        {plan.disclaimer ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {plan.disclaimer}
          </Paragraph>
        ) : null}
        <AppButton tone="secondary" onPress={onReset}>
          Limpar
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}
