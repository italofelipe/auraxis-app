import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateWalletEntryMutation,
  useDeleteWalletEntryMutation,
  useUpdateWalletEntryMutation,
} from "@/features/wallet/hooks/use-wallet-mutations";
import { useWalletLiveQuotes } from "@/features/wallet/hooks/use-wallet-live-quotes";
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
jest.mock("@/features/wallet/hooks/use-wallet-live-quotes", () => ({
  useWalletLiveQuotes: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useWalletEntriesQuery);
const mockedUseCreate = jest.mocked(useCreateWalletEntryMutation);
const mockedUseUpdate = jest.mocked(useUpdateWalletEntryMutation);
const mockedUseDelete = jest.mocked(useDeleteWalletEntryMutation);
const mockedUseLiveQuotes = jest.mocked(useWalletLiveQuotes);

const buildLiveQuotesStub = (overrides: Partial<ReturnType<typeof useWalletLiveQuotes>> = {}) => ({
  byTicker: new Map(),
  liveTotal: null,
  hasAnyError: false,
  isFetching: false,
  refetch: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

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
  mockedUseLiveQuotes.mockReturnValue(buildLiveQuotesStub() as never);
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

  it("usa cotacoes live no liveTotal e expoe metricas por ativo", () => {
    mockedUseQuery.mockReturnValue({
      data: { items: [buildEntry({ ticker: "PETR4", quantity: 10, value: 380 })], total: 380 },
      refetch: jest.fn().mockResolvedValue(undefined),
    } as never);
    const refetch = jest.fn().mockResolvedValue(undefined);
    mockedUseLiveQuotes.mockReturnValue(
      buildLiveQuotesStub({
        liveTotal: 410,
        byTicker: new Map([
          [
            "PETR4",
            {
              ticker: "PETR4",
              quote: {
                ticker: "PETR4",
                shortName: "PETR",
                price: 41,
                change: 1,
                changePercent: 2.5,
                currency: "BRL",
                logo: null,
              },
              isLoading: false,
              isError: false,
            },
          ],
        ]),
        refetch,
      }) as never,
    );

    const { result } = renderHook(() => useWalletScreenController());

    expect(result.current.liveTotal).toBe(410);
    expect(result.current.assets[0].liveAmount).toBe(410);
    expect(result.current.assets[0].liveChangePercent).toBe(2.5);
  });

  it("handleRefreshQuotes encadeia refetch da carteira e das cotacoes", async () => {
    const walletRefetch = jest.fn().mockResolvedValue(undefined);
    const quotesRefetch = jest.fn().mockResolvedValue(undefined);
    mockedUseQuery.mockReturnValue({
      data: { items: [], total: 0 },
      refetch: walletRefetch,
    } as never);
    mockedUseLiveQuotes.mockReturnValue(
      buildLiveQuotesStub({ refetch: quotesRefetch }) as never,
    );

    const { result } = renderHook(() => useWalletScreenController());
    await act(async () => {
      await result.current.handleRefreshQuotes();
    });

    expect(walletRefetch).toHaveBeenCalledTimes(1);
    expect(quotesRefetch).toHaveBeenCalledTimes(1);
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
