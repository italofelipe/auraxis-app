import {
  useCreateWalletEntryMutation,
  useDeleteWalletEntryMutation,
  useUpdateWalletEntryMutation,
} from "@/features/wallet/hooks/use-wallet-mutations";
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
    createEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
  },
}));

const mockedService = walletService as jest.Mocked<typeof walletService>;

describe("wallet mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiMutation.mockImplementation((fn: unknown) => ({ fn }));
  });

  it("create encaminha command para walletService.createEntry", async () => {
    useCreateWalletEntryMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({
      name: "PETR4",
      assetClass: "stocks",
    });
    expect(mockedService.createEntry).toHaveBeenCalledWith({
      name: "PETR4",
      assetClass: "stocks",
    });
  });

  it("update encaminha command para walletService.updateEntry", async () => {
    useUpdateWalletEntryMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({
      entryId: "w-1",
      value: 1000,
    });
    expect(mockedService.updateEntry).toHaveBeenCalledWith({
      entryId: "w-1",
      value: 1000,
    });
  });

  it("delete encaminha id para walletService.deleteEntry", async () => {
    useDeleteWalletEntryMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (id: string) => Promise<unknown>)("w-1");
    expect(mockedService.deleteEntry).toHaveBeenCalledWith("w-1");
  });
});
