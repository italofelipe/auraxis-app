import type { ReactElement } from "react";

import { useRouter } from "expo-router";
import { Paragraph, XStack, YStack } from "tamagui";

import { appRoutes, buildBudgetDetailPath } from "@/core/navigation/routes";
import { BudgetForm } from "@/features/budgets/components/budget-form";
import type { Budget } from "@/features/budgets/contracts";
import {
  useBudgetsScreenController,
  type BudgetsScreenController,
} from "@/features/budgets/hooks/use-budgets-screen-controller";
import {
  BUDGET_USAGE_LABELS,
  BUDGET_USAGE_TONE,
  getBudgetUsageLevel,
  sortBudgetsByRisk,
} from "@/features/budgets/services/budget-risk";
import { AiInsightSurface } from "@/features/insights/components/ai-insight-surface";
import { useInsightSection } from "@/features/insights/hooks/use-insight-section";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppQueryState } from "@/shared/components/app-query-state";
import {
  InsightSection,
  buildInsightFluidaParams,
} from "@/shared/insights";
import { BudgetsListSkeleton } from "@/shared/skeletons";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export function BudgetsScreen(): ReactElement {
  const controller = useBudgetsScreenController();
  const router = useRouter();
  const insightSection = useInsightSection("budgets");

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
      <InsightSection
        vm={insightSection}
        onReadFull={() => router.push(buildInsightFluidaParams("budgets"))}
      />
      <AiInsightSurface
        dimension="budgets"
        onOpenHub={() => router.push(appRoutes.private.insights)}
      />
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
              <ConsolidatedHealthBar percentage={summary.percentageUsed} />
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
        {() => <BudgetsList controller={controller} />}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface ConsolidatedHealthBarProps {
  readonly percentage: number;
}

function ConsolidatedHealthBar({
  percentage,
}: ConsolidatedHealthBarProps): ReactElement {
  const level = getBudgetUsageLevel(percentage, false);
  const width = Math.min(100, Math.max(0, percentage));
  const color = level === "danger" ? "$danger" : level === "warning" ? "$muted" : "$primary";
  return (
    <YStack
      height={10}
      borderRadius="$10"
      backgroundColor="$backgroundPress"
      overflow="hidden"
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(width), min: 0, max: 100 }}
    >
      <YStack height="100%" width={`${width}%`} backgroundColor={color} />
    </YStack>
  );
}

function BudgetsList({ controller }: ControllerProps): ReactElement {
  const router = useRouter();
  const ranked = sortBudgetsByRisk(controller.budgets);
  return (
    <YStack gap="$3">
      {ranked.map((budget) => (
        <BudgetRow
          key={budget.id}
          budget={budget}
          isDeleting={controller.deletingBudgetId === budget.id}
          onDetails={() => router.push(buildBudgetDetailPath(budget.id))}
          onEdit={() => controller.handleOpenEdit(budget)}
          onDelete={() => {
            void controller.handleDelete(budget.id);
          }}
        />
      ))}
    </YStack>
  );
}

interface BudgetRowProps {
  readonly budget: Budget;
  readonly isDeleting: boolean;
  readonly onDetails: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

function BudgetRow({
  budget,
  isDeleting,
  onDetails,
  onEdit,
  onDelete,
}: BudgetRowProps): ReactElement {
  const level = getBudgetUsageLevel(budget.percentageUsed, budget.isOverBudget);
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={`${budget.name} · ${budget.period}`}
        value={
          <YStack alignItems="flex-end" gap="$1">
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              {budget.spent} / {budget.amount}
            </Paragraph>
            <AppBadge tone={BUDGET_USAGE_TONE[level]}>
              {`${BUDGET_USAGE_LABELS[level]} · ${budget.percentageUsed.toFixed(1)}%`}
            </AppBadge>
          </YStack>
        }
      />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton tone="secondary" onPress={onDetails} disabled={isDeleting}>
          Detalhes
        </AppButton>
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
