import {
  useCreateWalletOperationMutation,
  useDeleteWalletOperationMutation,
} from "@/features/wallet/hooks/use-wallet-operations-mutations";
import { walletService } from "@/features/wallet/services/wallet-service";

const mockCreateApiMutation = jest.fn();

jest.mock("@/core/query/create-api-mutation", () => ({
  createApiMutation: (...args: readonly unknown[]) => mockCreateApiMutation(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock("@/features/wallet/services/wallet-service", () => ({
  walletService: {
    createOperation: jest.fn(),
    deleteOperation: jest.fn(),
  },
}));

const mockedService = walletService as jest.Mocked<typeof walletService>;

describe("wallet operations mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiMutation.mockImplementation((fn: unknown) => ({ fn }));
  });

  it("create encaminha command para walletService.createOperation", async () => {
    useCreateWalletOperationMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({
      entryId: "e1",
      kind: "buy",
      quantity: 1,
      unitPrice: 10,
      executedAt: "2026-01-01",
      notes: null,
    });
    expect(mockedService.createOperation).toHaveBeenCalledWith(
      expect.objectContaining({ entryId: "e1", kind: "buy" }),
    );
  });

  it("delete encaminha command para walletService.deleteOperation", async () => {
    useDeleteWalletOperationMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({
      entryId: "e1",
      operationId: "op-1",
    });
    expect(mockedService.deleteOperation).toHaveBeenCalledWith({
      entryId: "e1",
      operationId: "op-1",
    });
  });
});
