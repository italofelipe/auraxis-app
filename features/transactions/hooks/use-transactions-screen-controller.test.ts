import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useUpdateTransactionMutation,
} from "@/features/transactions/hooks/use-transaction-mutations";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import { useTransactionsScreenController } from "@/features/transactions/hooks/use-transactions-screen-controller";

jest.mock("@/features/transactions/hooks/use-transactions-query", () => ({
  useTransactionsQuery: jest.fn(),
}));
jest.mock("@/features/transactions/hooks/use-transaction-mutations", () => ({
  useCreateTransactionMutation: jest.fn(),
  useUpdateTransactionMutation: jest.fn(),
  useDeleteTransactionMutation: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useTransactionsQuery);
const mockedUseCreate = jest.mocked(useCreateTransactionMutation);
const mockedUseUpdate = jest.mocked(useUpdateTransactionMutation);
const mockedUseDelete = jest.mocked(useDeleteTransactionMutation);

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

let createStub: ReturnType<typeof buildMutationStub>;
let updateStub: ReturnType<typeof buildMutationStub>;
let deleteStub: ReturnType<typeof buildMutationStub>;

beforeEach(() => {
  createStub = buildMutationStub();
  updateStub = buildMutationStub();
  deleteStub = buildMutationStub();
  mockedUseCreate.mockReturnValue(createStub as never);
  mockedUseUpdate.mockReturnValue(updateStub as never);
  mockedUseDelete.mockReturnValue(deleteStub as never);
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
      await result.current.handleSubmit({
        title: "Conta",
        amount: "150,75",
        type: "expense",
        dueDate: "2026-04-30",
        description: null,
        isRecurring: false,
      });
    });
    expect(createStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Conta", amount: "150.75", type: "expense" }),
    );
    expect(result.current.formMode.kind).toBe("closed");
  });

  it("edit dispara updateMutation com transactionId", async () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.handleOpenEdit(buildRecord({ id: "tx-9" }));
    });
    await act(async () => {
      await result.current.handleSubmit({
        title: "Updated",
        amount: "100.00",
        type: "income",
        dueDate: "2026-04-30",
        description: null,
        isRecurring: false,
      });
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
      await result.current.handleSubmit({
        title: "X",
        amount: "1.00",
        type: "expense",
        dueDate: "2026-04-30",
        description: null,
        isRecurring: false,
      });
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
    expect(result.current.formMode.kind).toBe("create");
  });

  it("delete dispara deleteMutation pelo id", async () => {
    const { result } = renderHook(() => useTransactionsScreenController());
    await act(async () => {
      await result.current.handleDelete("tx-9");
    });
    expect(deleteStub.mutateAsync).toHaveBeenCalledWith("tx-9");
    expect(result.current.deletingTransactionId).toBeNull();
  });

  it("dismissSubmitError limpa estado e reseta mutations", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useTransactionsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        title: "X",
        amount: "1.00",
        type: "expense",
        dueDate: "2026-04-30",
        description: null,
        isRecurring: false,
      });
    });
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(result.current.submitError).toBeNull();
    expect(createStub.reset).toHaveBeenCalled();
  });
});
