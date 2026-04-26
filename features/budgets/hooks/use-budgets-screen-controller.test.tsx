import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
  useUpdateBudgetMutation,
} from "@/features/budgets/hooks/use-budgets-mutations";
import {
  useBudgetSummaryQuery,
  useBudgetsQuery,
} from "@/features/budgets/hooks/use-budgets-query";
import { useBudgetsScreenController } from "@/features/budgets/hooks/use-budgets-screen-controller";

jest.mock("@/features/budgets/hooks/use-budgets-query", () => ({
  useBudgetsQuery: jest.fn(),
  useBudgetSummaryQuery: jest.fn(),
}));
jest.mock("@/features/budgets/hooks/use-budgets-mutations", () => ({
  useCreateBudgetMutation: jest.fn(),
  useUpdateBudgetMutation: jest.fn(),
  useDeleteBudgetMutation: jest.fn(),
}));

const mockedUseList = jest.mocked(useBudgetsQuery);
const mockedUseSummary = jest.mocked(useBudgetSummaryQuery);
const mockedUseCreate = jest.mocked(useCreateBudgetMutation);
const mockedUseUpdate = jest.mocked(useUpdateBudgetMutation);
const mockedUseDelete = jest.mocked(useDeleteBudgetMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

const buildBudget = (override: Record<string, unknown> = {}) => ({
  id: "b-1",
  name: "Alimentacao",
  amount: "1500.00",
  spent: "0.00",
  remaining: "1500.00",
  percentageUsed: 0,
  period: "monthly" as const,
  startDate: null,
  endDate: null,
  tagId: null,
  tagName: null,
  tagColor: null,
  isActive: true,
  isOverBudget: false,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  ...override,
});

let createStub: ReturnType<typeof buildMutationStub>;
let updateStub: ReturnType<typeof buildMutationStub>;
let deleteStub: ReturnType<typeof buildMutationStub>;

beforeEach(() => {
  createStub = buildMutationStub();
  updateStub = buildMutationStub();
  deleteStub = buildMutationStub();
  mockedUseCreate.mockReturnValue(createStub as never);
  mockedUseUpdate.mockReturnValue(updateStub as never);
  mockedUseDelete.mockReturnValue(deleteStub as never);
  mockedUseList.mockReturnValue({ data: [] } as never);
  mockedUseSummary.mockReturnValue({ data: undefined } as never);
});

describe("useBudgetsScreenController", () => {
  it("retorna lista vazia quando nao ha dados", () => {
    mockedUseList.mockReturnValue({ data: undefined } as never);
    const { result } = renderHook(() => useBudgetsScreenController());
    expect(result.current.budgets).toEqual([]);
  });

  it("create dispara createMutation e fecha o form", async () => {
    const { result } = renderHook(() => useBudgetsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        amount: "100.00",
        period: "monthly",
        tagId: null,
        startDate: null,
        endDate: null,
      });
    });
    expect(createStub.mutateAsync).toHaveBeenCalled();
    expect(result.current.formMode.kind).toBe("closed");
  });

  it("edit dispara updateMutation com budgetId", async () => {
    const { result } = renderHook(() => useBudgetsScreenController());
    act(() => {
      result.current.handleOpenEdit(buildBudget({ id: "b-9" }));
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "Editado",
        amount: "200.00",
        period: "monthly",
        tagId: null,
        startDate: null,
        endDate: null,
      });
    });
    expect(updateStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ budgetId: "b-9", name: "Editado" }),
    );
  });

  it("captura submitError quando create falha", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useBudgetsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        amount: "100.00",
        period: "monthly",
        tagId: null,
        startDate: null,
        endDate: null,
      });
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
  });

  it("delete dispara deleteMutation pelo id", async () => {
    const { result } = renderHook(() => useBudgetsScreenController());
    await act(async () => {
      await result.current.handleDelete("b-1");
    });
    expect(deleteStub.mutateAsync).toHaveBeenCalledWith("b-1");
  });

  it("dismissSubmitError limpa estado", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useBudgetsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        amount: "100.00",
        period: "monthly",
        tagId: null,
        startDate: null,
        endDate: null,
      });
    });
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(result.current.submitError).toBeNull();
    expect(createStub.reset).toHaveBeenCalled();
  });
});
