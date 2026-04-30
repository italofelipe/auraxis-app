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
