/**
 * Domain model for the Salário Líquido CLT calculator (#622).
 *
 * Computes net salary from gross, applying INSS, IRRF, VT, VA/VR,
 * health plan, union contribution, alimony and PGBL deductions.
 * Also computes the employer cost breakdown.
 */

import { calcInss, calcIrrfFromGross, IRRF_PER_DEPENDENT_DEDUCTION, BR_TAX_TABLE_YEAR } from "./br-tax-tables";
import { round2 } from "./math-utils";

export { BR_TAX_TABLE_YEAR };

export const SALARIO_LIQUIDO_PUBLIC_PATH = "/tools/salario-liquido";

// ─── Form state ──────────────────────────────────────────────────────────────

export interface SalarioLiquidoFormState extends Record<string, unknown> {
  grossSalary: number | null;
  dependents: number;
  alimonyPct: number;
  vtOptOut: boolean;
  vtPct: number;
  vaVrDiscount: number;
  healthPlanDiscount: number;
  unionContribution: boolean;
  pgblPct: number;
}

/**
 * @returns Default form state for salário líquido.
 */
export function createDefaultSalarioLiquidoFormState(): SalarioLiquidoFormState {
  return {
    grossSalary: null,
    dependents: 0,
    alimonyPct: 0,
    vtOptOut: false,
    vtPct: 6,
    vaVrDiscount: 0,
    healthPlanDiscount: 0,
    unionContribution: false,
    pgblPct: 0,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface SalarioLiquidoValidationError {
  field: keyof SalarioLiquidoFormState;
  messageKey: string;
}

/**
 * @param form
 * @returns Validation errors, if any.
 */
export function validateSalarioLiquidoForm(
  form: SalarioLiquidoFormState,
): SalarioLiquidoValidationError[] {
  const errors: SalarioLiquidoValidationError[] = [];

  if (form.grossSalary === null || form.grossSalary <= 0) {
    errors.push({ field: "grossSalary", messageKey: "errors.grossSalaryRequired" });
  }

  return errors;
}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface SalarioLiquidoDeduction {
  label: string;
  amount: number;
}

export interface SalarioLiquidoResult {
  grossSalary: number;
  inss: number;
  irrf: number;
  vtDiscount: number;
  vaVrDiscount: number;
  healthPlanDiscount: number;
  unionDiscount: number;
  alimonyDiscount: number;
  totalDeductions: number;
  netSalary: number;
  deductions: SalarioLiquidoDeduction[];
  employerFgts: number;
  employerInss: number;
  employerTotal: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPLOYER_FGTS_RATE = 0.08;
const EMPLOYER_INSS_RATE = 0.20;
const MAX_PGBL_PCT = 12;

// ─── Helpers ────────────────────────────────────────────────────────────────

interface DiscountBreakdown {
  inss: number;
  irrf: number;
  vtDiscount: number;
  vaVrDiscount: number;
  healthPlanDiscount: number;
  unionDiscount: number;
  alimonyDiscount: number;
}

/**
 * @param gross
 * @param form
 * @returns Individual discount amounts.
 */
function computeDiscounts(gross: number, form: SalarioLiquidoFormState): DiscountBreakdown {
  const inss = calcInss(gross);
  const pgblDeduction = round2(gross * Math.min(form.pgblPct, MAX_PGBL_PCT) / 100);
  const dependentDeduction = form.dependents * IRRF_PER_DEPENDENT_DEDUCTION;
  const taxableBase = gross - inss - dependentDeduction - pgblDeduction;
  const irrf = calcIrrfFromGross(taxableBase + inss + dependentDeduction, inss, form.dependents);
  return {
    inss,
    irrf,
    vtDiscount: form.vtOptOut ? 0 : round2(gross * form.vtPct / 100),
    vaVrDiscount: round2(form.vaVrDiscount),
    healthPlanDiscount: round2(form.healthPlanDiscount),
    unionDiscount: form.unionContribution ? round2(gross / 30) : 0,
    alimonyDiscount: round2(gross * form.alimonyPct / 100),
  };
}

/**
 * @param d Discount breakdown.
 * @returns Labelled deduction list (non-zero items only).
 */
function buildDeductionList(d: DiscountBreakdown): SalarioLiquidoDeduction[] {
  const list: SalarioLiquidoDeduction[] = [
    { label: "INSS", amount: d.inss },
    { label: "IRRF", amount: d.irrf },
  ];
  if (d.vtDiscount > 0) { list.push({ label: "Vale-Transporte", amount: d.vtDiscount }); }
  if (d.vaVrDiscount > 0) { list.push({ label: "VA/VR", amount: d.vaVrDiscount }); }
  if (d.healthPlanDiscount > 0) { list.push({ label: "Plano de Saúde", amount: d.healthPlanDiscount }); }
  if (d.unionDiscount > 0) { list.push({ label: "Contribuição Sindical", amount: d.unionDiscount }); }
  if (d.alimonyDiscount > 0) { list.push({ label: "Pensão Alimentícia", amount: d.alimonyDiscount }); }
  return list;
}

// ─── Calculation ─────────────────────────────────────────────────────────────

/**
 * @param form
 * @returns Salário líquido result with deductions and employer cost.
 */
export function calculateSalarioLiquido(form: SalarioLiquidoFormState): SalarioLiquidoResult {
  const gross = form.grossSalary ?? 0;
  const d = computeDiscounts(gross, form);

  const totalDeductions = round2(
    d.inss + d.irrf + d.vtDiscount + d.vaVrDiscount + d.healthPlanDiscount + d.unionDiscount + d.alimonyDiscount,
  );
  const employerFgts = round2(gross * EMPLOYER_FGTS_RATE);
  const employerInss = round2(gross * EMPLOYER_INSS_RATE);

  return {
    grossSalary: gross,
    ...d,
    totalDeductions,
    netSalary: round2(gross - totalDeductions),
    deductions: buildDeductionList(d),
    employerFgts,
    employerInss,
    employerTotal: round2(gross + employerFgts + employerInss),
  };
}
