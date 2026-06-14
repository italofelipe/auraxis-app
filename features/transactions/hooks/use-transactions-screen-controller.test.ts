import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useMarkTransactionPaidMutation,
  useUpdateTransactionMutation,
} from "@/features/transactions/hooks/use-transaction-mutations";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import { useTransactionsScreenController } from "@/features/transactions/hooks/use-transactions-screen-controller";
import type { CreateTransactionFormValues } from "@/features/transactions/validators";

jest.mock("@/features/transactions/hooks/use-transactions-query", () => ({
  useTransactionsQuery: jest.fn(),
}));
jest.mock("@/features/transactions/hooks/use-transaction-mutations", () => ({
  useCreateTransactionMutation: jest.fn(),
  useUpdateTransactionMutation: jest.fn(),
  useDeleteTransactionMutation: jest.fn(),
  useMarkTransactionPaidMutation: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useTransactionsQuery);
const mockedUseCreate = jest.mocked(useCreateTransactionMutation);
const mockedUseUpdate = jest.mocked(useUpdateTransactionMutation);
const mockedUseDelete = jest.mocked(useDeleteTransactionMutation);
const mockedUseMarkPaid = jest.mocked(useMarkTransactionPaidMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

const buildRecord = (overrides: Record<string, unknown> = {}) => ({
  id: "tx-1",
  title: "Aluguel",
  amount: "2300.00",
  type: "expense" as const,
  dueDate: "2026-04-30",
  startDate: null,
  endDate: null,
  description: null,
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  recurrenceInterval: 1,
  recurrenceUnit: "month" as const,
  tagId: null,
  accountId: null,
  creditCardId: null,
  status: "pending" as const,
  currency: "BRL",
  source: "user",
  externalId: null,
  bankName: null,
  installmentGroupId: null,
  paidAt: null,
  createdAt: null,
  updatedAt: null,
  ...overrides,
});

const formValues = (
  overrides: Partial<CreateTransactionFormValues> = {},
): CreateTransactionFormValues => ({
  title: "Conta",
  amount: "150,75",
  type: "expense",
  dueDate: "2026-04-30",
  description: null,
  isRecurring: false,
  startDate: null,
  endDate: null,
  recurrenceInterval: 1,
  recurrenceUnit: "month",
  creditCardId: null,
  isInstallment: false,
  installmentCount: null,
  ...overrides,
});

let createStub: ReturnType<typeof buildMutationStub>;
let updateStub: ReturnType<typeof buildMutationStub>;
let deleteStub: ReturnType<typeof buildMutationStub>;
let markPaidStub: ReturnType<typeof buildMutationStub>;

beforeAll(() => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  jest.setSystemTime(new Date("2026-06-11T12:00:00"));
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  createStub = buildMutationStub();
  updateStub = buildMutationStub();
  deleteStub = buildMutationStub();
  markPaidStub = buildMutationStub();
  mockedUseCreate.mockReturnValue(createStub as never);
  mockedUseUpdate.mockReturnValue(updateStub as never);
  mockedUseDelete.mockReturnValue(deleteStub as never);
  mockedUseMarkPaid.mockReturnValue(markPaidStub as never);
});

describe("useTransactionsScreenController data projection", () => {
  it("retorna lista vazia e total zero quando nao ha dados", () => {
    mockedUseQuery.mockReturnValue({ data: undefined } as never);
    const { result } = renderHook(() => useTransactionsScreenController());
    expect(result.current.transactions).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("filtra por tipo income quando typeFilter ativo", () => {
    mockedUseQuery.mockReturnValue({
      data: {
        transactions: [
          buildRecord({ id: "a", type: "income" }),
          buildRecord({ id: "b", type: "expense" }),
        ],
        pagination: { total: 2 },
      },
    } as never);

    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.setTypeFilter("income");
    });
    expect(result.current.transactions.map((t) => t.id)).toEqual(["a"]);
  });

  it("projeta numero da parcela e filtra outras parcelas do grupo", () => {
    mockedUseQuery.mockReturnValue({
      data: {
        transactions: [
          buildRecord({
            id: "p2",
            dueDate: "2026-06-17",
            isInstallment: true,
            installmentCount: 2,
            installmentGroupId: "grp-1",
          }),
          buildRecord({
            id: "cash",
            dueDate: "2026-05-20",
            isInstallment: false,
            installmentCount: null,
            installmentGroupId: null,
          }),
          buildRecord({
            id: "p1",
            dueDate: "2026-05-17",
            isInstallment: true,
            installmentCount: 2,
            installmentGroupId: "grp-1",
          }),
        ],
        pagination: { total: 3 },
      },
    } as never);

    const { result } = renderHook(() => useTransactionsScreenController());

    expect(result.current.transactions.find((item) => item.id === "p1")).toEqual(
      expect.objectContaining({ installmentNumber: 1 }),
    );
    expect(result.current.transactions.find((item) => item.id === "p2")).toEqual(
      expect.objectContaining({ installmentNumber: 2 }),
    );

    act(() => {
      result.current.handleShowInstallmentGroup("grp-1");
    });

    expect(result.current.transactions.map((item) => item.id)).toEqual(["p2", "p1"]);
  });
});

describe("useTransactionsScreenController mutations", () => {
  beforeEach(() => {
    mockedUseQuery.mockReturnValue({
      data: { transactions: [], pagination: { total: 0 } },
    } as never);
  });

  it("create dispara createMutation com payload normalizado", async () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit(
        formValues({ title: "Conta", amount: "150,75" }),
      );
    });
    expect(createStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Conta", amount: "150.75", type: "expense" }),
    );
    expect(result.current.formMode.kind).toBe("closed");
  });

  it("create preserva dados de cartao e parcelamento no payload", async () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit(
        formValues({
          title: "Notebook",
          amount: "1200",
          dueDate: "2026-05-17",
          creditCardId: "018f3a22-6ec3-7dc2-a93a-1bbdecb02000",
          isInstallment: true,
          installmentCount: 12,
        }),
      );
    });

    expect(createStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        creditCardId: "018f3a22-6ec3-7dc2-a93a-1bbdecb02000",
        isInstallment: true,
        installmentCount: 12,
      }),
    );
  });

  it("edit dispara updateMutation com transactionId", async () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.handleOpenEdit(buildRecord({ id: "tx-9" }));
    });
    await act(async () => {
      await result.current.handleSubmit(
        formValues({ title: "Updated", amount: "100.00", type: "income" }),
      );
    });
    expect(updateStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ transactionId: "tx-9" }),
    );
  });

  it("captura submitError quando create falha e mantem form aberto", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit(formValues({ title: "X", amount: "1.00" }));
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
    expect(result.current.formMode.kind).toBe("create");
  });

  it("delete dispara deleteMutation com escopo occurrence por padrao", async () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    await act(async () => {
      await result.current.handleDelete("tx-9");
    });
    expect(deleteStub.mutateAsync).toHaveBeenCalledWith({
      transactionId: "tx-9",
      scope: "occurrence",
    });
    expect(result.current.deletingTransactionId).toBeNull();
  });

  it("delete com scope series repassa o escopo para a mutation", async () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    await act(async () => {
      await result.current.handleDelete("tx-9", "series");
    });
    expect(deleteStub.mutateAsync).toHaveBeenCalledWith({
      transactionId: "tx-9",
      scope: "series",
    });
  });

  it("handleMarkPaid dispara mutation com data e limpa estado de paying", async () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    await act(async () => {
      await result.current.handleMarkPaid("tx-3", "2026-06-11");
    });
    expect(markPaidStub.mutateAsync).toHaveBeenCalledWith({
      transactionId: "tx-3",
      paidAt: "2026-06-11",
    });
    expect(result.current.payingTransactionId).toBeNull();
  });

  it("handleMarkPaid captura erro em submitError", async () => {
    markPaidStub.mutateAsync.mockRejectedValueOnce(new Error("pay boom"));
    const { result } = renderHook(() => useTransactionsScreenController());
    await act(async () => {
      await result.current.handleMarkPaid("tx-3", "2026-06-11");
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
    expect(result.current.payingTransactionId).toBeNull();
  });

  it("dismissSubmitError limpa estado e reseta mutations", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit(formValues({ title: "X", amount: "1.00" }));
    });
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(result.current.submitError).toBeNull();
    expect(createStub.reset).toHaveBeenCalled();
  });
});

describe("useTransactionsScreenController server-side filters", () => {
  beforeEach(() => {
    mockedUseQuery.mockReturnValue({
      data: { transactions: [], pagination: { total: 0 } },
    } as never);
  });

  it("usa o mes corrente como periodo default da query", () => {
    renderHook(() => useTransactionsScreenController());
    expect(mockedUseQuery).toHaveBeenLastCalledWith({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
  });

  it("expoe label do periodo em pt-BR capitalizado", () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    expect(result.current.periodLabel).toBe("Junho de 2026");
  });

  it("envia type, status e tag na query quando filtros ativos", () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.setTypeFilter("income");
      result.current.setStatusFilter("pending");
      result.current.setTagFilter("tag-1");
    });
    expect(mockedUseQuery).toHaveBeenLastCalledWith({
      type: "income",
      status: "pending",
      tagId: "tag-1",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
  });

  it("navega para o mes anterior e seguinte ajustando o range", () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.goToPreviousMonth();
    });
    expect(mockedUseQuery).toHaveBeenLastCalledWith({
      startDate: "2026-05-01",
      endDate: "2026-05-31",
    });
    expect(result.current.periodLabel).toBe("Maio de 2026");

    act(() => {
      result.current.goToNextMonth();
      result.current.goToNextMonth();
    });
    expect(mockedUseQuery).toHaveBeenLastCalledWith({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
  });

  it("clearFilters reseta filtros e volta ao mes corrente", () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.setStatusFilter("overdue");
      result.current.setTagFilter("tag-9");
      result.current.goToPreviousMonth();
    });
    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.statusFilter).toBe("all");
    expect(result.current.tagFilter).toBe("all");
    expect(mockedUseQuery).toHaveBeenLastCalledWith({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
  });
});

describe("useTransactionsScreenController quick-create intent (tab [+])", () => {
  it("abre o form de criacao quando a rota recebe intent=create", () => {
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    (useLocalSearchParams as jest.Mock).mockReturnValue({ intent: "create" });

    const { result } = renderHook(() => useTransactionsScreenController());

    expect(result.current.formMode.kind).toBe("create");

    (useLocalSearchParams as jest.Mock).mockReturnValue({});
  });

  it("nao reabre o form apos o usuario fechar com o intent ainda na rota", () => {
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    (useLocalSearchParams as jest.Mock).mockReturnValue({ intent: "create" });

    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.handleCloseForm();
    });

    expect(result.current.formMode.kind).toBe("closed");

    (useLocalSearchParams as jest.Mock).mockReturnValue({});
  });
});

describe("useTransactionsScreenController period balance + active filters", () => {
  it("expoe a descricao no view model", () => {
    mockedUseQuery.mockReturnValue({
      data: {
        transactions: [buildRecord({ id: "a", description: "Conta de luz" })],
        pagination: { total: 1 },
      },
    } as never);

    const { result } = renderHook(() => useTransactionsScreenController());

    expect(result.current.transactions[0]).toEqual(
      expect.objectContaining({ description: "Conta de luz" }),
    );
  });

  it("computa o saldo do periodo (receitas - despesas, ignorando canceladas)", () => {
    mockedUseQuery.mockReturnValue({
      data: {
        transactions: [
          buildRecord({ id: "a", type: "income", amount: "1000.00" }),
          buildRecord({ id: "b", type: "expense", amount: "300.50" }),
          buildRecord({
            id: "c",
            type: "expense",
            amount: "999.99",
            status: "cancelled",
          }),
        ],
        pagination: { total: 3 },
      },
    } as never);

    const { result } = renderHook(() => useTransactionsScreenController());

    expect(result.current.monthBalance).toBeCloseTo(699.5, 2);
  });

  it("hasActiveFilters reflete filtros de tipo, status e tag", () => {
    mockedUseQuery.mockReturnValue({
      data: { transactions: [], pagination: { total: 0 } },
    } as never);

    const { result } = renderHook(() => useTransactionsScreenController());
    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.setStatusFilter("pending");
    });
    expect(result.current.hasActiveFilters).toBe(true);
  });
});
