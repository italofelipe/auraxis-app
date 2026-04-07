import type { UserBootstrap } from "@/features/bootstrap/contracts";

export const userBootstrapFixture: UserBootstrap = {
  user: {
    identity: {
      id: "a6b9a8d2-7d50-47f5-954e-fc8cbb5825aa",
      name: "Italo Chagas",
      email: "italo@auraxis.com.br",
    },
    profile: {
      gender: "outro",
      birthDate: "1994-01-28",
      stateUf: "SP",
      occupation: "Founder",
    },
    financialProfile: {
      monthlyIncomeNet: 18000,
      monthlyExpenses: 7600,
      netWorth: 245000,
      initialInvestment: 10000,
      monthlyInvestment: 3500,
      investmentGoalDate: "2028-12-31",
    },
    investorProfile: {
      declared: "moderado",
      suggested: "moderado",
      quizScore: 9,
      taxonomyVersion: "2026.1",
      financialObjectives: "independencia",
    },
    productContext: {
      entitlementsVersion: 4,
    },
  },
  transactionsPreview: {
    items: [
      {
        id: "trx-1",
        title: "Conta de luz",
        amount: "185.43",
        type: "expense",
        status: "pending",
      },
      {
        id: "trx-2",
        title: "Salario",
        amount: "18000.00",
        type: "income",
        status: "paid",
      },
    ],
    returnedItems: 2,
    limit: 5,
    hasMore: true,
  },
  wallet: {
    items: [
      {
        id: "wallet-1",
        name: "Tesouro Selic",
        value: 45800,
        estimatedValueOnCreateDate: 43000,
        ticker: null,
        quantity: 1,
        assetClass: "fixed_income",
        annualRate: 11.2,
        targetWithdrawDate: null,
        registerDate: "2025-01-10",
        shouldBeOnWallet: true,
      },
    ],
    total: 4,
    returnedItems: 1,
    limit: 5,
    hasMore: true,
  },
};
