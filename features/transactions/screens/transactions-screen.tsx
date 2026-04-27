import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { TransactionForm } from "@/features/transactions/components/transaction-form";
import {
  useTransactionsScreenController,
  type TransactionsScreenController,
  type TransactionsTypeFilter,
  type TransactionViewModel,
} from "@/features/transactions/hooks/use-transactions-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { TransactionListSkeleton } from "@/shared/skeletons";
import { formatShortDate } from "@/shared/utils/formatters";

const STATUS_TONE: Record<string, "default" | "primary" | "danger"> = {
  paid: "primary",
  pending: "default",
  overdue: "danger",
  cancelled: "default",
  postponed: "default",
};

const FILTER_LABELS: Record<TransactionsTypeFilter, string> = {
  all: "Todas",
  income: "Receitas",
  expense: "Despesas",
};

const FILTER_ORDER: readonly TransactionsTypeFilter[] = ["all", "income", "expense"];

/**
 * Canonical transactions screen composition for the mobile app.
 *
 * @returns List with filters and create/edit/delete actions or active form.
 */
export function TransactionsScreen(): ReactElement {
  const controller = useTransactionsScreenController();

  if (controller.formMode.kind !== "closed") {
    return (
      <AppScreen>
        <TransactionForm
          initialTransaction={
            controller.formMode.kind === "edit"
              ? controller.formMode.transaction
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
      <FilterHeader controller={controller} />
      <TransactionsListCard controller={controller} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: TransactionsScreenController;
}

function FilterHeader({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Transacoes"
      description={`${controller.total} registradas`}
    >
      <YStack gap="$3">
        <XStack gap="$2" flexWrap="wrap">
          {FILTER_ORDER.map((filter) => (
            <AppButton
              key={filter}
              tone={controller.typeFilter === filter ? "primary" : "secondary"}
              onPress={() => controller.setTypeFilter(filter)}
            >
              {FILTER_LABELS[filter]}
            </AppButton>
          ))}
        </XStack>
        <AppButton onPress={controller.handleOpenCreate}>Nova transacao</AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function TransactionsListCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Lista"
      description="Suas movimentacoes financeiras."
    >
      <AppQueryState
        query={controller.transactionsQuery}
        options={{
          loading: {
            title: "Carregando transacoes",
            description: "Buscando suas movimentacoes.",
          },
          loadingPresentation: "skeleton",
          empty: {
            title: "Nenhuma transacao no filtro atual",
            description:
              "Crie uma nova transacao ou troque o filtro acima.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar as transacoes",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.transactions.length === 0,
        }}
        loadingComponent={<TransactionListSkeleton rows={5} />}
        emptyComponent={
          <AppEmptyState
            illustration="transactions"
            title="Nenhuma transacao no filtro atual"
            description="Crie uma nova transacao ou troque o filtro acima para visualizar movimentos."
            cta={{
              label: "Nova transacao",
              onPress: controller.handleOpenCreate,
            }}
          />
        }
      >
        {() => (
          <YStack gap="$3">
            {controller.transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isDeleting={controller.deletingTransactionId === tx.id}
                onEdit={() => {
                  const record = controller.transactionsQuery.data?.transactions.find(
                    (item) => item.id === tx.id,
                  );
                  if (record) {
                    controller.handleOpenEdit(record);
                  }
                }}
                onDelete={() => {
                  void controller.handleDelete(tx.id);
                }}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface TransactionRowProps {
  readonly tx: TransactionViewModel;
  readonly isDeleting: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

function TransactionRow({
  tx,
  isDeleting,
  onEdit,
  onDelete,
}: TransactionRowProps): ReactElement {
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={tx.title}
        value={
          <XStack alignItems="center" gap="$2">
            <YStack alignItems="flex-end" gap="$1">
              <Paragraph
                color={tx.type === "income" ? "$success" : "$danger"}
                fontFamily="$body"
                fontSize="$4"
              >
                {tx.type === "income" ? "+" : "-"}
                {tx.amount}
              </Paragraph>
              <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                {formatShortDate(tx.dueDate)}
              </Paragraph>
            </YStack>
            <AppBadge tone={STATUS_TONE[tx.status] ?? "default"}>{tx.status}</AppBadge>
          </XStack>
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
