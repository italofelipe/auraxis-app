/**
 * Maps the i18n message keys emitted by the ported web calculators to
 * pt-BR copy. Mobile does not depend on i18n yet, so we keep the
 * translations next to the calculator wiring and expose a tiny lookup.
 */
const MESSAGES: Readonly<Record<string, string>> = {
  // generic
  "errors.grossSalaryRequired": "Informe o salário bruto.",
  "errors.dependentsInvalid": "Informe um número de dependentes válido.",
  // salario-liquido / inss-ir-folha
  "errors.alimentPensionNegative": "Pensão alimentícia não pode ser negativa.",
  "errors.privatePensionNegative": "Previdência privada não pode ser negativa.",
  // hora-extra
  "errors.hoursNegative": "Quantidade de horas não pode ser negativa.",
  "errors.noOvertimeHours": "Informe pelo menos algumas horas extras.",
  "errors.hoursPerMonthInvalid": "Informe a carga mensal padrão (ex: 200).",
  // mei
  "errors.revenueRequired": "Informe o faturamento mensal.",
  // thirteenth-salary
  "errors.monthsWorkedRange": "Meses trabalhados deve estar entre 1 e 12.",
  // clt-vs-pj
  "errors.cltGrossSalaryRequired": "Informe o salário bruto CLT.",
  "errors.pjMonthlyInvoiceRequired": "Informe o faturamento PJ mensal.",
  "errors.meiLimitExceeded": "MEI tem limite anual de R$ 81.000.",
  // rescisão
  "errors.yearsOfServiceInvalid": "Informe os anos de serviço.",
  "errors.monthsFor13Invalid": "Meses do 13º deve estar entre 0 e 12.",
  "errors.monthsForVacationInvalid": "Meses para férias deve estar entre 0 e 12.",
  "errors.daysWorkedInLastMonthInvalid": "Dias trabalhados no último mês deve estar entre 0 e 30.",
  "errors.overtimeAverageNegative": "Média de horas extras não pode ser negativa.",
  "errors.fgtsBalanceNegative": "Saldo do FGTS não pode ser negativo.",
  // reserva-emergencia
  "errors.expensesRequired": "Informe seus gastos mensais.",
  "errors.contributionRequired": "Informe quanto pretende aportar por mês.",
  // orcamento-50-30-20
  "errors.incomeRequired": "Informe sua renda líquida mensal.",
  // conversor-moeda
  "errors.amountRequired": "Informe um valor maior que zero.",
  "errors.rateRequired": "Informe a taxa manual ou aguarde a cotação.",
  // cet
  "errors.loanAmountRequired": "Informe o valor do empréstimo.",
  "errors.termRequired": "Informe o prazo em meses.",
  // financiamento-imobiliario
  "errors.propertyValueRequired": "Informe o valor do imóvel.",
  "errors.annualRateRequired": "Informe a taxa anual de juros.",
  "errors.downPaymentPctRange": "Entrada deve ficar entre 0% e 95%.",
  "errors.termMonthsRange": "Prazo deve ficar entre 1 e 360 meses.",
  // aluguel-vs-compra
  "errors.monthlyRentRequired": "Informe o aluguel mensal.",
  "errors.downPaymentRequired": "Informe a entrada disponível.",
  // tesouro-direto
  "errors.taxaIndicativaRequired": "Informe a taxa indicativa do título.",
  "errors.termDaysRequired": "Informe o prazo em dias.",
  // fire
  "errors.retirementAgeAfterCurrent": "Idade de aposentadoria precisa ser maior que a atual.",
  "errors.returnRequired": "Informe a rentabilidade esperada.",
  // fgts (yearsOfServiceInvalid já registrado acima para rescisão)
  "errors.monthsOfServiceInvalid": "Meses extras precisam estar entre 0 e 11.",
  "errors.currentBalanceInvalid": "Saldo atual não pode ser negativo.",
  // ferias
  "errors.abonoRequiresMinRestDays": "Abono pecuniário exige no mínimo 20 dias de descanso.",
  // fii
  "errors.tickerRequired": "Informe o ticker do FII.",
  "errors.historyMonthsOutOfRange": "Meses do histórico devem ficar entre 1 e 24.",
  // dividir-conta
  "errors.totalRequired": "Informe o valor total da conta.",
  "errors.minPeople": "Conta precisa ser dividida entre pelo menos 2 pessoas.",
  "errors.allAmountsRequired": "Informe o consumo de cada pessoa.",
  "errors.invalidFee": "Taxa de serviço deve ficar entre 0% e 100%.",
  "errors.invalidTip": "Gorjeta deve ficar entre 0% e 100%.",
  // quitacao-dividas
  "errors.atLeastOneDebtRequired": "Adicione pelo menos uma dívida.",
  "errors.minTwoDebts": "Adicione pelo menos duas dívidas para comparar estratégias.",
  // custo-estilo-vida
  "errors.atLeastOneExpenseRequired": "Adicione pelo menos uma despesa.",
  "errors.horizonRequired": "Informe o horizonte em anos.",
};

/**
 * Resolves a calculator error key to its pt-BR copy.
 * Falls back to a generic "campo inválido" string for unknown keys.
 *
 * @param key Message key emitted by the validator.
 * @returns Translated message.
 */
export const resolveCalculatorError = (key: string): string =>
  MESSAGES[key] ?? "Campo inválido. Confira e tente novamente.";
