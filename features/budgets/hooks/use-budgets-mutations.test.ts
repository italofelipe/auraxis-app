import {
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
  useUpdateBudgetMutation,
} from "@/features/budgets/hooks/use-budgets-mutations";
import { budgetsService } from "@/features/budgets/services/budgets-service";

const mockCreateApiMutation = jest.fn();

jest.mock("@/core/query/create-api-mutation", () => ({
  createApiMutation: (...args: readonly unknown[]) => mockCreateApiMutation(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock("@/features/budgets/services/budgets-service", () => ({
  budgetsService: {
    createBudget: jest.fn(),
    updateBudget: jest.fn(),
    deleteBudget: jest.fn(),
  },
}));

const mockedService = budgetsService as jest.Mocked<typeof budgetsService>;

describe("budgets mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiMutation.mockImplementation((fn: unknown) => ({ fn }));
  });

  it("create encaminha command para budgetsService.createBudget", async () => {
    useCreateBudgetMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({
      name: "X",
      amount: "100.00",
    });
    expect(mockedService.createBudget).toHaveBeenCalledWith({
      name: "X",
      amount: "100.00",
    });
  });

  it("update encaminha command para budgetsService.updateBudget", async () => {
    useUpdateBudgetMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({
      budgetId: "b1",
      amount: "200.00",
    });
    expect(mockedService.updateBudget).toHaveBeenCalledWith({
      budgetId: "b1",
      amount: "200.00",
    });
  });

  it("delete encaminha id para budgetsService.deleteBudget", async () => {
    useDeleteBudgetMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (id: string) => Promise<unknown>)("b1");
    expect(mockedService.deleteBudget).toHaveBeenCalledWith("b1");
  });
});
