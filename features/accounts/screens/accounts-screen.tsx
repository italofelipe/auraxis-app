import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { AccountForm } from "@/features/accounts/components/account-form";
import type { Account, AccountType } from "@/features/accounts/contracts";
import {
  useAccountsScreenController,
  type AccountsScreenController,
} from "@/features/accounts/hooks/use-accounts-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

const ACCOUNT_TYPE_LABEL: Readonly<Record<AccountType, string>> = {
  checking: "Corrente",
  savings: "Poupanca",
  investment: "Investimento",
  wallet: "Carteira",
  other: "Outro",
};

export function AccountsScreen(): ReactElement {
  const controller = useAccountsScreenController();

  if (controller.formMode.kind !== "closed") {
    return (
      <AppScreen>
        <AccountForm
          initialAccount={
            controller.formMode.kind === "edit"
              ? controller.formMode.account
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
      <AccountsListCard controller={controller} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: AccountsScreenController;
}

function SummaryCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Contas"
      description="Contas correntes, poupanca e carteiras."
    >
      <YStack gap="$3">
        <AppButton onPress={controller.handleOpenCreate}>Nova conta</AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function AccountsListCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Lista de contas"
      description="Contas registradas para o usuario."
    >
      <AppQueryState
        query={controller.accountsQuery}
        options={{
          loading: {
            title: "Carregando contas",
            description: "Buscando contas registradas.",
          },
          empty: {
            title: "Nenhuma conta registrada",
            description: "Crie a primeira conta para registrar movimentacoes.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar as contas",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.accounts.length === 0,
        }}
      >
        {() => (
          <YStack gap="$3">
            {controller.accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                isDeleting={controller.deletingAccountId === account.id}
                onEdit={() => controller.handleOpenEdit(account)}
                onDelete={() => {
                  void controller.handleDelete(account.id);
                }}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface AccountRowProps {
  readonly account: Account;
  readonly isDeleting: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

function AccountRow({
  account,
  isDeleting,
  onEdit,
  onDelete,
}: AccountRowProps): ReactElement {
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={`${account.name} · ${ACCOUNT_TYPE_LABEL[account.accountType]}`}
        value={
          <YStack alignItems="flex-end" gap="$1">
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              {formatCurrency(account.initialBalance)}
            </Paragraph>
            {account.institution ? (
              <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                {account.institution}
              </Paragraph>
            ) : null}
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
