import { useCreditCardUtilizationQuery } from "@/features/credit-cards/hooks/use-credit-card-utilization-query";
import { creditCardsService } from "@/features/credit-cards/services/credit-cards-service";

const mockCreateApiQuery = jest.fn();

jest.mock("@/core/query/create-api-query", () => ({
  createApiQuery: (...args: readonly unknown[]) => mockCreateApiQuery(...args),
}));

jest.mock("@/features/credit-cards/services/credit-cards-service", () => ({
  creditCardsService: {
    getUtilization: jest.fn(),
  },
}));

const mockedService = creditCardsService as jest.Mocked<typeof creditCardsService>;

describe("useCreditCardUtilizationQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiQuery.mockImplementation((_key: unknown, fn: unknown) => ({ fn }));
  });

  it("cria query de utilizacao por cartao", async () => {
    useCreditCardUtilizationQuery("card-1");

    const [key, fn, options] = mockCreateApiQuery.mock.calls[0] ?? [];
    expect(key).toEqual(["credit-cards", "utilization", "card-1"]);
    expect(options).toMatchObject({ enabled: true });

    await (fn as () => Promise<unknown>)();
    expect(mockedService.getUtilization).toHaveBeenCalledWith("card-1");
  });

  it("respeita enabled explicito", () => {
    useCreditCardUtilizationQuery("card-1", { enabled: false });
    expect(mockCreateApiQuery.mock.calls[0]?.[2]).toMatchObject({ enabled: false });
  });
});
