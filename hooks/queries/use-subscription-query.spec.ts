import type { Subscription } from "@/types/contracts";

import { useSubscriptionQuery } from "@/hooks/queries/use-subscription-query";

const mockUseQuery = jest.fn();
const mockGetMySubscription = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: readonly unknown[]) => mockUseQuery(...args),
}));

jest.mock("@/lib/subscription-api", () => ({
  subscriptionApi: {
    getMySubscription: (...args: readonly unknown[]) => mockGetMySubscription(...args),
  },
}));

describe("useSubscriptionQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockImplementation(
      (options: { readonly queryFn: () => Promise<Subscription> }) => options,
    );
  });

  it("propaga erro quando o backend falha", async () => {
    const networkError = new Error("network error");
    mockGetMySubscription.mockRejectedValue(networkError);

    const query = useSubscriptionQuery() as unknown as {
      readonly queryFn: () => Promise<Subscription>;
    };

    await expect(query.queryFn()).rejects.toThrow("network error");
  });
});
