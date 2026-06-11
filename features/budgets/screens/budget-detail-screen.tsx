import { type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { Budget } from "@/features/budgets/contracts";
import {
  useBudgetDetailScreenController,
  type BudgetDetailScreenController,
} from "@/features/budgets/hooks/use-budget-detail-screen-controller";
import {
  BUDGET_USAGE_LABELS,
  BUDGET_USAGE_TONE,
  type BudgetUsageLevel,
} from "@/features/budgets/services/budget-risk";
import type { TransactionRecord } from "@/features/transactions/contracts";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { BudgetsListSkeleton } from "@/shared/skeletons";
import { formatShortDate } from "@/shared/utils/formatters";

/**
 * Budget detail screen (parity with the web envelope detail panel): usage
 * level, period, tag and amounts, plus a preview of the period's transactions.
 */
export function BudgetDetailScreen(): ReactElement {
  const controller = useBudgetDetailScreenController();

  if (controller.budgetsQuery.isLoading && controller.budget === null) {
    return (
      <AppScreen>
        <BudgetsListSkeleton rows={3} />
      </AppScreen>
    );
  }

  if (controller.notFound || controller.budget === null) {
    return (
      <AppScreen>
        <AppEmptyState
          illustration="budgets"
          title="Orcamento nao encontrado"
          description="Esse orcamento nao existe ou foi removido."
          cta={{ label: "Voltar", onPress: controller.handleBack }}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <BudgetDetailContent controller={controller} budget={controller.budget} />
    </AppScreen>
  );
}

interface BudgetDetailContentProps {
  readonly controller: BudgetDetailScreenController;
  readonly budget: Budget;
}

function BudgetDetailContent({
  controller,
  budget,
}: BudgetDetailContentProps): ReactElement {
  const level = controller.usageLevel;
  return (
    <YStack gap="$3">
      <AppButton tone="secondary" onPress={controller.handleBack}>
        Voltar
      </AppButton>

      <AppSurfaceCard title={budget.name} description={budget.period}>
        <YStack gap="$3">
          <XStack alignItems="center" justifyContent="space-between" gap="$2">
            <UsageBadge level={level} percentage={budget.percentageUsed} />
            {budget.tagName ? (
              <AppBadge tone="default">{budget.tagName}</AppBadge>
            ) : null}
          </XStack>
          <UsageBar level={level} percentage={budget.percentageUsed} />
          <AppKeyValueRow label="Orcado" value={budget.amount} />
          <AppKeyValueRow label="Gasto" value={budget.spent} />
          <AppKeyValueRow label="Restante" value={budget.remaining} />
        </YStack>
      </AppSurfaceCard>

      <AppSurfaceCard
        title="Transacoes do periodo"
        description="Ultimos lancamentos que pesam neste orcamento."
      >
        <AppQueryState
          query={controller.transactionsQuery}
          options={{
            loading: { title: "Carregando transacoes" },
            loadingPresentation: "skeleton",
            empty: { title: "Nenhuma transacao no periodo" },
            error: { fallbackTitle: "Nao foi possivel carregar as transacoes" },
            isEmpty: () => controller.previewTransactions.length === 0,
          }}
          loadingComponent={<BudgetsListSkeleton rows={3} />}
        >
          {() => <TransactionPreview transactions={controller.previewTransactions} />}
        </AppQueryState>
      </AppSurfaceCard>
    </YStack>
  );
}

interface UsageBadgeProps {
  readonly level: BudgetUsageLevel;
  readonly percentage: number;
}

function UsageBadge({ level, percentage }: UsageBadgeProps): ReactElement {
  return (
    <AppBadge tone={BUDGET_USAGE_TONE[level]}>
      {`${BUDGET_USAGE_LABELS[level]} · ${percentage.toFixed(1)}%`}
    </AppBadge>
  );
}

interface UsageBarProps {
  readonly level: BudgetUsageLevel;
  readonly percentage: number;
}

function UsageBar({ level, percentage }: UsageBarProps): ReactElement {
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

interface TransactionPreviewProps {
  readonly transactions: readonly TransactionRecord[];
}

function TransactionPreview({ transactions }: TransactionPreviewProps): ReactElement {
  return (
    <YStack gap="$3">
      {transactions.map((tx) => (
        <AppKeyValueRow
          key={tx.id}
          label={tx.title}
          value={
            <YStack alignItems="flex-end" gap="$1">
              <Paragraph
                color={tx.type === "income" ? "$success" : "$danger"}
                fontFamily="$body"
                fontSize="$4"
              >
                {tx.type === "income" ? "+" : "-"}
                {tx.amount}
              </Paragraph>
              <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
                {formatShortDate(tx.dueDate)}
              </Paragraph>
            </YStack>
          }
        />
      ))}
    </YStack>
  );
}
