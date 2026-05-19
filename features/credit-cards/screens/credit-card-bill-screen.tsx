import type { ReactElement } from "react";
import { FlatList } from "react-native";

import { Paragraph, XStack, YStack } from "tamagui";

import type {
  CreditCardBillRecord,
  CreditCardBillTransaction,
} from "@/features/credit-cards/contracts";
import {
  type CreditCardBillScreenController,
  type CreditCardBillTransactionGroup,
  formatCreditCardBillDate,
  useCreditCardBillScreenController,
} from "@/features/credit-cards/hooks/use-credit-card-bill-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppMetricCard } from "@/shared/components/app-metric-card";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSectionHeader } from "@/shared/components/app-section-header";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

const statusLabels: Record<string, string> = {
  open: "Aberta",
  closed: "Fechada",
  paid: "Paga",
  pending: "Pendente",
  overdue: "Atrasada",
  cancelled: "Cancelada",
};

const resolveStatusLabel = (status: string): string => {
  return statusLabels[status] ?? status;
};

const resolveBillStatusTone = (
  status: string,
): "default" | "primary" | "danger" => {
  if (status === "overdue") {
    return "danger";
  }
  if (status === "open" || status === "paid") {
    return "primary";
  }
  return "default";
};

function Header({
  controller,
}: {
  readonly controller: CreditCardBillScreenController;
}): ReactElement {
  const title = controller.creditCard?.name ?? "Fatura do cartao";
  const subtitle = controller.cycleLabel ?? controller.selectedMonthLabel;

  return (
    <XStack justifyContent="space-between" alignItems="center" gap="$3">
      <YStack flex={1} gap="$1">
        <Paragraph color="$color" fontFamily="$heading" fontSize="$7">
          {title}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {subtitle}
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={controller.handleBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

function MonthPicker({
  controller,
}: {
  readonly controller: CreditCardBillScreenController;
}): ReactElement {
  return (
    <AppSurfaceCard>
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <AppButton tone="secondary" onPress={controller.handlePreviousMonth}>
          Anterior
        </AppButton>
        <YStack flex={1} alignItems="center" gap="$1">
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            Mes aberto
          </Paragraph>
          <Paragraph color="$color" fontFamily="$heading" fontSize="$5">
            {controller.selectedMonthLabel}
          </Paragraph>
        </YStack>
        <AppButton tone="secondary" onPress={controller.handleNextMonth}>
          Proximo
        </AppButton>
      </XStack>
    </AppSurfaceCard>
  );
}

function BillSummaryCard({
  bill,
}: {
  readonly bill: CreditCardBillRecord;
}): ReactElement {
  return (
    <YStack gap="$3">
      <XStack gap="$3" flexWrap="wrap">
        <AppMetricCard label="Total" value={formatCurrency(bill.totalAmount)} />
        <AppMetricCard
          label="Pago"
          value={formatCurrency(bill.paidAmount)}
          tone="primary"
        />
        <AppMetricCard
          label="Pendente"
          value={formatCurrency(bill.pendingAmount)}
          tone={bill.pendingAmount > 0 ? "danger" : "default"}
        />
      </XStack>
      <AppSurfaceCard>
        <XStack alignItems="center" justifyContent="space-between" gap="$3">
          <YStack flex={1} gap="$1">
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              Status da fatura
            </Paragraph>
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              Vencimento {formatCreditCardBillDate(bill.cycle.dueDate)}
            </Paragraph>
          </YStack>
          <AppBadge tone={resolveBillStatusTone(bill.cycle.status)}>
            {resolveStatusLabel(bill.cycle.status)}
          </AppBadge>
        </XStack>
      </AppSurfaceCard>
    </YStack>
  );
}

function TransactionRow({
  transaction,
}: {
  readonly transaction: CreditCardBillTransaction;
}): ReactElement {
  return (
    <AppKeyValueRow
      label={transaction.title}
      helperText={resolveStatusLabel(transaction.status)}
      value={
        <YStack alignItems="flex-end" gap="$1">
          <Paragraph color="$color" fontFamily="$body" fontSize="$4">
            {formatCurrency(transaction.amount)}
          </Paragraph>
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            {transaction.type}
          </Paragraph>
        </YStack>
      }
    />
  );
}

function TransactionGroup({
  group,
}: {
  readonly group: CreditCardBillTransactionGroup;
}): ReactElement {
  return (
    <YStack gap="$2" marginBottom="$3">
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        {group.label}
      </Paragraph>
      <YStack gap="$2">
        {group.transactions.map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </YStack>
    </YStack>
  );
}

function TransactionsCard({
  groups,
}: {
  readonly groups: readonly CreditCardBillTransactionGroup[];
}): ReactElement {
  return (
    <YStack gap="$3">
      <AppSectionHeader
        title="Lancamentos da fatura"
        description="Transacoes agrupadas por data de vencimento."
      />
      <FlatList
        data={groups}
        keyExtractor={(item) => item.key}
        scrollEnabled={false}
        renderItem={({ item }) => <TransactionGroup group={item} />}
        ListEmptyComponent={
          <AppEmptyState
            illustration="transactions"
            title="Nenhum lancamento nesta fatura"
            description="Transacoes deste cartao aparecerao aqui quando existirem no ciclo."
          />
        }
      />
    </YStack>
  );
}

export function CreditCardBillScreen(): ReactElement {
  const controller = useCreditCardBillScreenController();

  return (
    <AppScreen testID="credit-card-bill-screen">
      <Header controller={controller} />
      <MonthPicker controller={controller} />
      <AppQueryState
        query={controller.billQuery}
        options={{
          loading: {
            title: "Carregando fatura",
            description: "Calculando ciclo e lancamentos do cartao.",
          },
          empty: {
            title: "Fatura sem dados",
            description: "Nao encontramos dados para este mes.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar a fatura",
            fallbackDescription: "Confira o cartao ou tente outro mes.",
          },
          isEmpty: () => false,
        }}
      >
        {(bill) => (
          <YStack gap="$4">
            <BillSummaryCard bill={bill} />
            <TransactionsCard groups={controller.groupedTransactions} />
          </YStack>
        )}
      </AppQueryState>
    </AppScreen>
  );
}
