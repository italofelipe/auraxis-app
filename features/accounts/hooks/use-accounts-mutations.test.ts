import {
  useCreateAccountMutation,
  useDeleteAccountMutation,
  useUpdateAccountMutation,
} from "@/features/accounts/hooks/use-accounts-mutations";
import { accountsService } from "@/features/accounts/services/accounts-service";

const mockCreateApiMutation = jest.fn();

jest.mock("@/core/query/create-api-mutation", () => ({
  createApiMutation: (...args: readonly unknown[]) => mockCreateApiMutation(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock("@/features/accounts/services/accounts-service", () => ({
  accountsService: {
    createAccount: jest.fn(),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));

const mockedService = accountsService as jest.Mocked<typeof accountsService>;

describe("accounts mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiMutation.mockImplementation((fn: unknown) => ({ fn }));
  });

  it("create encaminha command para accountsService.createAccount", async () => {
    useCreateAccountMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({
      name: "X",
      accountType: "checking",
    });
    expect(mockedService.createAccount).toHaveBeenCalledWith({
      name: "X",
      accountType: "checking",
    });
  });

  it("update encaminha command para accountsService.updateAccount", async () => {
    useUpdateAccountMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({
      accountId: "a1",
      name: "Y",
      accountType: "savings",
    });
    expect(mockedService.updateAccount).toHaveBeenCalledWith({
      accountId: "a1",
      name: "Y",
      accountType: "savings",
    });
  });

  it("delete encaminha id para accountsService.deleteAccount", async () => {
    useDeleteAccountMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (id: string) => Promise<unknown>)("a1");
    expect(mockedService.deleteAccount).toHaveBeenCalledWith("a1");
  });
});
