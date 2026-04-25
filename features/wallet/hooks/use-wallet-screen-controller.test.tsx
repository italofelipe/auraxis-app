import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateWalletEntryMutation,
  useDeleteWalletEntryMutation,
  useUpdateWalletEntryMutation,
} from "@/features/wallet/hooks/use-wallet-mutations";
import { useWalletEntriesQuery } from "@/features/wallet/hooks/use-wallet-query";
import { useWalletScreenController } from "@/features/wallet/hooks/use-wallet-screen-controller";

jest.mock("@/features/wallet/hooks/use-wallet-query", () => ({
  useWalletEntriesQuery: jest.fn(),
}));
jest.mock("@/features/wallet/hooks/use-wallet-mutations", () => ({
  useCreateWalletEntryMutation: jest.fn(),
  useUpdateWalletEntryMutation: jest.fn(),
  useDeleteWalletEntryMutation: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useWalletEntriesQuery);
const mockedUseCreate = jest.mocked(useCreateWalletEntryMutation);
const mockedUseUpdate = jest.mocked(useUpdateWalletEntryMutation);
const mockedUseDelete = jest.mocked(useDeleteWalletEntryMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

const buildEntry = (override: Record<string, unknown> = {}) => ({
  id: "w-1",
  name: "PETR4",
  value: 1000,
  estimatedValueOnCreateDate: null,
  ticker: "PETR4",
  quantity: 100,
  assetClass: "stocks",
  annualRate: null,
  targetWithdrawDate: null,
  registerDate: "2026-01-01",
  shouldBeOnWallet: true,
  ...override,
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

describe("useWalletScreenController data projection", () => {
  it("retorna lista vazia e total zero quando nao ha dados", () => {
    mockedUseQuery.mockReturnValue({ data: undefined } as never);
    const { result } = renderHook(() => useWalletScreenController());
    expect(result.current.entries).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("calcula allocation percentual a partir do total", () => {
    mockedUseQuery.mockReturnValue({
      data: { items: [buildEntry({ value: 500 })], total: 1000 },
    } as never);
    const { result } = renderHook(() => useWalletScreenController());
    expect(result.current.assets[0].allocation).toBe(50);
  });

  it("alocacao zero quando total e zero", () => {
    mockedUseQuery.mockReturnValue({
      data: { items: [buildEntry({ value: 0 })], total: 0 },
    } as never);
    const { result } = renderHook(() => useWalletScreenController());
    expect(result.current.assets[0].allocation).toBe(0);
  });
});

describe("useWalletScreenController mutations", () => {
  beforeEach(() => {
    mockedUseQuery.mockReturnValue({ data: { items: [], total: 0 } } as never);
  });

  it("create dispara createMutation", async () => {
    const { result } = renderHook(() => useWalletScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        assetClass: "stocks",
        value: 100,
      } as never);
    });
    expect(createStub.mutateAsync).toHaveBeenCalled();
    expect(result.current.formMode.kind).toBe("closed");
  });

  it("edit dispara updateMutation com entryId", async () => {
    const { result } = renderHook(() => useWalletScreenController());
    act(() => {
      result.current.handleOpenEdit(buildEntry({ id: "w-9" }));
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "Updated",
        assetClass: "stocks",
      } as never);
    });
    expect(updateStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ entryId: "w-9" }),
    );
  });

  it("captura submitError quando create falha", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useWalletScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        assetClass: "stocks",
      } as never);
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
  });

  it("delete dispara deleteMutation pelo id", async () => {
    const { result } = renderHook(() => useWalletScreenController());
    await act(async () => {
      await result.current.handleDelete("w-1");
    });
    expect(deleteStub.mutateAsync).toHaveBeenCalledWith("w-1");
  });

  it("dismissSubmitError limpa estado e reseta mutations", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useWalletScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        assetClass: "stocks",
      } as never);
    });
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(result.current.submitError).toBeNull();
  });
});
