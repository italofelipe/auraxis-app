import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateWalletOperationMutation,
  useDeleteWalletOperationMutation,
} from "@/features/wallet/hooks/use-wallet-operations-mutations";
import {
  useWalletOperationsPositionQuery,
  useWalletOperationsQuery,
} from "@/features/wallet/hooks/use-wallet-operations-query";
import { useWalletOperationsScreenController } from "@/features/wallet/hooks/use-wallet-operations-screen-controller";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
}));

jest.mock("@/features/wallet/hooks/use-wallet-operations-query", () => ({
  useWalletOperationsQuery: jest.fn(),
  useWalletOperationsPositionQuery: jest.fn(),
}));
jest.mock("@/features/wallet/hooks/use-wallet-operations-mutations", () => ({
  useCreateWalletOperationMutation: jest.fn(),
  useDeleteWalletOperationMutation: jest.fn(),
}));

const mockedUseOperations = jest.mocked(useWalletOperationsQuery);
const mockedUsePosition = jest.mocked(useWalletOperationsPositionQuery);
const mockedUseCreate = jest.mocked(useCreateWalletOperationMutation);
const mockedUseDelete = jest.mocked(useDeleteWalletOperationMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

let createStub: ReturnType<typeof buildMutationStub>;
let deleteStub: ReturnType<typeof buildMutationStub>;

beforeEach(() => {
  createStub = buildMutationStub();
  deleteStub = buildMutationStub();
  mockedUseCreate.mockReturnValue(createStub as never);
  mockedUseDelete.mockReturnValue(deleteStub as never);
  mockedUseOperations.mockReturnValue({ data: undefined } as never);
  mockedUsePosition.mockReturnValue({ data: undefined } as never);
  mockReplace.mockReset();
});

describe("useWalletOperationsScreenController data projection", () => {
  it("retorna lista vazia quando nao ha dados", () => {
    const { result } = renderHook(() => useWalletOperationsScreenController("e1"));
    expect(result.current.operations).toEqual([]);
    expect(result.current.position).toBeNull();
  });

  it("expoe operacoes e posicao quando query resolve", () => {
    mockedUseOperations.mockReturnValue({
      data: {
        operations: [
          {
            id: "op-1",
            kind: "buy",
            quantity: 10,
            unitPrice: 5,
            totalValue: 50,
            executedAt: "2026-01-01",
            notes: null,
          },
        ],
        count: 1,
      },
    } as never);
    mockedUsePosition.mockReturnValue({
      data: {
        currentQuantity: 10,
        averagePrice: 5,
        investedAmount: 50,
        realizedProfit: 0,
      },
    } as never);

    const { result } = renderHook(() => useWalletOperationsScreenController("e1"));
    expect(result.current.operations).toHaveLength(1);
    expect(result.current.position?.currentQuantity).toBe(10);
  });
});

describe("useWalletOperationsScreenController mutations", () => {
  it("create dispara mutation com entryId e fecha o form", async () => {
    const { result } = renderHook(() => useWalletOperationsScreenController("e1"));

    act(() => {
      result.current.handleOpenCreate();
    });
    expect(result.current.formMode).toBe("create");

    await act(async () => {
      await result.current.handleSubmit({
        kind: "buy",
        quantity: 1,
        unitPrice: 10,
        executedAt: "2026-01-01",
        notes: null,
      });
    });

    expect(createStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ entryId: "e1", kind: "buy" }),
    );
    expect(result.current.formMode).toBe("closed");
  });

  it("captura submitError quando create falha", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useWalletOperationsScreenController("e1"));

    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        kind: "sell",
        quantity: 1,
        unitPrice: 10,
        executedAt: "2026-01-01",
        notes: null,
      });
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
  });

  it("delete dispara deleteMutation com entryId e operationId", async () => {
    const { result } = renderHook(() => useWalletOperationsScreenController("e1"));

    await act(async () => {
      await result.current.handleDelete("op-1");
    });

    expect(deleteStub.mutateAsync).toHaveBeenCalledWith({
      entryId: "e1",
      operationId: "op-1",
    });
    expect(result.current.deletingOperationId).toBeNull();
  });

  it("dismissSubmitError limpa estado e reseta create mutation", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useWalletOperationsScreenController("e1"));

    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        kind: "buy",
        quantity: 1,
        unitPrice: 1,
        executedAt: "2026-01-01",
        notes: null,
      });
    });

    act(() => {
      result.current.dismissSubmitError();
    });
    expect(result.current.submitError).toBeNull();
    expect(createStub.reset).toHaveBeenCalled();
  });

  it("handleBackToWallet redireciona para a rota da carteira", () => {
    const { result } = renderHook(() => useWalletOperationsScreenController("e1"));
    act(() => {
      result.current.handleBackToWallet();
    });
    expect(mockReplace).toHaveBeenCalledWith("/carteira");
  });

  it("handleCloseForm volta o form para closed", () => {
    const { result } = renderHook(() => useWalletOperationsScreenController("e1"));
    act(() => {
      result.current.handleOpenCreate();
    });
    act(() => {
      result.current.handleCloseForm();
    });
    expect(result.current.formMode).toBe("closed");
  });
});
