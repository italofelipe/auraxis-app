import type { AlertsResponse } from "@/types/contracts";

import { useAlertsQuery } from "@/hooks/queries/use-alerts-query";

const mockUseQuery = jest.fn();
const mockListAlerts = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: readonly unknown[]) => mockUseQuery(...args),
}));

jest.mock("@/features/alerts/services/alerts-service", () => ({
  alertsService: {
    listAlerts: (...args: readonly unknown[]) => mockListAlerts(...args),
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
    mockListAlerts.mockRejectedValue(expectedError);

    const query = useAlertsQuery() as unknown as {
      readonly queryFn: () => Promise<AlertsResponse>;
    };

    await expect(query.queryFn()).rejects.toThrow("backend unavailable");
  });
});
