import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import {
  useGoalScenarioScreenController,
  type GoalScenarioScreenController,
} from "@/features/goals/hooks/use-goal-scenario-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

const parseDecimal = (raw: string): number => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseInteger = (raw: string): number => {
  const parsed = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value: string | null): string => {
  if (value === null) {
    return "Não atinge no horizonte";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR");
};

const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

interface HeaderProps {
  readonly title: string;
  readonly subtitle: string;
  readonly onBack: () => void;
}

function Header({ title, subtitle, onBack }: HeaderProps): ReactElement {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <YStack gap="$1" flex={1}>
        <Paragraph color="$color" fontFamily="$heading" fontSize="$7">
          {title}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {subtitle}
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

interface ScenarioFormProps {
  readonly controller: GoalScenarioScreenController;
}

function ScenarioForm({ controller }: ScenarioFormProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Ajustes do cenário"
      description="Mude aporte, prazo ou rentabilidade. A projeção atualiza em tempo real."
    >
      <YStack gap="$3">
        <AppInputField
          id="scenario-monthly"
          label="Aporte mensal (R$)"
          keyboardType="decimal-pad"
          value={String(controller.form.monthlyContribution)}
          onChangeText={(text) =>
            controller.setMonthlyContribution(parseDecimal(text))
          }
          placeholder="0,00"
        />
        <AppInputField
          id="scenario-horizon"
          label="Horizonte (meses)"
          keyboardType="number-pad"
          value={String(controller.form.horizonMonths)}
          onChangeText={(text) => controller.setHorizonMonths(parseInteger(text))}
          placeholder="24"
        />
        <AppInputField
          id="scenario-rate"
          label="Rentabilidade anual estimada (%)"
          keyboardType="decimal-pad"
          value={String(controller.form.annualReturnRatePct)}
          onChangeText={(text) =>
            controller.setAnnualReturnRatePct(parseDecimal(text))
          }
          placeholder="8"
        />
        <XStack gap="$2">
          <AppButton tone="secondary" onPress={controller.handleResetToBaseline}>
            Resetar
          </AppButton>
          <AppButton
            tone="primary"
            disabled={
              controller.isSaving || controller.projectedCompletionDate === null
            }
            onPress={controller.handleSaveTargetDate}
          >
            {controller.isSaving ? "Salvando..." : "Salvar nova data alvo"}
          </AppButton>
        </XStack>
      </YStack>
    </AppSurfaceCard>
  );
}

interface ProjectionCardProps {
  readonly controller: GoalScenarioScreenController;
}

function ProjectionCard({ controller }: ProjectionCardProps): ReactElement {
  const { scenario, baseline, goal, projectedCompletionDate } = controller;
  return (
    <AppSurfaceCard
      title="Projeção do cenário"
      description="Comparativo com a baseline retornada pela API."
    >
      <YStack gap="$2">
        <AppKeyValueRow
          label="Saldo final no horizonte"
          value={formatCurrency(scenario.finalBalance)}
        />
        <AppKeyValueRow
          label="Meses até a meta"
          value={
            scenario.monthsToTarget === null
              ? "Não atinge"
              : `${scenario.monthsToTarget} meses`
          }
        />
        <AppKeyValueRow
          label="Data alvo projetada"
          value={formatDate(projectedCompletionDate)}
        />
        <AppKeyValueRow
          label="Falta acumular"
          value={formatCurrency(scenario.remainingGap)}
        />
        {goal !== null ? (
          <AppKeyValueRow
            label="Meta atual"
            value={formatCurrency(goal.targetAmount)}
          />
        ) : null}
        {baseline !== null ? (
          <AppKeyValueRow
            label="Baseline (API)"
            value={
              baseline.projectedFinishDate === null
                ? "Sem data canônica"
                : formatDate(baseline.projectedFinishDate)
            }
            helperText={
              baseline.assumptions.monthlyContribution !== null
                ? `aporte ${formatCurrency(baseline.assumptions.monthlyContribution)}`
                : undefined
            }
          />
        ) : null}
        {baseline?.assumptions.annualReturnRate !== undefined &&
        baseline.assumptions.annualReturnRate !== null ? (
          <AppKeyValueRow
            label="Taxa baseline"
            value={formatPercent(baseline.assumptions.annualReturnRate)}
          />
        ) : null}
      </YStack>
    </AppSurfaceCard>
  );
}

/**
 * Per-goal scenario sandbox.
 *
 * Reads `id` from the URL, loads the goal, fetches the canonical
 * projection, hydrates the form with the baseline once and lets the
 * user simulate adjustments to monthly contribution, horizon and rate
 * without server roundtrips. The "Salvar nova data alvo" CTA persists
 * the simulated completion date back to the goal via the existing
 * update mutation.
 *
 * @returns The screen tree.
 */
export function GoalScenarioScreen(): ReactElement {
  const controller = useGoalScenarioScreenController();
  const subtitle =
    controller.goal?.title ?? "Carregando dados da meta selecionada...";
  return (
    <AppScreen testID="goal-scenario-screen">
      <Header title="Simulador de cenário" subtitle={subtitle} onBack={controller.handleBack} />
      {controller.saveError !== null ? (
        <AppErrorNotice
          error={controller.saveError}
          fallbackTitle="Não foi possível salvar"
          fallbackDescription="Confira a conexão e tente novamente."
        />
      ) : null}
      <ScenarioForm controller={controller} />
      <ProjectionCard controller={controller} />
    </AppScreen>
  );
}
