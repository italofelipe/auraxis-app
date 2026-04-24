import { renderHook } from "@testing-library/react-native";

import { useGoalsQuery } from "@/features/goals/hooks/use-goals-query";
import { useGoalsScreenController } from "@/features/goals/hooks/use-goals-screen-controller";

jest.mock("@/features/goals/hooks/use-goals-query", () => ({
  useGoalsQuery: jest.fn(),
}));

const mockedUseGoalsQuery = jest.mocked(useGoalsQuery);

describe("useGoalsScreenController", () => {
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
