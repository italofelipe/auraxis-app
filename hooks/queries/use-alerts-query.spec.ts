import type { AlertsResponse } from "@/types/contracts";

import { useAlertsQuery } from "@/hooks/queries/use-alerts-query";

const mockUseQuery = jest.fn();
const mockGetAlerts = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: readonly unknown[]) => mockUseQuery(...args),
}));

jest.mock("@/lib/alerts-api", () => ({
  alertsApi: {
    getAlerts: (...args: readonly unknown[]) => mockGetAlerts(...args),
  },
}));

describe("useAlertsQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockImplementation(
      (options: { readonly queryFn: () => Promise<AlertsResponse> }) => options,
    );
  });

  it("propagates error when backend fails", async () => {
    const expectedError = new Error("backend unavailable");
    mockGetAlerts.mockRejectedValue(expectedError);

    const query = useAlertsQuery() as unknown as {
      readonly queryFn: () => Promise<AlertsResponse>;
    };

    await expect(query.queryFn()).rejects.toThrow("backend unavailable");
  });
});
