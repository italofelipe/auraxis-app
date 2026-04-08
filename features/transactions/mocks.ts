import type {
  TransactionCollection,
  TransactionRecord,
  TransactionSummary,
} from "@/features/transactions/contracts";

export const transactionFixture: TransactionRecord = {
  id: "tx-1",
  title: "Salário",
  amount: "8200.00",
  type: "income",
  dueDate: "2026-04-05",
  startDate: null,
  endDate: null,
  description: "Recebimento mensal",
  observation: null,
  isRecurring: true,
  isInstallment: false,
  installmentCount: null,
  tagId: null,
  accountId: "account-1",
  creditCardId: null,
  status: "paid",
  currency: "BRL",
  source: "manual",
  externalId: null,
  bankName: null,
  installmentGroupId: null,
  paidAt: "2026-04-05T10:00:00Z",
  createdAt: "2026-04-05T10:00:00Z",
  updatedAt: "2026-04-05T10:00:00Z",
};

export const transactionCollectionFixture: TransactionCollection = {
  transactions: [
    transactionFixture,
    {
      ...transactionFixture,
      id: "tx-2",
      title: "Aluguel",
      amount: "2300.00",
      type: "expense",
      status: "pending",
      dueDate: "2026-04-10",
      paidAt: null,
    },
  ],
  pagination: {
    total: 2,
    page: 1,
    perPage: 10,
    pages: 1,
    hasNextPage: false,
  },
};

export const transactionSummaryFixture: TransactionSummary = {
  month: "2026-04",
  incomeTotal: "8200.00",
  expenseTotal: "2300.00",
  items: transactionCollectionFixture.transactions,
  pagination: {
    total: 2,
    page: 1,
    perPage: 10,
    pages: 1,
    hasNextPage: false,
  },
};
