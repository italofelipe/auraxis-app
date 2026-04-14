import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { useTransactionsScreenController } from "@/features/transactions/hooks/use-transactions-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatShortDate } from "@/shared/utils/formatters";

const statusToneMap: Record<string, "default" | "primary" | "danger"> = {
  paid: "primary",
  pending: "default",
  overdue: "danger",
  cancelled: "default",
  postponed: "default",
};

/**
 * Canonical transactions screen composition for the mobile app.
 *
 * @returns Transaction list with loading, empty and error states.
 */
export function TransactionsScreen(): ReactElement {
  const controller = useTransactionsScreenController();

  return (
    <AppScreen>
      <AppSurfaceCard
        title="Transacoes"
        description={`${controller.total} transacoes registradas`}
      >
        <AppQueryState
          query={controller.transactionsQuery}
          options={{
            loading: {
              title: "Carregando transacoes",
              description: "Buscando suas movimentacoes financeiras.",
            },
            loadingPresentation: "skeleton",
            empty: {
              title: "Nenhuma transacao encontrada",
              description: "As movimentacoes financeiras vao aparecer aqui.",
            },
            error: {
              fallbackTitle: "Nao foi possivel carregar as transacoes",
              fallbackDescription: "Tente novamente em instantes.",
            },
            isEmpty: (data) => data.transactions.length === 0,
          }}
        >
          {() => (
            <YStack gap="$3">
              {controller.transactions.map((tx) => (
                <AppKeyValueRow
                  key={tx.id}
                  label={tx.title}
                  value={
                    <XStack alignItems="center" gap="$2">
                      <YStack alignItems="flex-end" gap="$1">
                        <Paragraph
                          color={tx.type === "income" ? "$success" : "$danger"}
                          fontFamily="$body"
                          fontSize="$4"
                        >
                          {tx.type === "income" ? "+" : "-"}{tx.amount}
                        </Paragraph>
                        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                          {formatShortDate(tx.dueDate)}
                        </Paragraph>
                      </YStack>
                      <AppBadge tone={statusToneMap[tx.status] ?? "default"}>
                        {tx.status}
                      </AppBadge>
                    </XStack>
                  }
                />
              ))}
            </YStack>
          )}
        </AppQueryState>
      </AppSurfaceCard>
    </AppScreen>
  );
}
