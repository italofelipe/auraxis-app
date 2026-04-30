import type {
  ToolCategory,
  ToolDefinition,
  ToolsCatalog,
} from "@/features/tools/contracts";

/**
 * Compact seed for a tool entry: `[id, slug, name, description]`.
 * Routes for functional tools live separately in {@link FUNCTIONAL_ROUTES}
 * so the per-tool seed stays a single line.
 */
type ToolSeed = readonly [
  id: string,
  slug: string,
  name: string,
  description: string,
];

const FUNCTIONAL_ROUTES: ReadonlyMap<string, string> = new Map([
  ["installment-vs-cash", "/installment-vs-cash"],
  ["salary-simulator", "/simulador-salario"],
  ["goal-simulator", "/simulador-meta"],
  ["compound-interest", "/juros-compostos"],
  ["cdb-lci-lca", "/cdb-lci-lca"],
]);

// No tool is premium-gated yet. Premium gating returns when the first
// paywalled tool ships — the contract's optional `requiresPremium`
// field stays open for it.
const buildTool = (
  category: ToolCategory,
  seed: ToolSeed,
): ToolDefinition => {
  const [id, slug, name, description] = seed;
  const route = FUNCTIONAL_ROUTES.get(id);
  return {
    id,
    slug,
    name,
    description,
    category,
    enabled: route !== undefined,
    ...(route !== undefined && { route }),
  };
};

const buildCategory = (
  category: ToolCategory,
  seeds: readonly ToolSeed[],
): readonly ToolDefinition[] =>
  seeds.map((seed) => buildTool(category, seed));

// ── Salário & Trabalho ─────────────────────────────────────────────
const SALARY_AND_WORK: readonly ToolSeed[] = [
  ["salary-net-clt", "salario-liquido", "Salário líquido CLT", "Calcule o líquido a receber descontando INSS, IR e benefícios."],
  ["inss-ir-payroll", "inss-ir-folha", "INSS e IR na folha", "Quanto sai da sua folha de pagamento por mês."],
  ["thirteenth-salary", "decimo-terceiro", "13º salário", "Estime as duas parcelas e o valor total no fim do ano."],
  ["overtime", "hora-extra", "Hora extra", "Cálculo com adicional de 50% e 100% conforme a CLT."],
  ["termination", "rescisao", "Rescisão", "Direitos por demissão sem justa causa, pedido ou acordo."],
  ["clt-vs-pj", "clt-vs-pj", "CLT vs PJ", "Compare líquido e benefícios entre os dois regimes."],
  ["mei-monthly", "mei", "MEI mensal", "DAS, faturamento e enquadramento simplificado."],
  ["salary-raise", "pedir-aumento", "Pedir aumento", "Recomposição da inflação + ganho real desejado."],
  ["vacation", "ferias", "Férias", "Estime férias e abono pecuniário sobre seu salário."],
  ["fgts-balance", "fgts", "FGTS", "Projeção do saldo FGTS e simulação de saque."],
];

// ── Investimentos ──────────────────────────────────────────────────
const INVESTMENTS: readonly ToolSeed[] = [
  ["compound-interest", "juros-compostos", "Juros compostos", "Quanto seu dinheiro rende com aporte mensal recorrente."],
  ["cdb-lci-lca", "cdb-lci-lca", "CDB · LCI · LCA", "Compare rentabilidade líquida entre os principais títulos."],
  ["treasury", "tesouro-direto", "Tesouro Direto", "Selic, IPCA+, prefixado e custos do investimento."],
  ["fii", "fii", "FII (Fundos imobiliários)", "Yield, distribuição e rendimento mensal estimado."],
  ["etf", "etf", "ETF", "Custo médio, taxas e impacto da bolsa."],
  ["fire", "fire", "FIRE", "Quando seu patrimônio paga seu custo de vida."],
  ["ipca-correction", "correcao-ipca", "Correção IPCA", "Atualize valores antigos pela inflação acumulada."],
  ["broker-fees", "custos-corretagem", "Custos de corretagem", "Estime spreads, IRs e taxa de custódia por estratégia."],
];

// ── Dívidas & Financiamento ────────────────────────────────────────
const DEBT_AND_FINANCING: readonly ToolSeed[] = [
  ["debt-payoff", "quitacao-dividas", "Quitação de dívidas", "Estratégia bola-de-neve vs avalanche para sair do vermelho."],
  ["loan-simulator", "emprestimo", "Empréstimo pessoal", "Parcela, CET e custo total de um empréstimo bancário."],
  ["cet-calculator", "cet", "CET — Custo Efetivo Total", "Compare ofertas pelo CET, não pela taxa nominal."],
  ["mortgage", "financiamento-imovel", "Financiamento imobiliário", "Compare SAC vs PRICE para o seu imóvel."],
  ["vehicle-financing", "financiamento-veiculo", "Financiamento de veículo", "Entrada, parcelas e o custo real do carro."],
  ["credit-card-revolver", "rotativo-cartao", "Rotativo do cartão", "Simulação do juro do crédito rotativo e cenários de quitação."],
  ["consigned-loan", "credito-consignado", "Crédito consignado", "Margem consignável e parcela ideal do empréstimo."],
];

// ── Imóvel ─────────────────────────────────────────────────────────
const REAL_ESTATE: readonly ToolSeed[] = [
  ["rent-vs-buy", "alugar-vs-comprar", "Alugar vs comprar", "Compare cenários de alugar versus comprar com financiamento."],
  ["iptu", "iptu", "IPTU", "Estimativa anual de IPTU para o seu imóvel."],
  ["itbi", "itbi", "ITBI", "Imposto de transmissão na compra de imóvel."],
  ["rental-yield", "rentabilidade-aluguel", "Rentabilidade de aluguel", "Yield do imóvel para aluguel residencial ou Airbnb."],
];

// ── Dia a dia ──────────────────────────────────────────────────────
const DAILY_LIFE: readonly ToolSeed[] = [
  ["installment-vs-cash", "parcelado-vs-a-vista", "Parcelado vs à vista", "Vale a pena parcelar ou à vista com desconto?"],
  ["salary-simulator", "simulador-salario", "Simulador de salário (em /perfil)", "Reajuste salarial considerando inflação e ganho real."],
  ["goal-simulator", "simulador-meta", "Simulador de meta", "Quanto guardar por mês para atingir uma meta no prazo."],
  ["fifty-thirty-twenty", "alocacao-50-30-20", "Alocação 50-30-20", "Distribua sua renda em essenciais, desejos e investimentos."],
  ["emergency-fund", "reserva-emergencia", "Reserva de emergência", "Quanto você precisa para 3, 6 ou 12 meses de despesas."],
  ["currency-converter", "conversor-moedas", "Conversor de moedas", "Cotação ao vivo via BRAPI para USD, EUR e mais."],
  ["split-bill", "dividir-conta", "Dividir conta", "Rateio justo entre amigos com gorjeta e pesos."],
  ["monthly-fuel", "combustivel-mensal", "Combustível mensal", "Estime gasto de combustível por preço, KM e consumo."],
  ["subscription-audit", "auditoria-assinaturas", "Auditoria de assinaturas", "Liste todas as assinaturas recorrentes e o impacto anual."],
  ["cost-of-lifestyle", "custo-estilo-de-vida", "Custo do estilo de vida", "Quanto custa o padrão de vida que você quer ter."],
];

const CANONICAL_CATALOG: ToolsCatalog = {
  tools: [
    ...buildCategory("salary-and-work", SALARY_AND_WORK),
    ...buildCategory("investments", INVESTMENTS),
    ...buildCategory("debt-and-financing", DEBT_AND_FINANCING),
    ...buildCategory("real-estate", REAL_ESTATE),
    ...buildCategory("daily-life", DAILY_LIFE),
  ],
};

export const getCanonicalToolsCatalog = (): ToolsCatalog => CANONICAL_CATALOG;

export const TOOL_CATEGORY_LABELS: Readonly<Record<ToolCategory, string>> = {
  "salary-and-work": "Salário e trabalho",
  investments: "Investimentos",
  "debt-and-financing": "Dívidas e financiamento",
  "real-estate": "Imóvel",
  "daily-life": "Dia a dia",
};
