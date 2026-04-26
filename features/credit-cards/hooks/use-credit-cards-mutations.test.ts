import {
  useCreateCreditCardMutation,
  useDeleteCreditCardMutation,
  useUpdateCreditCardMutation,
} from "@/features/credit-cards/hooks/use-credit-cards-mutations";
import { creditCardsService } from "@/features/credit-cards/services/credit-cards-service";

const mockCreateApiMutation = jest.fn();

jest.mock("@/core/query/create-api-mutation", () => ({
  createApiMutation: (...args: readonly unknown[]) => mockCreateApiMutation(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock("@/features/credit-cards/services/credit-cards-service", () => ({
  creditCardsService: {
    createCreditCard: jest.fn(),
    updateCreditCard: jest.fn(),
    deleteCreditCard: jest.fn(),
  },
}));

const mockedService = creditCardsService as jest.Mocked<typeof creditCardsService>;

describe("credit cards mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiMutation.mockImplementation((fn: unknown) => ({ fn }));
  });

  it("create encaminha command para creditCardsService.createCreditCard", async () => {
    useCreateCreditCardMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({ name: "X" });
    expect(mockedService.createCreditCard).toHaveBeenCalledWith({ name: "X" });
  });

  it("update encaminha command para creditCardsService.updateCreditCard", async () => {
    useUpdateCreditCardMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({
      creditCardId: "c1",
      name: "Y",
    });
    expect(mockedService.updateCreditCard).toHaveBeenCalledWith({
      creditCardId: "c1",
      name: "Y",
    });
  });

  it("delete encaminha id para creditCardsService.deleteCreditCard", async () => {
    useDeleteCreditCardMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (id: string) => Promise<unknown>)("c1");
    expect(mockedService.deleteCreditCard).toHaveBeenCalledWith("c1");
  });
});
