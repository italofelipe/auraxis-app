import { queryKeys } from "@/core/query/query-keys";
import {
  useWalletOperationsPositionQuery,
  useWalletOperationsQuery,
} from "@/features/wallet/hooks/use-wallet-operations-query";
import { walletService } from "@/features/wallet/services/wallet-service";

const mockCreateApiQuery = jest.fn();

jest.mock("@/core/query/create-api-query", () => ({
  createApiQuery: (...args: readonly unknown[]) => mockCreateApiQuery(...args),
}));

jest.mock("@/features/wallet/services/wallet-service", () => ({
  walletService: {
    listOperations: jest.fn(),
    getOperationsPosition: jest.fn(),
  },
}));

const mockedService = walletService as jest.Mocked<typeof walletService>;

describe("wallet operations queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiQuery.mockImplementation(
      (queryKey: readonly unknown[], queryFn: () => Promise<unknown>, options?: unknown) => ({
        queryKey,
        queryFn,
        options,
      }),
    );
  });

  it("useWalletOperationsQuery monta queryKey e desabilita sem entryId", () => {
    const result = useWalletOperationsQuery(null) as unknown as {
      queryKey: readonly unknown[];
      options: { enabled: boolean };
    };
    expect(result.queryKey).toEqual(queryKeys.wallet.operations("__disabled__"));
    expect(result.options.enabled).toBe(false);
  });

  it("useWalletOperationsQuery delega ao service quando habilitado", async () => {
    mockedService.listOperations.mockResolvedValue({ operations: [] } as never);
    const result = useWalletOperationsQuery("e1") as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
      options: { enabled: boolean };
    };
    await result.queryFn();
    expect(mockedService.listOperations).toHaveBeenCalledWith("e1");
    expect(result.queryKey).toEqual(queryKeys.wallet.operations("e1"));
    expect(result.options.enabled).toBe(true);
  });

  it("useWalletOperationsPositionQuery delega ao service e monta queryKey", async () => {
    mockedService.getOperationsPosition.mockResolvedValue({
      currentQuantity: 0,
      averagePrice: 0,
      investedAmount: 0,
      realizedProfit: 0,
    } as never);
    const result = useWalletOperationsPositionQuery("e1") as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
      options: { enabled: boolean };
    };
    await result.queryFn();
    expect(mockedService.getOperationsPosition).toHaveBeenCalledWith("e1");
    expect(result.queryKey).toEqual(queryKeys.wallet.position("e1"));
    expect(result.options.enabled).toBe(true);
  });
});
