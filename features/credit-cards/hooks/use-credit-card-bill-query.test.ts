import { useCreditCardBillQuery } from "@/features/credit-cards/hooks/use-credit-card-bill-query";
import { creditCardsService } from "@/features/credit-cards/services/credit-cards-service";

const mockCreateApiQuery = jest.fn();

jest.mock("@/core/query/create-api-query", () => ({
  createApiQuery: (...args: readonly unknown[]) => mockCreateApiQuery(...args),
}));

jest.mock("@/features/credit-cards/services/credit-cards-service", () => ({
  creditCardsService: {
    getBill: jest.fn(),
  },
}));

const mockedService = creditCardsService as jest.Mocked<typeof creditCardsService>;

describe("useCreditCardBillQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiQuery.mockImplementation((_key: unknown, fn: unknown) => ({ fn }));
  });

  it("cria query com key por cartao e mes", async () => {
    useCreditCardBillQuery("card-1", "2026-05");

    const [key, fn, options] = mockCreateApiQuery.mock.calls[0] ?? [];
    expect(key).toEqual(["credit-cards", "bill", "card-1", "2026-05"]);
    expect(options).toMatchObject({ enabled: true });

    await (fn as () => Promise<unknown>)();
    expect(mockedService.getBill).toHaveBeenCalledWith("card-1", {
      month: "2026-05",
    });
  });

  it("desabilita query sem id ou mes", () => {
    useCreditCardBillQuery("", "2026-05");
    expect(mockCreateApiQuery.mock.calls[0]?.[2]).toMatchObject({ enabled: false });
  });
});
