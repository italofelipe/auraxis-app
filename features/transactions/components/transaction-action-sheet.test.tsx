import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { TransactionActionSheet } from "@/features/transactions/components/transaction-action-sheet";
import type { TransactionViewModel } from "@/features/transactions/hooks/use-transactions-screen-controller";

const buildTx = (
  overrides: Partial<TransactionViewModel> = {},
): TransactionViewModel => ({
  id: "tx-1",
  title: "Internet",
  amount: "120.00",
  type: "expense",
  dueDate: "2026-06-10",
  status: "pending",
  description: "Vivo Fibra",
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  installmentGroupId: null,
  installmentNumber: null,
  ...overrides,
});

const noop = (): void => {};

const renderSheet = (
  tx: TransactionViewModel | null,
  overrides: Partial<Parameters<typeof TransactionActionSheet>[0]> = {},
) =>
  render(
    <AppProviders>
      <TransactionActionSheet
        transaction={tx}
        isPaying={false}
        isDuplicating={false}
        isDeleting={false}
        onClose={noop}
        onMarkPaid={noop}
        onEdit={noop}
        onDuplicate={noop}
        onDelete={noop}
        onShowInstallmentGroup={noop}
        {...overrides}
      />
    </AppProviders>,
  );

describe("TransactionActionSheet", () => {
  it("mostra Pagar para transacao nao paga e dispara onMarkPaid", () => {
    const onMarkPaid = jest.fn();
    const { getByTestId } = renderSheet(buildTx(), { onMarkPaid });

    fireEvent.press(getByTestId("action-mark-paid"));

    expect(onMarkPaid).toHaveBeenCalledWith("tx-1");
  });

  it("oculta Pagar quando a transacao ja esta paga", () => {
    const { queryByTestId } = renderSheet(buildTx({ status: "paid" }));

    expect(queryByTestId("action-mark-paid")).toBeNull();
  });

  it("dispara onDelete ao tocar em Excluir", () => {
    const onDelete = jest.fn();
    const { getByTestId } = renderSheet(buildTx(), { onDelete });

    fireEvent.press(getByTestId("action-delete"));

    expect(onDelete).toHaveBeenCalledWith("tx-1");
  });

  it("mostra descricao e observacoes como detalhes separados", () => {
    const { getByText } = renderSheet(
      buildTx({
        description: "Vivo Fibra",
        observation: "Renovar desconto",
      } as Partial<TransactionViewModel>),
    );

    expect(getByText("Vivo Fibra")).toBeTruthy();
    expect(getByText("Observações")).toBeTruthy();
    expect(getByText("Renovar desconto")).toBeTruthy();
  });
});
