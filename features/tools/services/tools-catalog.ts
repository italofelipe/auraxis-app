import type {
  ToolCategory,
  ToolDefinition,
  ToolsCatalog,
} from "@/features/tools/contracts";

/**
 * Hand-authored catalog mirroring the web `/tools` baseline (60+ entries).
 *
 * Each entry encodes whether the tool is functional today (`enabled` +
 * `route`) or backlog ("Em breve"). The functional set in this revision
 * is intentionally small — installment-vs-cash and the salary simulator
 * (already mounted under /perfil/...). The remaining 50+ entries set
 * the user expectation and feed the search bar before we begin shipping
 * each tool individually.
 */
const RAW_CATALOG: readonly ToolDefinition[] = [
  // ── Salário & Trabalho ─────────────────────────────────────────────
  {
    id: "salary-net-clt",
    slug: "salario-liquido",
    name: "Salário líquido CLT",
    description: "Calcule o líquido a receber descontando INSS, IR e benefícios.",
    category: "salary-and-work",
    enabled: false,
  },
  {
    id: "inss-ir-payroll",
    slug: "inss-ir-folha",
    name: "INSS e IR na folha",
    description: "Quanto sai da sua folha de pagamento por mês.",
    category: "salary-and-work",
    enabled: false,
  },
  {
    id: "thirteenth-salary",
    slug: "decimo-terceiro",
    name: "13º salário",
    description: "Estime as duas parcelas e o valor total no fim do ano.",
    category: "salary-and-work",
    enabled: false,
  },
  {
    id: "overtime",
    slug: "hora-extra",
    name: "Hora extra",
    description: "Cálculo com adicional de 50% e 100% conforme a CLT.",
    category: "salary-and-work",
    enabled: false,
  },
  {
    id: "termination",
    slug: "rescisao",
    name: "Rescisão",
    description: "Direitos por demissão sem justa causa, pedido ou acordo.",
    category: "salary-and-work",
    enabled: false,
  },
  {
    id: "clt-vs-pj",
    slug: "clt-vs-pj",
    name: "CLT vs PJ",
    description: "Compare líquido e benefícios entre os dois regimes.",
    category: "salary-and-work",
    enabled: false,
  },
  {
    id: "mei-monthly",
    slug: "mei",
    name: "MEI mensal",
    description: "DAS, faturamento e enquadramento simplificado.",
    category: "salary-and-work",
    enabled: false,
  },
  {
    id: "salary-raise",
    slug: "pedir-aumento",
    name: "Pedir aumento",
    description: "Recomposição da inflação + ganho real desejado.",
    category: "salary-and-work",
    enabled: false,
  },
  {
    id: "vacation",
    slug: "ferias",
    name: "Férias",
    description: "Estime férias e abono pecuniário sobre seu salário.",
    category: "salary-and-work",
    enabled: false,
  },
  {
    id: "fgts-balance",
    slug: "fgts",
    name: "FGTS",
    description: "Projeção do saldo FGTS e simulação de saque.",
    category: "salary-and-work",
    enabled: false,
  },

  // ── Investimentos ──────────────────────────────────────────────────
  {
    id: "compound-interest",
    slug: "juros-compostos",
    name: "Juros compostos",
    description: "Quanto seu dinheiro rende com aporte mensal recorrente.",
    category: "investments",
    enabled: false,
  },
  {
    id: "cdb-lci-lca",
    slug: "cdb-lci-lca",
    name: "CDB · LCI · LCA",
    description: "Compare rentabilidade líquida entre os principais títulos.",
    category: "investments",
    enabled: false,
  },
  {
    id: "treasury",
    slug: "tesouro-direto",
    name: "Tesouro Direto",
    description: "Selic, IPCA+, prefixado e custos do investimento.",
    category: "investments",
    enabled: false,
  },
  {
    id: "fii",
    slug: "fii",
    name: "FII (Fundos imobiliários)",
    description: "Yield, distribuição e rendimento mensal estimado.",
    category: "investments",
    enabled: false,
  },
  {
    id: "etf",
    slug: "etf",
    name: "ETF",
    description: "Custo médio, taxas e impacto da bolsa.",
    category: "investments",
    enabled: false,
  },
  {
    id: "fire",
    slug: "fire",
    name: "FIRE",
    description: "Quando seu patrimônio paga seu custo de vida.",
    category: "investments",
    enabled: false,
  },
  {
    id: "ipca-correction",
    slug: "correcao-ipca",
    name: "Correção IPCA",
    description: "Atualize valores antigos pela inflação acumulada.",
    category: "investments",
    enabled: false,
  },
  {
    id: "broker-fees",
    slug: "custos-corretagem",
    name: "Custos de corretagem",
    description: "Estime spreads, IRs e taxa de custódia por estratégia.",
    category: "investments",
    enabled: false,
  },

  // ── Dívidas & Financiamento ────────────────────────────────────────
  {
    id: "debt-payoff",
    slug: "quitacao-dividas",
    name: "Quitação de dívidas",
    description: "Estratégia bola-de-neve vs avalanche para sair do vermelho.",
    category: "debt-and-financing",
    enabled: false,
  },
  {
    id: "loan-simulator",
    slug: "emprestimo",
    name: "Empréstimo pessoal",
    description: "Parcela, CET e custo total de um empréstimo bancário.",
    category: "debt-and-financing",
    enabled: false,
  },
  {
    id: "cet-calculator",
    slug: "cet",
    name: "CET — Custo Efetivo Total",
    description: "Compare ofertas pelo CET, não pela taxa nominal.",
    category: "debt-and-financing",
    enabled: false,
  },
  {
    id: "mortgage",
    slug: "financiamento-imovel",
    name: "Financiamento imobiliário",
    description: "Compare SAC vs PRICE para o seu imóvel.",
    category: "debt-and-financing",
    enabled: false,
  },
  {
    id: "vehicle-financing",
    slug: "financiamento-veiculo",
    name: "Financiamento de veículo",
    description: "Entrada, parcelas e o custo real do carro.",
    category: "debt-and-financing",
    enabled: false,
  },
  {
    id: "credit-card-revolver",
    slug: "rotativo-cartao",
    name: "Rotativo do cartão",
    description: "Simulação do juro do crédito rotativo e cenários de quitação.",
    category: "debt-and-financing",
    enabled: false,
  },
  {
    id: "consigned-loan",
    slug: "credito-consignado",
    name: "Crédito consignado",
    description: "Margem consignável e parcela ideal do empréstimo.",
    category: "debt-and-financing",
    enabled: false,
  },

  // ── Imóvel ─────────────────────────────────────────────────────────
  {
    id: "rent-vs-buy",
    slug: "alugar-vs-comprar",
    name: "Alugar vs comprar",
    description: "Compare cenários de alugar versus comprar com financiamento.",
    category: "real-estate",
    enabled: false,
  },
  {
    id: "iptu",
    slug: "iptu",
    name: "IPTU",
    description: "Estimativa anual de IPTU para o seu imóvel.",
    category: "real-estate",
    enabled: false,
  },
  {
    id: "itbi",
    slug: "itbi",
    name: "ITBI",
    description: "Imposto de transmissão na compra de imóvel.",
    category: "real-estate",
    enabled: false,
  },
  {
    id: "rental-yield",
    slug: "rentabilidade-aluguel",
    name: "Rentabilidade de aluguel",
    description: "Yield do imóvel para aluguel residencial ou Airbnb.",
    category: "real-estate",
    enabled: false,
  },

  // ── Dia a dia ──────────────────────────────────────────────────────
  {
    id: "installment-vs-cash",
    slug: "parcelado-vs-a-vista",
    name: "Parcelado vs à vista",
    description: "Vale a pena parcelar ou à vista com desconto?",
    category: "daily-life",
    enabled: true,
    route: "/installment-vs-cash",
  },
  {
    id: "salary-simulator",
    slug: "simulador-salario",
    name: "Simulador de salário (em /perfil)",
    description: "Reajuste salarial considerando inflação e ganho real.",
    category: "daily-life",
    enabled: true,
    route: "/simulador-salario",
  },
  {
    id: "goal-simulator",
    slug: "simulador-meta",
    name: "Simulador de meta",
    description: "Quanto guardar por mês para atingir uma meta no prazo.",
    category: "daily-life",
    enabled: true,
    route: "/simulador-meta",
  },
  {
    id: "fifty-thirty-twenty",
    slug: "alocacao-50-30-20",
    name: "Alocação 50-30-20",
    description: "Distribua sua renda em essenciais, desejos e investimentos.",
    category: "daily-life",
    enabled: false,
  },
  {
    id: "emergency-fund",
    slug: "reserva-emergencia",
    name: "Reserva de emergência",
    description: "Quanto você precisa para 3, 6 ou 12 meses de despesas.",
    category: "daily-life",
    enabled: false,
  },
  {
    id: "currency-converter",
    slug: "conversor-moedas",
    name: "Conversor de moedas",
    description: "Cotação ao vivo via BRAPI para USD, EUR e mais.",
    category: "daily-life",
    enabled: false,
  },
  {
    id: "split-bill",
    slug: "dividir-conta",
    name: "Dividir conta",
    description: "Rateio justo entre amigos com gorjeta e pesos.",
    category: "daily-life",
    enabled: false,
  },
  {
    id: "monthly-fuel",
    slug: "combustivel-mensal",
    name: "Combustível mensal",
    description: "Estime gasto de combustível por preço, KM e consumo.",
    category: "daily-life",
    enabled: false,
  },
  {
    id: "subscription-audit",
    slug: "auditoria-assinaturas",
    name: "Auditoria de assinaturas",
    description: "Liste todas as assinaturas recorrentes e o impacto anual.",
    category: "daily-life",
    enabled: false,
  },
  {
    id: "cost-of-lifestyle",
    slug: "custo-estilo-de-vida",
    name: "Custo do estilo de vida",
    description: "Quanto custa o padrão de vida que você quer ter.",
    category: "daily-life",
    enabled: false,
  },
];

const DEFAULT_CATALOG: ToolsCatalog = {
  tools: [...RAW_CATALOG],
};

export const getCanonicalToolsCatalog = (): ToolsCatalog => DEFAULT_CATALOG;

export const TOOL_CATEGORY_LABELS: Readonly<Record<ToolCategory, string>> = {
  "salary-and-work": "Salário e trabalho",
  investments: "Investimentos",
  "debt-and-financing": "Dívidas e financiamento",
  "real-estate": "Imóvel",
  "daily-life": "Dia a dia",
};
