import { useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { WalletOperationForm } from "@/features/wallet/components/wallet-operation-form";
import type {
  WalletOperation,
  WalletOperationsPosition,
} from "@/features/wallet/contracts";
import {
  useWalletOperationsScreenController,
  type WalletOperationsScreenController,
} from "@/features/wallet/hooks/use-wallet-operations-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

const resolveStringParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR");
};

/**
 * Canonical wallet operations screen for a single wallet entry.
 *
 * @returns List of operations + position card or active create form.
 */
export function WalletOperationsScreen(): ReactElement {
  const params = useLocalSearchParams<{ entryId?: string | string[] }>();
  const entryId = resolveStringParam(params.entryId);

  if (!entryId) {
    return <MissingEntryIdScreen />;
  }
  return <WalletOperationsContent entryId={entryId} />;
}

function MissingEntryIdScreen(): ReactElement {
  return (
    <AppScreen>
      <AppSurfaceCard
        title="Operacao nao encontrada"
        description="Volte para a carteira e selecione um ativo para ver suas operacoes."
      >
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          O parametro entryId esta ausente no link.
        </Paragraph>
      </AppSurfaceCard>
    </AppScreen>
  );
}

function WalletOperationsContent({
  entryId,
}: {
  readonly entryId: string;
}): ReactElement {
  const controller = useWalletOperationsScreenController(entryId);

  if (controller.formMode === "create") {
    return (
      <AppScreen>
        <WalletOperationForm
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
      <PositionCard controller={controller} />
      <OperationsListCard controller={controller} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: WalletOperationsScreenController;
}

function PositionCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Posicao"
      description="Resumo consolidado das operacoes do ativo."
    >
      <YStack gap="$3">
        <AppQueryState
          query={controller.positionQuery}
          options={{
            loading: {
              title: "Carregando posicao",
              description: "Calculando posicao consolidada.",
            },
            empty: {
              title: "Sem posicao calculada",
              description: "Adicione operacoes para ver a posicao.",
            },
            error: {
              fallbackTitle: "Nao foi possivel calcular a posicao",
              fallbackDescription: "Tente novamente em instantes.",
            },
          }}
        >
          {(position) => <PositionRows position={position} />}
        </AppQueryState>
        <XStack gap="$2" flexWrap="wrap">
          <AppButton onPress={controller.handleOpenCreate}>Nova operacao</AppButton>
          <AppButton tone="secondary" onPress={controller.handleBackToWallet}>
            Voltar para carteira
          </AppButton>
        </XStack>
      </YStack>
    </AppSurfaceCard>
  );
}

function PositionRows({
  position,
}: {
  readonly position: WalletOperationsPosition;
}): ReactElement {
  return (
    <YStack gap="$2">
      <AppKeyValueRow label="Quantidade atual" value={position.currentQuantity.toString()} />
      <AppKeyValueRow label="Preco medio" value={formatCurrency(position.averagePrice)} />
      <AppKeyValueRow label="Valor investido" value={formatCurrency(position.investedAmount)} />
      <AppKeyValueRow label="Lucro realizado" value={formatCurrency(position.realizedProfit)} />
    </YStack>
  );
}

function OperationsListCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Operacoes"
      description="Compras e vendas registradas para este ativo."
    >
      <AppQueryState
        query={controller.operationsQuery}
        options={{
          loading: {
            title: "Carregando operacoes",
            description: "Buscando operacoes registradas.",
          },
          empty: {
            title: "Nenhuma operacao registrada",
            description: "Use o botao acima para adicionar a primeira.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar a lista",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: (data) => data.operations.length === 0,
        }}
      >
        {() => (
          <YStack gap="$3">
            {controller.operations.map((operation) => (
              <OperationRow
                key={operation.id}
                operation={operation}
                isDeleting={controller.deletingOperationId === operation.id}
                onDelete={() => {
                  void controller.handleDelete(operation.id);
                }}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface OperationRowProps {
  readonly operation: WalletOperation;
  readonly isDeleting: boolean;
  readonly onDelete: () => void;
}

function OperationRow({
  operation,
  isDeleting,
  onDelete,
}: OperationRowProps): ReactElement {
  const tone = operation.kind === "buy" ? "primary" : "danger";
  const sign = operation.kind === "buy" ? "+" : "-";
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={`${operation.kind === "buy" ? "Compra" : "Venda"} · ${operation.quantity}`}
        value={
          <YStack alignItems="flex-end" gap="$1">
            <Paragraph
              color={tone === "primary" ? "$success" : "$danger"}
              fontFamily="$body"
              fontSize="$4"
            >
              {sign}
              {formatCurrency(operation.totalValue)}
            </Paragraph>
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              {formatDate(operation.executedAt)}
            </Paragraph>
            <AppBadge tone={tone}>
              {formatCurrency(operation.unitPrice)} / un.
            </AppBadge>
          </YStack>
        }
      />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton tone="secondary" onPress={onDelete} disabled={isDeleting}>
          {isDeleting ? "Excluindo..." : "Excluir"}
        </AppButton>
      </XStack>
    </YStack>
  );
}
