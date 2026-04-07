import {
  createInstallmentVsCashService,
} from "@/features/tools/services/installment-vs-cash-service";
import type {
  InstallmentVsCashCalculationResponseDto,
  InstallmentVsCashHistoryResponseDto,
  InstallmentVsCashSaveResponseDto,
} from "@/types/contracts/installment-vs-cash";

const calculationDto: InstallmentVsCashCalculationResponseDto = {
  tool_id: "installment_vs_cash",
  rule_version: "2026.1",
  input: {
    cash_price: "1000.00",
    installment_count: 6,
    installment_amount: "200.00",
    installment_total: "1200.00",
    first_payment_delay_days: 30,
    opportunity_rate_type: "manual",
    opportunity_rate_annual: "12.00",
    inflation_rate_annual: "4.50",
    fees_upfront: "0.00",
    scenario_label: "Notebook",
  },
  result: {
    recommended_option: "cash",
    recommendation_reason: "A vista vence.",
    formula_explainer: "Explicacao",
    comparison: {
      cash_option_total: "1000.00",
      installment_option_total: "1200.00",
      installment_present_value: "1050.00",
      installment_real_value_today: "1030.00",
      present_value_delta_vs_cash: "50.00",
      absolute_delta_vs_cash: "200.00",
      relative_delta_vs_cash_percent: "5.00",
      break_even_discount_percent: "7.00",
      break_even_opportunity_rate_annual: "14.00",
    },
    options: {
      cash: { total: "1000.00" },
      installment: {
        count: 6,
        amounts: ["200.00", "200.00"],
        installment_amount: "200.00",
        nominal_total: "1200.00",
        upfront_fees: "0.00",
        first_payment_delay_days: 30,
      },
    },
    neutrality_band: {
      absolute_brl: "25.00",
      relative_percent: "1.50",
    },
    assumptions: {
      opportunity_rate_type: "manual",
      opportunity_rate_annual_percent: "12.00",
      inflation_rate_annual_percent: "4.50",
      periodicity: "monthly",
      first_payment_delay_days: 30,
      upfront_fees_apply_to: "installment",
      neutrality_rule: "mixed",
    },
    indicator_snapshot: null,
    schedule: [],
  },
};

describe("installment-vs-cash api calculation", () => {
  it("mapeia o calculo", async () => {
    const dtoWithSnapshot: InstallmentVsCashCalculationResponseDto = {
      ...calculationDto,
      result: {
        ...calculationDto.result,
        indicator_snapshot: {
          preset_type: "product_default",
          source: "Auraxis",
          annual_rate_percent: "12.50",
          as_of: "2026-03-20",
        },
      },
    };
    const post = jest.fn().mockResolvedValue({ data: calculationDto });
    const api = createInstallmentVsCashService({ get: jest.fn(), post });

    const response = await api.calculate({
      cash_price: "1000.00",
      installment_count: 6,
      installment_total: "1200.00",
      inflation_rate_annual: "4.50",
      fees_enabled: false,
      fees_upfront: "0.00",
      first_payment_delay_days: 30,
      opportunity_rate_type: "manual",
      opportunity_rate_annual: "12.00",
    });

    expect(response.toolId).toBe("installment_vs_cash");
    expect(response.result.comparison.cashOptionTotal).toBe(1000);

    post.mockResolvedValueOnce({ data: dtoWithSnapshot });
    const secondResponse = await api.calculate({
      cash_price: "1000.00",
      installment_count: 6,
      installment_total: "1200.00",
      inflation_rate_annual: "4.50",
      fees_enabled: false,
      fees_upfront: "0.00",
      first_payment_delay_days: 30,
      opportunity_rate_type: "manual",
      opportunity_rate_annual: "12.00",
    });

    expect(secondResponse.result.indicatorSnapshot?.source).toBe("Auraxis");
  });
});

describe("installment-vs-cash api persistence", () => {
  it("mapeia o save e o historico", async () => {
    const saveDto: InstallmentVsCashSaveResponseDto = {
      simulation: {
        id: "sim-1",
        user_id: "user-1",
        tool_id: "installment_vs_cash",
        rule_version: "2026.1",
        inputs: calculationDto.input,
        result: calculationDto.result,
        saved: true,
        goal_id: null,
        created_at: "2026-03-20T10:00:00Z",
      },
      calculation: calculationDto,
    };

    const historyDto: InstallmentVsCashHistoryResponseDto = {
      items: [saveDto.simulation],
    };

    const post = jest.fn().mockResolvedValue({ data: saveDto });
    const get = jest.fn().mockResolvedValue({ data: historyDto });
    const api = createInstallmentVsCashService({ get, post });

    const saveResponse = await api.save({
      cash_price: "1000.00",
      installment_count: 6,
      installment_total: "1200.00",
      inflation_rate_annual: "4.50",
      fees_enabled: false,
      fees_upfront: "0.00",
      first_payment_delay_days: 30,
      opportunity_rate_type: "manual",
      opportunity_rate_annual: "12.00",
    });
    const history = await api.listSaved();

    expect(saveResponse.simulation.saved).toBe(true);
    expect(history[0]?.id).toBe("sim-1");
  });
});

describe("installment-vs-cash api bridges", () => {
  it("mapeia as bridges de meta e despesa planejada", async () => {
    const post = jest
      .fn()
      .mockResolvedValueOnce({
        data: {
          goal: {
            id: "goal-1",
            title: "Compra planejada",
            description: null,
            category: null,
            target_amount: "1000.00",
            current_amount: "0.00",
            priority: 3,
            target_date: null,
            status: "active",
            created_at: "2026-03-20T10:00:00Z",
            updated_at: "2026-03-20T10:00:00Z",
          },
          simulation: {
            id: "sim-1",
            user_id: "user-1",
            tool_id: "installment_vs_cash",
            rule_version: "2026.1",
            inputs: calculationDto.input,
            result: calculationDto.result,
            saved: true,
            goal_id: "goal-1",
            created_at: "2026-03-20T10:00:00Z",
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          transactions: [
            {
              id: "txn-1",
              title: "Compra planejada",
              amount: "200.00",
              type: "expense",
              due_date: "2026-04-20",
              start_date: null,
              end_date: null,
              description: null,
              observation: null,
              is_recurring: false,
              is_installment: true,
              installment_count: 6,
              tag_id: null,
              account_id: null,
              credit_card_id: null,
              status: "pending",
              currency: "BRL",
              created_at: "2026-03-20T10:00:00Z",
              updated_at: "2026-03-20T10:00:00Z",
            },
          ],
          simulation: {
            id: "sim-1",
            user_id: "user-1",
            tool_id: "installment_vs_cash",
            rule_version: "2026.1",
            inputs: calculationDto.input,
            result: calculationDto.result,
            saved: true,
            goal_id: null,
            created_at: "2026-03-20T10:00:00Z",
          },
        },
      });

    const api = createInstallmentVsCashService({ get: jest.fn(), post });
    const goal = await api.createGoalFromSimulation("sim-1", {
      title: "Compra planejada",
      selectedOption: "cash",
      currentAmount: 0,
    });
    const expense = await api.createPlannedExpenseFromSimulation("sim-1", {
      title: "Compra planejada",
      selectedOption: "installment",
    });

    expect(goal.goal.id).toBe("goal-1");
    expect(expense.transactions[0]?.id).toBe("txn-1");
  });
});
