import type { InsightDimension } from "@/features/insights/contracts";
import type {
  InsightCadence,
  InsightFluidaVM,
  InsightHighlight,
  InsightRetroItem,
  InsightSeries,
} from "@/features/insights/fluida/contracts";
import {
  fluidaLeadFixture,
  type SelectFluidaLeadParams,
} from "@/features/insights/mocks/fluida-lead";

/**
 * Mock body for the full "Fluida" reading (etapa 2), keyed by dimension and
 * cadence. Each entry extends the etapa-1 lead (severity/title/lead/readMin)
 * with the editorial paragraphs, the comparative cards (`retro`, general
 * only), the numeric highlights and the shared outflow series. Copy is short
 * and anchored on plausible June/2026 figures from the design handoff
 * (`insights-data.js`) purely to demonstrate format and length.
 *
 * INTEGRATION POINT: when the AI-generation backend publishes its contract,
 * replace this fixture (and {@link selectFluidaVM}) with a query hook +
 * service mapper. The screen controller consumes only {@link selectFluidaVM},
 * so the swap is isolated to this module.
 */
export type FluidaVMFixture = Readonly<
  Record<InsightDimension, Readonly<Record<InsightCadence, InsightFluidaVM>>>
>;

/**
 * Shared outflow series for the rhythm chart. The design carries a single
 * `diaSerie`/`semanaSerie` reused across themes; the per-feature recortes
 * will diverge once the backend slices these by dimension.
 */
const SHARED_SERIES: InsightSeries = {
  // Outflow per day, 14–20 jun (the 19th is the heavy "Fatura Maio" day).
  daily: [1200, 0, 250, 0, 2650, 0, 11950],
  // Outflow per week, last 6 weeks (current week is the heaviest).
  weekly: [4200, 980, 3100, 1400, 9800, 13650],
};

const GENERAL_DAILY_RETRO: readonly InsightRetroItem[] = [
  {
    key: "yesterday",
    label: "Ontem · 20 jun",
    value: 156.3,
    sign: "neg",
    caption:
      "Apenas 1 lançamento (Mousepad bullpad). Dia leve, mas dentro de uma sequência de saídas altas.",
  },
  {
    key: "daybefore",
    label: "Anteontem · 19 jun",
    value: 11950,
    sign: "neg",
    caption:
      "O dia mais pesado do mês: Fatura Maio (R$ 11.000) atrasada + Pagamento Ikaro (R$ 950).",
  },
  {
    key: "vs_week",
    label: "vs. semana passada",
    value: 9800,
    sign: "pos",
    caption:
      "A semana atual gastou ~40% a mais que a anterior, puxada pela fatura em atraso.",
  },
];

const GENERAL_WEEKLY_RETRO: readonly InsightRetroItem[] = [
  {
    key: "yesterday",
    label: "Esta semana · 15–21 jun",
    value: 13650,
    sign: "neg",
    caption: "4 saídas, 0 entradas. Saldo da semana fortemente negativo.",
  },
  {
    key: "daybefore",
    label: "Semana anterior · 8–14 jun",
    value: 1450,
    sign: "neg",
    caption: "Internet + Visita Pedro. Ritmo de gasto saudável.",
  },
  {
    key: "vs_week",
    label: "Tendência (6 semanas)",
    value: 13650,
    sign: "neutral",
    caption: "Clara escalada nas últimas duas semanas, acima da média móvel.",
  },
];

interface FluidaBody {
  readonly paragraphs: readonly string[];
  readonly retro: readonly InsightRetroItem[];
  readonly highlights: readonly InsightHighlight[];
}

const NO_RETRO: readonly InsightRetroItem[] = [];

const BODIES: Readonly<Record<InsightDimension, Readonly<Record<InsightCadence, FluidaBody>>>> = {
  general: {
    daily: {
      retro: GENERAL_DAILY_RETRO,
      highlights: [
        { label: "Peso da Fatura Maio", value: "55%", sub: "de todas as despesas do mês" },
      ],
      paragraphs: [
        "A leitura de ontem precisa ser feita no contexto da semana. Isoladamente, o dia 20 foi tranquilo: um único gasto de R$ 156,30 em eletrônicos, sem impacto relevante sobre o saldo. O ponto de atenção não é o que aconteceu ontem, e sim o que ainda está pendente.",
        "A Fatura Maio, de R$ 11.000,00, segue marcada como atrasada e responde sozinha por 55% de todas as despesas do mês. Enquanto ela não for quitada, qualquer leitura de saldo positivo é otimista demais.",
        "Do lado das entradas, o mês depende de um único evento: o Salário gringo, de R$ 27.675,37, previsto para 30/06. Até lá, o caixa opera no vermelho corrente em vários dias.",
      ],
    },
    weekly: {
      retro: GENERAL_WEEKLY_RETRO,
      highlights: [
        { label: "Saldo da semana", value: "−R$ 13.650,00", sub: "4 saídas, nenhuma entrada" },
      ],
      paragraphs: [
        "A retrospectiva semanal mostra um padrão que não aparece no dia a dia: a conta passa semanas em ritmo controlado e, então, concentra obrigações grandes num intervalo curto. De 15 a 21 de junho, quatro lançamentos somaram R$ 13.650,00, contra R$ 1.450,00 da semana anterior.",
        "Dois itens dominam a semana. A Parcela de financiamento (R$ 2.650, recorrente) é previsível e saudável. Já a Fatura Maio (R$ 11.000, atrasada) é o evento anômalo que desequilibra a comparação com qualquer semana típica.",
        "Sem nenhuma receita na semana, o saldo semanal ficou em −R$ 13.650,00. Isso não significa que o mês fechará negativo — o salário de 30/06 reverte o número — mas evidencia a dependência de um único crédito mensal.",
      ],
    },
  },
  transactions: {
    daily: {
      retro: NO_RETRO,
      highlights: [
        { label: "Maior gasto do mês", value: "R$ 11.000,00", sub: "Fatura Maio · Cartão" },
        { label: "Único crédito", value: "R$ 27.675,37", sub: "Salário gringo · 30/06" },
        { label: "Gasto de ontem", value: "R$ 156,30", sub: "Eletrônicos" },
      ],
      paragraphs: [
        "O lançamento de ontem é pequeno e pontual — um mousepad em Eletrônicos. Não altera categorias nem orçamento de forma material; entra como consumo discricionário isolado.",
        "O retrato do mês, porém, é de concentração: das nove despesas, Fatura Maio (R$ 11.000) e Parcela de financiamento (R$ 2.650) somam 69% do total. As outras sete dividem o restante em valores pequenos a médios.",
      ],
    },
    weekly: {
      retro: NO_RETRO,
      highlights: [
        { label: "Saídas da semana", value: "R$ 13.650,00", sub: "4 lançamentos" },
        { label: "Em despesas fixas", value: "81%", sub: "Financiamento + recorrentes" },
        { label: "Atrasados", value: "3 itens", sub: "Fatura, Condomínio, Banho" },
      ],
      paragraphs: [
        "A semana é quase inteiramente composta por compromissos fixos e dívidas. A Fatura Maio responde por 81% do valor; a Parcela de financiamento, por mais 19%. Não há gasto variável relevante — o problema é de calendário e dívida, não de consumo impulsivo.",
        "Três itens aparecem como atrasados no mês (Fatura Maio, Condomínio, Banho do Caramelo), somando R$ 12.700. Vale checar se foram pagos fora do app.",
      ],
    },
  },
  credit_cards: {
    daily: {
      retro: NO_RETRO,
      highlights: [
        { label: "Fatura em atraso", value: "R$ 11.000,00", sub: "Maio · Inter" },
        { label: "Limite usado (Inter)", value: "44%", sub: "R$ 11.000 / R$ 25.000" },
        { label: "Compras ontem", value: "R$ 0,00", sub: "sem uso do crédito" },
      ],
      paragraphs: [
        "Não houve uso de cartão ontem, o que é positivo. A leitura de cartões hoje gira inteiramente em torno de uma fatura vencida: a de maio, R$ 11.000, que mantém 44% do limite do Inter ocupado.",
        "Enquanto essa fatura não baixa, o cartão opera com folga de limite reduzida e custo crescente. É o item de maior alavancagem negativa da conta inteira neste momento.",
      ],
    },
    weekly: {
      retro: NO_RETRO,
      highlights: [
        { label: "Fatura Maio", value: "R$ 11.000,00", sub: "em atraso" },
        { label: "% das despesas do mês", value: "55%", sub: "um único item" },
        { label: "Novas compras", value: "R$ 0,00", sub: "na semana" },
      ],
      paragraphs: [
        "A boa notícia da semana: você não adicionou novas compras ao crédito. A má: a dívida existente não andou. A Fatura Maio, sozinha, é 55% de todas as despesas do mês.",
        "Sem novas compras, o problema deixa de ser comportamental e passa a ser financeiro puro — é uma questão de liquidez e timing. O salário de 30/06 cobre a fatura com folga.",
      ],
    },
  },
  goals: {
    daily: {
      retro: NO_RETRO,
      highlights: [
        { label: "Viagem dos sonhos", value: "56%", sub: "R$ 8.450 / R$ 15.000" },
        { label: "Reserva de emergência", value: "67%", sub: "R$ 13.423 / R$ 20.000" },
        { label: "Aporte de ontem", value: "R$ 0,00", sub: "sem movimento" },
      ],
      paragraphs: [
        "As metas não tiveram movimentação ontem — comportamento esperado num mês em que o caixa está comprometido com a fatura em atraso. O progresso permanece o mesmo do dia anterior.",
        "A Reserva de emergência, em 67%, é o ponto positivo: cobre boa parte de um mês de despesas. Avançá-la antes da Viagem reduz a dependência do salário único.",
      ],
    },
    weekly: {
      retro: NO_RETRO,
      highlights: [
        { label: "Aportes na semana", value: "R$ 0,00", sub: "0 de 2 metas" },
        { label: "Falta p/ Viagem", value: "R$ 6.550,00", sub: "44% restante" },
        { label: "Falta p/ Reserva", value: "R$ 6.577,00", sub: "33% restante" },
      ],
      paragraphs: [
        "A semana não registrou aportes — coerente com o aperto de caixa, mas que cobra um custo: as duas metas ficaram estacionadas enquanto o tempo até os prazos diminui.",
        "A Viagem dos sonhos precisa de mais R$ 6.550. A Reserva, mais perto do alvo (faltam R$ 6.577), responde melhor a aportes pequenos e constantes.",
      ],
    },
  },
  budgets: {
    daily: {
      retro: NO_RETRO,
      highlights: [
        { label: "Despesa fixa", value: "50% do total", sub: "R$ 15.550,00" },
        { label: "Sem categoria", value: "R$ 15.325,08", sub: "a classificar" },
        { label: "Livre usado ontem", value: "R$ 156,30", sub: "Eletrônicos" },
      ],
      paragraphs: [
        "O lançamento de ontem é discricionário e pequeno, sem estourar nenhum teto. O alerta de orçamento está na qualidade da classificação: quase metade das saídas do mês está como Sem categoria.",
        "Com tanto valor não classificado, qualquer orçamento por categoria fica cego. Antes de apertar limites, o passo mais útil é categorizar — sobretudo a Fatura Maio.",
      ],
    },
    weekly: {
      retro: NO_RETRO,
      highlights: [
        { label: "Despesa fixa", value: "R$ 15.550,00", sub: "50% do total" },
        { label: "Sem categoria", value: "R$ 15.325,08", sub: "49% do total" },
        { label: "Demais", value: "R$ 175,00", sub: "Cartão" },
      ],
      paragraphs: [
        "A foto da semana confirma o diagnóstico do dia: o orçamento está dominado por dois blocos enormes — Despesa fixa (R$ 15.550) e Sem categoria (R$ 15.325). Juntos, são 99% das saídas.",
        "O bloco Sem categoria é grande porque a Fatura Maio entra nele. Classificar essa fatura e distribuí-la entre as áreas que a originaram revelaria o consumo real por trás do número.",
      ],
    },
  },
};

const buildVM = (
  dimension: InsightDimension,
  cadence: InsightCadence,
): InsightFluidaVM => {
  const body = BODIES[dimension][cadence];
  return {
    ...fluidaLeadFixture[dimension][cadence],
    paragraphs: body.paragraphs,
    retro: body.retro,
    highlights: body.highlights,
    series: SHARED_SERIES,
  };
};

const DIMENSIONS: readonly InsightDimension[] = [
  "general",
  "transactions",
  "credit_cards",
  "goals",
  "budgets",
];
const CADENCES: readonly InsightCadence[] = ["daily", "weekly"];

export const fluidaVMFixture: FluidaVMFixture = Object.fromEntries(
  DIMENSIONS.map((dimension) => [
    dimension,
    Object.fromEntries(
      CADENCES.map((cadence) => [cadence, buildVM(dimension, cadence)]),
    ),
  ]),
) as FluidaVMFixture;

/**
 * Selects the full mock VM for a given dimension and cadence.
 *
 * @param params Active dimension and cadence.
 * @returns The matching {@link InsightFluidaVM} from the fixture.
 */
export const selectFluidaVM = ({
  dimension,
  cadence,
}: SelectFluidaLeadParams): InsightFluidaVM => {
  return fluidaVMFixture[dimension][cadence];
};
