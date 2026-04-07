import type { Subscription } from "@/types/contracts";

import { useSubscriptionQuery } from "@/hooks/queries/use-subscription-query";

const mockUseQuery = jest.fn();
const mockGetSubscription = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: readonly unknown[]) => mockUseQuery(...args),
}));

jest.mock("@/features/subscription/services/subscription-service", () => ({
  subscriptionService: {
    getSubscription: (...args: readonly unknown[]) => mockGetSubscription(...args),
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
    mockGetSubscription.mockRejectedValue(networkError);

    const query = useSubscriptionQuery() as unknown as {
      readonly queryFn: () => Promise<Subscription>;
    };

    await expect(query.queryFn()).rejects.toThrow("network error");
  });
});
