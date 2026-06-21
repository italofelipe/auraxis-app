import type { InsightDimension } from "@/features/insights/contracts";
import type {
  InsightCadence,
  InsightLeadVM,
} from "@/features/insights/fluida/contracts";

/**
 * Mock editorial leads for the "Fluida" insights screen, keyed by
 * dimension and cadence. Copy is short and anchored on plausible
 * June/2026 figures purely to demonstrate format and length for etapa 1 —
 * the real content will come from the AI generation backend later. Reading
 * times follow the handoff guidance (daily ~3 min per theme / ~15 min
 * geral; weekly ~5 min per theme / ~30 min geral).
 */
export type FluidaLeadFixture = Readonly<
  Record<InsightDimension, Readonly<Record<InsightCadence, InsightLeadVM>>>
>;

export const fluidaLeadFixture: FluidaLeadFixture = {
  general: {
    daily: {
      dimension: "general",
      cadence: "daily",
      severity: "attention",
      title: "Ontem em foco: muita saída, nenhuma entrada",
      lead: "No dia 20/06 você teve uma única transação — Mousepad bullpad, R$ 156,30 — mas ela chega num mês já tensionado: as despesas somam R$ 19.906,30 contra R$ 27.675,37 de receita, e a maior parte do gasto está concentrada em poucos dias.",
      readMinutes: 15,
    },
    weekly: {
      dimension: "general",
      cadence: "weekly",
      severity: "attention",
      title: "A semana puxada pela fatura em atraso",
      lead: "A semana fechou ~40% acima da anterior, empurrada pela Fatura Maio (R$ 11.000) paga com atraso. A receita seguiu firme em R$ 27.675,37, então o caixa continua positivo — mas o fôlego encolheu.",
      readMinutes: 30,
    },
  },
  transactions: {
    daily: {
      dimension: "transactions",
      cadence: "daily",
      severity: "ok",
      title: "Dia leve, mas dentro de um mês concentrado",
      lead: "Ontem houve só Mousepad bullpad (R$ 156,30, Eletrônicos). No mês, 9 despesas e 1 receita; 70% do valor está em 2 lançamentos. O dia entra como consumo discricionário isolado, sem mexer em categorias.",
      readMinutes: 3,
    },
    weekly: {
      dimension: "transactions",
      cadence: "weekly",
      severity: "attention",
      title: "Poucos lançamentos, muito peso em dois deles",
      lead: "Foram 9 saídas na semana, mas Fatura Maio (R$ 11.000) e Parcela de financiamento (R$ 2.650) concentram 69% do total. As outras sete dividem o restante em valores pequenos e previsíveis.",
      readMinutes: 5,
    },
  },
  goals: {
    daily: {
      dimension: "goals",
      cadence: "daily",
      severity: "ok",
      title: "Metas seguem no plano, sem aporte hoje",
      lead: "Nenhum aporte ontem, e tudo bem: a Reserva de emergência está em 62% e a meta de Viagem em 38%, ambas dentro do ritmo do mês. O dia não altera a projeção de conclusão de nenhuma das duas.",
      readMinutes: 3,
    },
    weekly: {
      dimension: "goals",
      cadence: "weekly",
      severity: "attention",
      title: "Aportes desaceleraram na semana cheia de fatura",
      lead: "Com a Fatura Maio absorvendo o caixa, a semana não recebeu aportes para metas. A Reserva de emergência se mantém em 62%, mas sem aporte por mais duas semanas a meta de Viagem sai do prazo previsto.",
      readMinutes: 5,
    },
  },
  budgets: {
    daily: {
      dimension: "budgets",
      cadence: "daily",
      severity: "ok",
      title: "Orçamentos sob controle no fechamento do dia",
      lead: "O gasto de ontem (R$ 156,30 em Eletrônicos) cabe folgado no envelope de Compras, que segue em 44% do limite. Nenhum envelope passou de 80% e nenhuma categoria essencial ficou no vermelho.",
      readMinutes: 3,
    },
    weekly: {
      dimension: "budgets",
      cadence: "weekly",
      severity: "alert",
      title: "Cartão estourou o envelope na semana",
      lead: "O envelope de Cartão fechou a semana em 118% do limite por causa da Fatura Maio paga com atraso. Mercado e Transporte seguem saudáveis (abaixo de 70%), mas o estouro de Cartão exige remanejar o mês.",
      readMinutes: 5,
    },
  },
  credit_cards: {
    daily: {
      dimension: "credit_cards",
      cadence: "daily",
      severity: "ok",
      title: "Sem novas compras no cartão ontem",
      lead: "Nenhuma compra no crédito ontem — a única transação do dia foi no débito. A utilização do cartão segue em 41% do limite e a próxima fatura, com vencimento em julho, ainda está bem abaixo da de maio.",
      readMinutes: 3,
    },
    weekly: {
      dimension: "credit_cards",
      cadence: "weekly",
      severity: "alert",
      title: "Fatura Maio dominou a semana do cartão",
      lead: "A Fatura Maio (R$ 11.000), paga em atraso, foi o evento da semana e puxou a utilização para 73% do limite. Sem novas compras relevantes, mas o atraso gera juros e aperta o espaço da fatura seguinte.",
      readMinutes: 5,
    },
  },
};

export interface SelectFluidaLeadParams {
  readonly dimension: InsightDimension;
  readonly cadence: InsightCadence;
}

/**
 * Selects the mock lead VM for a given dimension and cadence.
 *
 * @param params Active dimension and cadence.
 * @returns The matching {@link InsightLeadVM} from the fixture.
 */
export const selectFluidaLead = ({
  dimension,
  cadence,
}: SelectFluidaLeadParams): InsightLeadVM => {
  return fluidaLeadFixture[dimension][cadence];
};
