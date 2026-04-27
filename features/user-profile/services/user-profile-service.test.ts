import type { AxiosInstance } from "axios";

import { createUserProfileService } from "@/features/user-profile/services/user-profile-service";

const createClient = (): jest.Mocked<
  Pick<AxiosInstance, "get" | "put" | "post" | "patch">
> => {
  return {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  };
};

describe("userProfileService", () => {
  it("carrega o perfil do usuario", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          user: {
            id: "usr-1",
            name: "Italo",
            email: "italo@auraxis.dev",
            gender: "male",
            birth_date: "1994-01-01",
            monthly_income: 10000,
            monthly_income_net: 7600,
            net_worth: 50000,
            monthly_expenses: 3200,
            initial_investment: 1000,
            monthly_investment: 1500,
            investment_goal_date: "2030-12-01",
            state_uf: "SP",
            occupation: "Engineer",
            investor_profile: "entusiasta",
            financial_objectives: "independencia",
            investor_profile_suggested: "entusiasta",
            profile_quiz_score: 18,
            taxonomy_version: "2026.1",
          },
        },
      },
    });

    const service = createUserProfileService(client as unknown as AxiosInstance);
    const result = await service.getProfile();

    expect(client.get).toHaveBeenCalledWith("/user/profile");
    expect(result).toEqual(
      expect.objectContaining({
        id: "usr-1",
        birthDate: "1994-01-01",
        monthlyIncomeNet: 7600,
        stateUf: "SP",
        investorProfileSuggested: "entusiasta",
      }),
    );
  });

  it("atualiza o perfil do usuario", async () => {
    const client = createClient();
    client.put.mockResolvedValue({
      data: {
        data: {
          user: {
            id: "usr-1",
            name: "Italo",
            email: "italo@auraxis.dev",
            gender: null,
            birth_date: null,
            monthly_income: 12000,
            monthly_income_net: 9000,
            net_worth: 70000,
            monthly_expenses: 4000,
            initial_investment: 1500,
            monthly_investment: 2200,
            investment_goal_date: null,
            state_uf: "RJ",
            occupation: "Founder",
            investor_profile: "explorador",
            financial_objectives: "crescimento",
            investor_profile_suggested: "explorador",
            profile_quiz_score: 21,
            taxonomy_version: "2026.1",
          },
        },
      },
    });

    const service = createUserProfileService(client as unknown as AxiosInstance);
    const result = await service.updateProfile({
      monthlyIncome: 12000,
      stateUf: "RJ",
      investorProfile: "explorador",
    });

    expect(client.put).toHaveBeenCalledWith("/user/profile", {
      gender: undefined,
      birth_date: undefined,
      monthly_income: 12000,
      monthly_income_net: undefined,
      net_worth: undefined,
      monthly_expenses: undefined,
      initial_investment: undefined,
      monthly_investment: undefined,
      investment_goal_date: undefined,
      state_uf: "RJ",
      occupation: undefined,
      investor_profile: "explorador",
      financial_objectives: undefined,
    });
    expect(result).toEqual(
      expect.objectContaining({
        monthlyIncome: 12000,
        stateUf: "RJ",
        investorProfile: "explorador",
      }),
    );
  });
});

describe("userProfileService - salary simulator", () => {
  it("simula aumento salarial coergindo numeros do envelope", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: {
        data: { recomposition: "300.50", target: "5500.00" },
      },
    });

    const service = createUserProfileService(client as unknown as AxiosInstance);
    const result = await service.simulateSalaryIncrease({
      baseSalary: 5000,
      baseDate: "2024-01-01",
      discounts: 500,
      targetRealIncrease: 5,
    });

    expect(client.post).toHaveBeenCalledWith("/user/simulate-salary-increase", {
      base_salary: "5000.00",
      base_date: "2024-01-01",
      discounts: "500.00",
      target_real_increase: "5.00",
    });
    expect(result).toEqual({ recomposition: 300.5, target: 5500 });
  });

  it("simulateSalaryIncrease retorna zeros quando envelope vem vazio", async () => {
    const client = createClient();
    client.post.mockResolvedValue({ data: { data: {} } });
    const service = createUserProfileService(client as unknown as AxiosInstance);
    const result = await service.simulateSalaryIncrease({
      baseSalary: 0,
      baseDate: "2024-01-01",
      discounts: 0,
      targetRealIncrease: 0,
    });
    expect(result).toEqual({ recomposition: 0, target: 0 });
  });
});

describe("userProfileService - notification preferences", () => {
  it("lista preferencias de notificacao mapeando snake_case", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          preferences: [
            { category: "alerts", enabled: true, global_opt_out: false },
            {
              category: "weekly_snapshot",
              enabled: false,
              global_opt_out: true,
            },
          ],
        },
      },
    });

    const service = createUserProfileService(client as unknown as AxiosInstance);
    const result = await service.listNotificationPreferences();

    expect(client.get).toHaveBeenCalledWith("/user/notification-preferences");
    expect(result.preferences).toEqual([
      { category: "alerts", enabled: true, globalOptOut: false },
      { category: "weekly_snapshot", enabled: false, globalOptOut: true },
    ]);
  });

  it("lista preferencias retorna lista vazia quando envelope vem sem dados", async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: { data: {} } });
    const service = createUserProfileService(client as unknown as AxiosInstance);
    const result = await service.listNotificationPreferences();
    expect(result.preferences).toEqual([]);
  });

  it("atualiza preferencias enviando snake_case e mapeia resposta", async () => {
    const client = createClient();
    client.patch.mockResolvedValue({
      data: {
        data: {
          preferences: [
            { category: "alerts", enabled: false, global_opt_out: false },
          ],
        },
      },
    });

    const service = createUserProfileService(client as unknown as AxiosInstance);
    const result = await service.updateNotificationPreferences({
      preferences: [
        { category: "alerts", enabled: false, globalOptOut: false },
      ],
    });

    expect(client.patch).toHaveBeenCalledWith(
      "/user/notification-preferences",
      {
        preferences: [
          { category: "alerts", enabled: false, global_opt_out: false },
        ],
      },
    );
    expect(result.preferences[0].enabled).toBe(false);
  });

  it("atualiza preferencias retorna lista vazia quando envelope vem sem dados", async () => {
    const client = createClient();
    client.patch.mockResolvedValue({ data: { data: {} } });
    const service = createUserProfileService(client as unknown as AxiosInstance);
    const result = await service.updateNotificationPreferences({
      preferences: [],
    });
    expect(result.preferences).toEqual([]);
  });
});
