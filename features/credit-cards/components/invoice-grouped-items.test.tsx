import { fireEvent, render } from "@testing-library/react-native";

import { InvoiceGroupedItems } from "@/features/credit-cards/components/invoice-grouped-items";
import type { CategoryGroup } from "@/features/credit-cards/model/credit-card-aggregation";
import type { EnrichedTransaction } from "@/features/credit-cards/model/card-transactions";
import type { TransactionRecord } from "@/features/transactions/contracts";
import { TestProviders } from "@/shared/testing/test-providers";

const buildTransaction = (
  override: Partial<TransactionRecord> = {},
): TransactionRecord => ({
  id: "tx-1",
  title: "Mercado",
  amount: "120.50",
  type: "expense",
  dueDate: "2026-06-20",
  startDate: null,
  endDate: null,
  description: null,
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  recurrenceInterval: 1,
  recurrenceUnit: "month",
  tagId: "tag-food",
  accountId: null,
  creditCardId: "cc-1",
  status: "pending",
  currency: "BRL",
  source: "manual",
  externalId: null,
  bankName: null,
  installmentGroupId: null,
  paidAt: null,
  createdAt: null,
  updatedAt: null,
  ...override,
});

const buildItem = (
  override: Partial<EnrichedTransaction> = {},
): EnrichedTransaction => {
  const transaction = buildTransaction({
    id: override.id ?? "tx-1",
    title: override.title ?? "Mercado",
  });
  return {
    id: transaction.id,
    title: transaction.title,
    amount: 120.5,
    purchaseDate: "2026-06-20",
    tagId: "tag-food",
    creditCardId: "cc-1",
    billMonth: "2026-06",
    isInstallment: false,
    installmentCount: null,
    installmentGroupId: null,
    status: "pending",
    transaction,
    ...override,
  };
};

const buildGroup = (items: readonly EnrichedTransaction[]): CategoryGroup => ({
  tagId: "tag-food",
  name: "Alimentação",
  color: "#11A36B",
  total: 120.5,
  count: items.length,
  items,
});

const renderItems = (
  groups: readonly CategoryGroup[],
  handlers = {
    onEditExpense: jest.fn(),
    onDuplicateExpense: jest.fn(),
    onRequestDeleteExpense: jest.fn(),
  },
) =>
  render(
    <TestProviders>
      <InvoiceGroupedItems groups={groups} {...handlers} />
    </TestProviders>,
  );

describe("InvoiceGroupedItems", () => {
  it("renderiza estado vazio", () => {
    const { getByText } = renderItems([]);

    expect(getByText("Sem lançamentos nesta fatura.")).toBeTruthy();
  });

  it("renderiza chip de vínculo e ações por lançamento", () => {
    const item = buildItem();
    const { getByText, getByTestId } = renderItems([buildGroup([item])]);

    expect(getByText("Também em Transações")).toBeTruthy();
    expect(getByTestId("invoice-item-open-tx-1")).toBeTruthy();
    expect(getByTestId("invoice-item-edit-tx-1")).toBeTruthy();
    expect(getByTestId("invoice-item-duplicate-tx-1")).toBeTruthy();
    expect(getByTestId("invoice-item-delete-tx-1")).toBeTruthy();
  });

  it("dispara editar, duplicar e remover com a transação enriquecida", () => {
    const item = buildItem();
    const handlers = {
      onEditExpense: jest.fn(),
      onDuplicateExpense: jest.fn(),
      onRequestDeleteExpense: jest.fn(),
    };
    const { getByTestId } = renderItems([buildGroup([item])], handlers);

    fireEvent.press(getByTestId("invoice-item-open-tx-1"));
    fireEvent.press(getByTestId("invoice-item-duplicate-tx-1"));
    fireEvent.press(getByTestId("invoice-item-delete-tx-1"));

    expect(handlers.onEditExpense).toHaveBeenCalledWith(item);
    expect(handlers.onDuplicateExpense).toHaveBeenCalledWith(item);
    expect(handlers.onRequestDeleteExpense).toHaveBeenCalledWith(item);
  });
});
