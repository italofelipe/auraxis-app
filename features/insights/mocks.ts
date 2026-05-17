import type { UserInsight } from "@/features/insights/contracts";

export const weeklyInsightFixture: UserInsight = {
  id: "insight-weekly-1",
  content:
    "Voce manteve as despesas essenciais sob controle e abriu espaco para investir mais sem cortar tudo que gosta.",
  keyMetric: "Voce economizou R$ 320 nesta semana",
  items: [
    {
      type: "weekly_cashflow",
      title: "Fluxo de caixa",
      message:
        "As entradas superaram as saidas e mantiveram a semana com saldo positivo.",
      evidence: ["current_period.net_balance"],
    },
    {
      type: "budget_alert",
      title: "Orcamento sob controle",
      message: "As categorias essenciais ficaram abaixo do limite planejado.",
    },
  ],
  summary: {
    headline: "Semana mais equilibrada",
    net_balance: 320,
  },
  periodType: "weekly",
  periodLabel: "Semana 19 · 2026",
  periodStart: "2026-05-04T00:00:00.000Z",
  periodEnd: "2026-05-10T23:59:59.000Z",
  status: "delivered",
  generatedAt: "2026-05-11T09:00:00.000Z",
  readAt: null,
  metadata: {
    model: "gpt-4o-mini",
    tokensUsed: 642,
    costUsd: 0.0038,
    cached: false,
    contextVersion: "financial_insight_snapshot.v1",
  },
};

export const dailyInsightFixture: UserInsight = {
  ...weeklyInsightFixture,
  id: "insight-daily-1",
  keyMetric: "Hoje voce gastou menos que a media",
  periodType: "daily",
  periodLabel: "2026-05-17",
  periodStart: "2026-05-17T00:00:00.000Z",
  periodEnd: "2026-05-17T23:59:59.000Z",
  items: [
    {
      type: "daily_comparison",
      title: "Dia abaixo da media",
      message: "Os gastos de hoje ficaram 18% abaixo da media dos ultimos dias.",
      evidence: ["current_period.expense_total", "comparison.previous_days_average"],
    },
  ],
  summary: {
    headline: "Dia positivo para o caixa",
  },
};

export const monthlyInsightFixture: UserInsight = {
  ...weeklyInsightFixture,
  id: "insight-monthly-1",
  keyMetric: "Maio esta com economia acumulada",
  periodType: "monthly",
  periodLabel: "2026-05",
  periodStart: "2026-05-01T00:00:00.000Z",
  periodEnd: "2026-05-31T23:59:59.000Z",
  items: [
    {
      type: "monthly_savings",
      title: "Economia acumulada",
      message: "O mes esta projetado para fechar com sobra maior que abril.",
      evidence: ["current_period.projected_balance"],
    },
  ],
  summary: {
    headline: "Mes em ritmo de economia",
  },
};
