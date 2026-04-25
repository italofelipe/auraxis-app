import {
  GoalProgressCalculator,
  goalProgressCalculator,
} from "@/features/goals/services/goal-progress-calculator";
import type { GoalRecord } from "@/features/goals/contracts";

const buildGoal = (override: Partial<GoalRecord> = {}): GoalRecord => ({
  id: "goal-1",
  title: "Comprar casa",
  currentAmount: 10000,
  targetAmount: 100000,
  targetDate: null,
  status: "active",
  ...override,
});

describe("GoalProgressCalculator", () => {
  it("calcula progresso percentual arredondado", () => {
    const view = goalProgressCalculator.calculate(buildGoal({ currentAmount: 25000 }));
    expect(view.progress).toBe(25);
    expect(view.remaining).toBe(75000);
    expect(view.isCompleted).toBe(false);
  });

  it("limita progresso entre 0 e 100", () => {
    const lower = goalProgressCalculator.calculate(buildGoal({ currentAmount: -50 }));
    expect(lower.progress).toBe(0);
    expect(lower.remaining).toBe(100000);

    const upper = goalProgressCalculator.calculate(buildGoal({ currentAmount: 200000 }));
    expect(upper.progress).toBe(100);
    expect(upper.remaining).toBe(0);
    expect(upper.isCompleted).toBe(true);
  });

  it("trata target zero sem divisao por zero", () => {
    const view = goalProgressCalculator.calculate(
      buildGoal({ targetAmount: 0, currentAmount: 0 }),
    );
    expect(view.progress).toBe(0);
    expect(view.isCompleted).toBe(false);
  });

  it("respeita status completed mesmo quando current < target", () => {
    const view = goalProgressCalculator.calculate(
      buildGoal({ status: "completed", currentAmount: 50, targetAmount: 100 }),
    );
    expect(view.isCompleted).toBe(true);
  });

  it("ordena ativas por progresso decrescente e concluidas no final", () => {
    const calc = new GoalProgressCalculator();
    const ordered = calc.mapAll([
      buildGoal({ id: "a", currentAmount: 10, targetAmount: 100 }),
      buildGoal({ id: "b", status: "completed", currentAmount: 100, targetAmount: 100 }),
      buildGoal({ id: "c", currentAmount: 80, targetAmount: 100 }),
    ]);

    expect(ordered.map((goal) => goal.id)).toEqual(["c", "a", "b"]);
  });

  it("trata valores nao numericos sem quebrar", () => {
    const view = goalProgressCalculator.calculate(
      buildGoal({
        currentAmount: Number.NaN as unknown as number,
        targetAmount: Number.NaN as unknown as number,
      }),
    );
    expect(view.progress).toBe(0);
    expect(view.remaining).toBe(0);
  });
});
