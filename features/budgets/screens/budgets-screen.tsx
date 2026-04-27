import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { BudgetForm } from "@/features/budgets/components/budget-form";
import type { Budget } from "@/features/budgets/contracts";
import {
  useBudgetsScreenController,
  type BudgetsScreenController,
} from "@/features/budgets/hooks/use-budgets-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppQueryState } from "@/shared/components/app-query-state";
import { BudgetsListSkeleton } from "@/shared/skeletons";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export function BudgetsScreen(): ReactElement {
  const controller = useBudgetsScreenController();

  if (controller.formMode.kind !== "closed") {
    return (
      <AppScreen>
        <BudgetForm
          initialBudget={
            controller.formMode.kind === "edit"
              ? controller.formMode.budget
              : null
          }
          isSubmitting={controller.isSubmitting}
          submitError={controller.submitError}
          onSubmit={controller.handleSubmit}
          onCancel={controller.handleCloseForm}
          onDismissError={controller.dismissSubmitError}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SummaryCard controller={controller} />
      <BudgetsListCard controller={controller} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: BudgetsScreenController;
}

function SummaryCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Orcamentos"
      description="Total orcado vs gasto consolidado."
    >
      <YStack gap="$3">
        <AppQueryState
          query={controller.summaryQuery}
          options={{
            loading: {
              title: "Carregando resumo",
              description: "Calculando totais.",
            },
            empty: {
              title: "Sem orcamentos",
              description: "Adicione um orcamento para comecar.",
            },
            error: {
              fallbackTitle: "Nao foi possivel carregar o resumo",
              fallbackDescription: "Tente novamente em instantes.",
            },
          }}
        >
          {(summary) => (
            <YStack gap="$2">
              <AppKeyValueRow label="Orcado" value={summary.totalBudgeted} />
              <AppKeyValueRow label="Gasto" value={summary.totalSpent} />
              <AppKeyValueRow label="Restante" value={summary.totalRemaining} />
              <AppKeyValueRow
                label="% utilizado"
                value={`${summary.percentageUsed.toFixed(1)}%`}
              />
            </YStack>
          )}
        </AppQueryState>
        <AppButton onPress={controller.handleOpenCreate}>Novo orcamento</AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function BudgetsListCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Lista de orcamentos"
      description="Tetos por categoria e tag."
    >
      <AppQueryState
        query={controller.budgetsQuery}
        options={{
          loading: {
            title: "Carregando orcamentos",
            description: "Buscando orcamentos registrados.",
          },
          empty: {
            title: "Nenhum orcamento registrado",
            description: "Crie o primeiro orcamento para acompanhar gastos.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar a lista",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.budgets.length === 0,
        }}
        loadingComponent={<BudgetsListSkeleton rows={3} />}
        emptyComponent={
          <AppEmptyState
            illustration="budgets"
            title="Sem orcamentos ativos"
            description="Crie um orcamento por categoria para acompanhar limites e gasto realizado."
            cta={{ label: "Novo orcamento", onPress: controller.handleOpenCreate }}
          />
        }
      >
        {() => (
          <YStack gap="$3">
            {controller.budgets.map((budget) => (
              <BudgetRow
                key={budget.id}
                budget={budget}
                isDeleting={controller.deletingBudgetId === budget.id}
                onEdit={() => controller.handleOpenEdit(budget)}
                onDelete={() => {
                  void controller.handleDelete(budget.id);
                }}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface BudgetRowProps {
  readonly budget: Budget;
  readonly isDeleting: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

function BudgetRow({
  budget,
  isDeleting,
  onEdit,
  onDelete,
}: BudgetRowProps): ReactElement {
  const tone = budget.isOverBudget ? "danger" : "primary";
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={`${budget.name} · ${budget.period}`}
        value={
          <YStack alignItems="flex-end" gap="$1">
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              {budget.spent} / {budget.amount}
            </Paragraph>
            <AppBadge tone={tone}>
              {budget.percentageUsed.toFixed(1)}%
            </AppBadge>
          </YStack>
        }
      />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton tone="secondary" onPress={onEdit} disabled={isDeleting}>
          Editar
        </AppButton>
        <AppButton tone="secondary" onPress={onDelete} disabled={isDeleting}>
          {isDeleting ? "Excluindo..." : "Excluir"}
        </AppButton>
      </XStack>
    </YStack>
  );
}
