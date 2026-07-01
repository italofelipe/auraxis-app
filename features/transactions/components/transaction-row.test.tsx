/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { TransactionRow } from "@/features/transactions/components/transaction-row";
import type { TransactionViewModel } from "@/features/transactions/hooks/use-transactions-screen-controller";

// Mocka o ReanimatedSwipeable: renderiza as right actions (com um `close`
// stub) ao lado dos children, para exercitar Pagar/Excluir e o tap no teste.
jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
  const ReactInner = require("react");
  const { View } = require("react-native");
  const Swipeable = ({
    children,
    renderRightActions,
  }: {
    readonly children: React.ReactNode;
    readonly renderRightActions?: (
      progress: unknown,
      translation: unknown,
      methods: { close: () => void },
    ) => React.ReactNode;
  }): React.ReactNode =>
    ReactInner.createElement(
      View,
      null,
      renderRightActions
        ? renderRightActions({ value: 0 }, { value: 0 }, { close: () => undefined })
        : null,
      children,
    );
  return { __esModule: true, default: Swipeable };
});

const buildTx = (
  overrides: Partial<TransactionViewModel> = {},
): TransactionViewModel => ({
  id: "tx-1",
  title: "Internet",
  amount: "120.00",
  type: "expense",
  dueDate: "2026-06-10",
  status: "pending",
  description: null,
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  installmentGroupId: null,
  installmentNumber: null,
  ...overrides,
});

const noop = (): void => {};

describe("TransactionRow", () => {
  it("abre o action sheet ao tocar na linha", () => {
    const onOpenActions = jest.fn();
    const { getByTestId } = render(
      <AppProviders>
        <TransactionRow
          tx={buildTx()}
          onOpenActions={onOpenActions}
          onMarkPaid={noop}
          onDelete={noop}
        />
      </AppProviders>,
    );

    fireEvent.press(getByTestId("transaction-row-tx-1"));

    expect(onOpenActions).toHaveBeenCalledTimes(1);
  });

  it("revela Pagar e Excluir no swipe e dispara os callbacks", () => {
    const onMarkPaid = jest.fn();
    const onDelete = jest.fn();
    const { getByLabelText } = render(
      <AppProviders>
        <TransactionRow
          tx={buildTx()}
          onOpenActions={noop}
          onMarkPaid={onMarkPaid}
          onDelete={onDelete}
        />
      </AppProviders>,
    );

    fireEvent.press(getByLabelText("Pagar Internet"));
    expect(onMarkPaid).toHaveBeenCalledWith("tx-1");

    fireEvent.press(getByLabelText("Excluir Internet"));
    expect(onDelete).toHaveBeenCalledWith("tx-1");
  });

  it("nao oferece Pagar quando a transacao ja esta paga", () => {
    const { queryByLabelText } = render(
      <AppProviders>
        <TransactionRow
          tx={buildTx({ status: "paid" })}
          onOpenActions={noop}
          onMarkPaid={noop}
          onDelete={noop}
        />
      </AppProviders>,
    );

    expect(queryByLabelText("Pagar Internet")).toBeNull();
  });
});
