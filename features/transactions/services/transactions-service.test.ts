import type { AxiosInstance } from "axios";

import type {
  CreateTransactionCommand,
  TransactionCollection,
  TransactionSummary,
  UpdateTransactionCommand,
} from "@/features/transactions/contracts";
import { createTransactionsService } from "@/features/transactions/services/transactions-service";

const createClient = (): jest.Mocked<
  Pick<AxiosInstance, "get" | "post" | "put" | "delete" | "patch">
> => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  };
};

const buildTransactionPayload = (overrides: Record<string, unknown> = {}) => ({
  id: "tx-1",
  title: "Almoco",
  amount: "50.00",
  type: "expense",
  due_date: "2026-04-10",
  start_date: null,
  end_date: null,
  description: null,
  observation: null,
  is_recurring: false,
  is_installment: false,
  installment_count: null,
  tag_id: null,
  account_id: null,
  credit_card_id: null,
  status: "paid",
  currency: "BRL",
  source: "manual",
  external_id: null,
  bank_name: null,
  installment_group_id: null,
  paid_at: null,
  created_at: null,
  updated_at: null,
  ...overrides,
});

describe("transactionsService", () => {
  it("lista transacoes e normaliza paginacao", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          transactions: [
            {
              id: "txn-1",
              title: "Salario",
              amount: "5000.00",
              type: "income",
              due_date: "2026-04-05",
              start_date: null,
              end_date: null,
              description: null,
              observation: null,
              is_recurring: false,
              is_installment: false,
              installment_count: null,
              tag_id: null,
              account_id: "acc-1",
              credit_card_id: null,
              status: "paid",
              currency: "BRL",
              source: "manual",
              external_id: null,
              bank_name: null,
              installment_group_id: null,
              paid_at: "2026-04-05",
              created_at: "2026-04-01T10:00:00",
              updated_at: "2026-04-01T10:00:00",
            },
          ],
        },
        meta: {
          pagination: {
            total: 12,
            page: 2,
            per_page: 10,
            pages: 2,
            has_next_page: false,
          },
        },
      },
    });

    const service = createTransactionsService(client as unknown as AxiosInstance);
    const result = await service.listTransactions({
      page: 2,
      perPage: 10,
      status: "paid",
    });

    expect(client.get).toHaveBeenCalledWith("/transactions", {
      params: {
        page: 2,
        per_page: 10,
        type: undefined,
        status: "paid",
        start_date: undefined,
        end_date: undefined,
        tag_id: undefined,
        account_id: undefined,
        credit_card_id: undefined,
      },
    });
    expect(result).toEqual<TransactionCollection>({
      transactions: [
        expect.objectContaining({
          id: "txn-1",
          dueDate: "2026-04-05",
          accountId: "acc-1",
          isRecurring: false,
        }),
      ],
      pagination: {
        total: 12,
        page: 2,
        perPage: 10,
        pages: 2,
        hasNextPage: false,
      },
    });
  });

  it("obtem detalhe de transacao", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          transaction: {
            id: "txn-2",
            title: "Internet",
            amount: "99.90",
            type: "expense",
            due_date: "2026-04-10",
            start_date: null,
            end_date: null,
            description: "Fibra",
            observation: "Plano anual",
            is_recurring: true,
            is_installment: false,
            installment_count: null,
            tag_id: "tag-1",
            account_id: null,
            credit_card_id: null,
            status: "pending",
            currency: "BRL",
            source: "manual",
            external_id: null,
            bank_name: null,
            installment_group_id: null,
            paid_at: null,
            created_at: null,
            updated_at: null,
          },
        },
      },
    });

    const service = createTransactionsService(client as unknown as AxiosInstance);
    const result = await service.getTransaction("txn-2");

    expect(client.get).toHaveBeenCalledWith("/transactions/txn-2");
    expect(result).toEqual(
      expect.objectContaining({
        id: "txn-2",
        description: "Fibra",
        observation: "Plano anual",
        tagId: "tag-1",
      }),
    );
  });
});

describe("transactionsService - mutations", () => {
  it("cria e atualiza transacoes usando os dois formatos de resposta do backend", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: {
        data: {
          transaction: {
            id: "txn-3",
            title: "Cartao",
            amount: "450.50",
            type: "expense",
            due_date: "2026-04-12",
            start_date: null,
            end_date: null,
            description: null,
            observation: null,
            is_recurring: false,
            is_installment: true,
            installment_count: 3,
            tag_id: null,
            account_id: null,
            credit_card_id: "cc-1",
            status: "pending",
            currency: "BRL",
            source: "manual",
            external_id: null,
            bank_name: null,
            installment_group_id: "grp-1",
            paid_at: null,
            created_at: null,
            updated_at: null,
          },
        },
      },
    });
    client.put.mockResolvedValue({
      data: {
        data: {
          transactions: [
            {
              id: "txn-3",
              title: "Cartao atualizado",
              amount: "450.50",
              type: "expense",
              due_date: "2026-04-12",
              start_date: null,
              end_date: null,
              description: null,
              observation: "parcela 1/3",
              is_recurring: false,
              is_installment: true,
              installment_count: 3,
              tag_id: null,
              account_id: null,
              credit_card_id: "cc-1",
              status: "pending",
              currency: "BRL",
              source: "manual",
              external_id: null,
              bank_name: null,
              installment_group_id: "grp-1",
              paid_at: null,
              created_at: null,
              updated_at: null,
            },
          ],
        },
      },
    });

    const createCommand: CreateTransactionCommand = {
      title: "Cartao",
      amount: "450.50",
      type: "expense",
      dueDate: "2026-04-12",
      isInstallment: true,
      installmentCount: 3,
      creditCardId: "cc-1",
    };
    const updateCommand: UpdateTransactionCommand = {
      title: "Cartao atualizado",
      observation: "parcela 1/3",
    };

    const service = createTransactionsService(client as unknown as AxiosInstance);
    const created = await service.createTransaction(createCommand);
    const updated = await service.updateTransaction("txn-3", updateCommand);

    expect(client.post).toHaveBeenCalledWith("/transactions", {
      title: "Cartao",
      amount: "450.50",
      type: "expense",
      due_date: "2026-04-12",
      start_date: undefined,
      end_date: undefined,
      description: undefined,
      observation: undefined,
      is_recurring: undefined,
      is_installment: true,
      installment_count: 3,
      tag_id: undefined,
      account_id: undefined,
      credit_card_id: "cc-1",
      status: undefined,
      currency: undefined,
      source: undefined,
      external_id: undefined,
      bank_name: undefined,
      paid_at: undefined,
    });
    expect(created).toEqual(expect.objectContaining({ id: "txn-3", creditCardId: "cc-1" }));
    expect(updated).toEqual(
      expect.objectContaining({
        title: "Cartao atualizado",
        observation: "parcela 1/3",
      }),
    );
  });
});

describe("transactionsService - pagination + summary", () => {
  it("usa os fallbacks de paginacao quando meta ou pagination nao existem", async () => {
    const client = createClient();
    client.get
      .mockResolvedValueOnce({
        data: {
          data: {
            transactions: [],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            month: "2026-05",
            income_total: "0.00",
            expense_total: "0.00",
            items: [],
          },
          meta: {},
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            month: "2026-06",
            income_total: "10.00",
            expense_total: "5.00",
            items: [],
          },
          meta: {
            pagination: {
              total: 0,
              page: 1,
              per_page: 10,
              pages: null,
            },
          },
        },
      });

    const service = createTransactionsService(client as unknown as AxiosInstance);
    const list = await service.listTransactions();
    const summaryWithoutPagination = await service.getSummary({ month: "2026-05" });
    const summaryWithNullablePagination = await service.getSummary({ month: "2026-06" });

    expect(list.pagination).toEqual({
      total: 0,
      page: 1,
      perPage: 10,
      pages: 0,
      hasNextPage: false,
    });
    expect(summaryWithoutPagination.pagination).toEqual({
      total: 0,
      page: 1,
      perPage: 10,
      pages: 0,
      hasNextPage: false,
    });
    expect(summaryWithNullablePagination.pagination).toEqual({
      total: 0,
      page: 1,
      perPage: 10,
      pages: null,
      hasNextPage: null,
    });
  });

  it("remove transacao e carrega resumo mensal", async () => {
    const client = createClient();
    client.delete.mockResolvedValue({ data: {} });
    client.get.mockResolvedValueOnce({
      data: {
        data: {
          month: "2026-04",
          income_total: "5000.00",
          expense_total: "1200.00",
          items: [],
        },
        meta: {
          pagination: {
            total: 0,
            page: 1,
            per_page: 10,
            pages: 0,
            has_next_page: false,
          },
        },
      },
    });

    const service = createTransactionsService(client as unknown as AxiosInstance);
    await service.deleteTransaction("txn-7");
    const summary = await service.getSummary({ month: "2026-04", perPage: 10 });

    expect(client.delete).toHaveBeenCalledWith("/transactions/txn-7");
    expect(client.get).toHaveBeenCalledWith("/transactions/summary", {
      params: {
        month: "2026-04",
        page: undefined,
        per_page: 10,
      },
    });
    expect(summary).toEqual<TransactionSummary>({
      month: "2026-04",
      incomeTotal: "5000.00",
      expenseTotal: "1200.00",
      items: [],
      pagination: {
        total: 0,
        page: 1,
        perPage: 10,
        pages: 0,
        hasNextPage: false,
      },
    });
  });
});

describe("transactionsService - error paths and trash", () => {
  it("falha quando o backend retorna mutacao sem payload de transacao", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: {
        data: {},
      },
    });

    const service = createTransactionsService(client as unknown as AxiosInstance);

    await expect(
      service.createTransaction({
        title: "Sem payload",
        amount: "1.00",
        type: "expense",
        dueDate: "2026-04-30",
      }),
    ).rejects.toThrow("Transaction mutation response without transaction payload.");
  });

  it("listDeleted retorna lista mapeada com deletedAt", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          transactions: [
            buildTransactionPayload({ id: "tx-9", deleted_at: "2026-04-12" }),
          ],
        },
      },
    });

    const service = createTransactionsService(client as unknown as AxiosInstance);
    const result = await service.listDeleted();

    expect(client.get).toHaveBeenCalledWith("/transactions/deleted");
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].deletedAt).toBe("2026-04-12");
    expect(result.transactions[0].id).toBe("tx-9");
  });

  it("listDeleted retorna lista vazia quando envelope vem sem dados", async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: { data: {} } });

    const service = createTransactionsService(client as unknown as AxiosInstance);
    const result = await service.listDeleted();
    expect(result.transactions).toEqual([]);
  });

  it("restoreTransaction faz PATCH e mapeia o payload", async () => {
    const client = createClient();
    client.patch.mockResolvedValue({
      data: { data: { transaction: buildTransactionPayload({ id: "tx-1" }) } },
    });

    const service = createTransactionsService(client as unknown as AxiosInstance);
    const result = await service.restoreTransaction("tx-1");

    expect(client.patch).toHaveBeenCalledWith(
      "/transactions/restore/tx-1",
    );
    expect(result.id).toBe("tx-1");
  });

  it("restoreTransaction lanca erro quando payload nao volta", async () => {
    const client = createClient();
    client.patch.mockResolvedValue({ data: { data: {} } });

    const service = createTransactionsService(client as unknown as AxiosInstance);
    await expect(service.restoreTransaction("tx-2")).rejects.toThrow(
      "Transacao restaurada veio sem payload.",
    );
  });
});
