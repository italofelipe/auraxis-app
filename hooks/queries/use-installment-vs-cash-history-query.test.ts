import { useInstallmentVsCashHistoryQuery } from "@/hooks/queries/use-installment-vs-cash-history-query";

const mockUseQuery = jest.fn();
const mockListSaved = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: readonly unknown[]) => mockUseQuery(...args),
}));

jest.mock("@/lib/installment-vs-cash-api", () => ({
  installmentVsCashApi: {
    listSaved: (...args: readonly unknown[]) => mockListSaved(...args),
  },
}));

describe("useInstallmentVsCashHistoryQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockImplementation((options: {
      readonly queryFn: () => Promise<readonly unknown[]>;
    }) => options);
  });

  it("filtra historico pela ferramenta correta", async () => {
    mockListSaved.mockResolvedValue([
      { id: "sim-1", toolId: "installment_vs_cash" },
      { id: "sim-2", toolId: "salary_net" },
    ]);

    const query = useInstallmentVsCashHistoryQuery() as unknown as {
      readonly queryFn: () => Promise<readonly { id: string }[]>;
    };
    const result = await query.queryFn();

    expect(result).toEqual([{ id: "sim-1", toolId: "installment_vs_cash" }]);
  });
});
