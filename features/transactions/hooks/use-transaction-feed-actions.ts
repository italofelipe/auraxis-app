import { useCallback, useMemo, useState } from "react";

import type {
  DeleteTarget,
  MarkPaidTarget,
} from "@/features/transactions/components/transaction-action-modals";
import type { TransactionsFeedController } from "@/features/transactions/hooks/use-transactions-feed-controller";
import type { TransactionViewModel } from "@/features/transactions/hooks/use-transactions-screen-controller";

/** Handlers de ação por id passados aos cards do feed. */
export interface FeedItemActionHandlers {
  /** Abre o action sheet do item. */
  readonly openActions: (id: string) => void;
  /** Solicita confirmação de pagamento do item. */
  readonly requestPay: (id: string) => void;
  /** Solicita confirmação de exclusão do item. */
  readonly requestDelete: (id: string) => void;
}

/** Estado + handlers das ações do feed (action sheet e modais). */
export interface TransactionFeedActions {
  /** Transação ativa no action sheet (ou null). */
  readonly actionTarget: TransactionViewModel | null;
  /** Alvo do modal de "marcar como pago" (ou null). */
  readonly payTarget: MarkPaidTarget | null;
  /** Alvo do modal de exclusão (ou null). */
  readonly deleteTarget: DeleteTarget | null;
  /** Handlers por id passados aos cards. */
  readonly handlers: FeedItemActionHandlers;
  /** Fecha o action sheet. */
  readonly closeActions: () => void;
  /** Abre o form de edição do item. */
  readonly handleEdit: (id: string) => void;
  /** Duplica o item. */
  readonly handleDuplicate: (id: string) => void;
  /** Aplica o filtro de "mesma compra" (grupo de parcelas). */
  readonly handleShowInstallmentGroup: (installmentGroupId: string) => void;
  /** Fecha o modal de pagamento. */
  readonly closePay: () => void;
  /** Fecha o modal de exclusão. */
  readonly closeDelete: () => void;
}

/**
 * Concentra o estado e os handlers das ações do feed de transações (abrir o
 * action sheet, pagar, editar, duplicar, excluir e ver parcelas), delegando as
 * mutações para o controller. Mantém o componente do feed enxuto e a lógica
 * testável fora da árvore de UI.
 *
 * @param controller Controller do feed.
 * @returns Estado dos alvos + handlers das ações.
 */
// eslint-disable-next-line max-lines-per-function -- agregador de ~10 handlers/estados de ação
export function useTransactionFeedActions(
  controller: TransactionsFeedController,
): TransactionFeedActions {
  const [actionTarget, setActionTarget] = useState<TransactionViewModel | null>(null);
  const [payTarget, setPayTarget] = useState<MarkPaidTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const findViewModel = useCallback(
    (id: string): TransactionViewModel | null =>
      controller.transactions.find((tx) => tx.id === id) ?? null,
    [controller.transactions],
  );

  const openActions = useCallback(
    (id: string): void => {
      const vm = findViewModel(id);
      if (vm) {
        setActionTarget(vm);
      }
    },
    [findViewModel],
  );

  const requestPay = useCallback(
    (id: string): void => {
      const vm = findViewModel(id);
      if (vm) {
        setActionTarget(null);
        setPayTarget({ id: vm.id, title: vm.title });
      }
    },
    [findViewModel],
  );

  const requestDelete = useCallback(
    (id: string): void => {
      const vm = findViewModel(id);
      if (vm) {
        setActionTarget(null);
        setDeleteTarget({
          id: vm.id,
          title: vm.title,
          isSeries: vm.isRecurring || vm.isInstallment,
        });
      }
    },
    [findViewModel],
  );

  const handleEdit = useCallback(
    (id: string): void => {
      const record = controller.transactionsQuery.data?.transactions.find(
        (tx) => tx.id === id,
      );
      if (record) {
        setActionTarget(null);
        controller.handleOpenEdit(record);
      }
    },
    [controller],
  );

  const handleDuplicate = useCallback(
    (id: string): void => {
      setActionTarget(null);
      void controller.handleDuplicate(id);
    },
    [controller],
  );

  const handleShowInstallmentGroup = useCallback(
    (installmentGroupId: string): void => {
      setActionTarget(null);
      controller.handleShowInstallmentGroup(installmentGroupId);
    },
    [controller],
  );

  const handlers = useMemo<FeedItemActionHandlers>(
    () => ({ openActions, requestPay, requestDelete }),
    [openActions, requestPay, requestDelete],
  );

  return {
    actionTarget,
    payTarget,
    deleteTarget,
    handlers,
    closeActions: () => setActionTarget(null),
    handleEdit,
    handleDuplicate,
    handleShowInstallmentGroup,
    closePay: () => setPayTarget(null),
    closeDelete: () => setDeleteTarget(null),
  };
}
