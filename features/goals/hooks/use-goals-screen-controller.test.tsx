import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateGoalMutation,
  useDeleteGoalMutation,
  useUpdateGoalMutation,
} from "@/features/goals/hooks/use-goals-mutations";
import { useGoalsQuery } from "@/features/goals/hooks/use-goals-query";
import { useGoalsScreenController } from "@/features/goals/hooks/use-goals-screen-controller";

jest.mock("@/features/goals/hooks/use-goals-query", () => ({
  useGoalsQuery: jest.fn(),
}));
jest.mock("@/features/goals/hooks/use-goals-mutations", () => ({
  useCreateGoalMutation: jest.fn(),
  useUpdateGoalMutation: jest.fn(),
  useDeleteGoalMutation: jest.fn(),
}));

const mockedUseGoalsQuery = jest.mocked(useGoalsQuery);
const mockedUseCreate = jest.mocked(useCreateGoalMutation);
const mockedUseUpdate = jest.mocked(useUpdateGoalMutation);
const mockedUseDelete = jest.mocked(useDeleteGoalMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
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
});

describe("useGoalsScreenController data projection", () => {
  it("retorna lista vazia e sumario zerado quando nao ha dados", () => {
    mockedUseGoalsQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as never);

    const { result } = renderHook(() => useGoalsScreenController());
    expect(result.current.goals).toEqual([]);
    expect(result.current.summary).toEqual({ total: 0, active: 0, completed: 0 });
  });

  it("decora goals e produz sumario consistente", () => {
    mockedUseGoalsQuery.mockReturnValue({
      data: {
        goals: [
          {
            id: "a",
            title: "Casa",
            currentAmount: 10,
            targetAmount: 100,
            targetDate: null,
            status: "active",
          },
          {
            id: "b",
            title: "Carro",
            currentAmount: 100,
            targetAmount: 100,
            targetDate: null,
            status: "completed",
          },
        ],
      },
      isPending: false,
      isError: false,
    } as never);

    const { result } = renderHook(() => useGoalsScreenController());

    expect(result.current.goals.map((g) => g.id)).toEqual(["a", "b"]);
    expect(result.current.goals[0].progress).toBe(10);
    expect(result.current.goals[1].isCompleted).toBe(true);
    expect(result.current.summary).toEqual({ total: 2, active: 1, completed: 1 });
  });
});

describe("useGoalsScreenController mutations", () => {
  it("create dispara createMutation com payload e fecha o form", async () => {
    mockedUseGoalsQuery.mockReturnValue({ data: { goals: [] } } as never);
    const { result } = renderHook(() => useGoalsScreenController());

    act(() => {
      result.current.handleOpenCreate();
    });
    expect(result.current.formMode.kind).toBe("create");

    await act(async () => {
      await result.current.handleSubmit({
        title: "Nova",
        targetAmount: 1000,
        currentAmount: 100,
        targetDate: null,
      });
    });

    expect(createStub.mutateAsync).toHaveBeenCalledWith({
      title: "Nova",
      targetAmount: 1000,
      currentAmount: 100,
      targetDate: null,
    });
    expect(result.current.formMode.kind).toBe("closed");
  });

  it("edit dispara updateMutation com goalId", async () => {
    mockedUseGoalsQuery.mockReturnValue({ data: { goals: [] } } as never);
    const { result } = renderHook(() => useGoalsScreenController());

    act(() => {
      result.current.handleOpenEdit({
        id: "g1",
        title: "Old",
        currentAmount: 0,
        targetAmount: 100,
        targetDate: null,
        status: "active",
      });
    });

    await act(async () => {
      await result.current.handleSubmit({
        title: "Edit",
        targetAmount: 200,
        currentAmount: 50,
        targetDate: null,
      });
    });

    expect(updateStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ goalId: "g1", title: "Edit", targetAmount: 200 }),
    );
  });

  it("captura submitError quando create falha e mantem form aberto", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    mockedUseGoalsQuery.mockReturnValue({ data: { goals: [] } } as never);
    const { result } = renderHook(() => useGoalsScreenController());

    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        title: "X",
        targetAmount: 1,
        currentAmount: 0,
        targetDate: null,
      });
    });

    expect(result.current.submitError).toBeInstanceOf(Error);
    expect(result.current.formMode.kind).toBe("create");
  });

  it("delete dispara deleteMutation pelo goalId e desbloqueia o estado", async () => {
    mockedUseGoalsQuery.mockReturnValue({ data: { goals: [] } } as never);
    const { result } = renderHook(() => useGoalsScreenController());

    await act(async () => {
      await result.current.handleDelete("g1");
    });

    expect(deleteStub.mutateAsync).toHaveBeenCalledWith("g1");
    expect(result.current.deletingGoalId).toBeNull();
  });

  it("dismissSubmitError limpa estado e reseta mutations", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    mockedUseGoalsQuery.mockReturnValue({ data: { goals: [] } } as never);
    const { result } = renderHook(() => useGoalsScreenController());

    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        title: "X",
        targetAmount: 1,
        currentAmount: 0,
        targetDate: null,
      });
    });
    expect(result.current.submitError).toBeInstanceOf(Error);

    act(() => {
      result.current.dismissSubmitError();
    });

    expect(result.current.submitError).toBeNull();
    expect(createStub.reset).toHaveBeenCalled();
  });
});
