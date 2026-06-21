import { monthKeyShort, shiftMonthKey } from "./billing-month";

/** Modo de pagamento da despesa. */
export type InstallmentMode = "avista" | "parcelado";

/** Plano de parcelamento resolvido. */
export interface InstallmentPlan {
  /** Entrada efetiva (clampada entre 0 e o total). */
  readonly downPayment: number;
  /** Valor financiado (total - entrada). */
  readonly financed: number;
  /** Valor de cada parcela (financiado / nº de parcelas). */
  readonly perInstallment: number;
}

/** Entrada do cálculo de parcelamento. */
export interface InstallmentPlanInput {
  readonly total: number;
  readonly downPayment: number;
  readonly installments: number;
}

/**
 * Calcula entrada, valor financiado e valor por parcela de forma segura.
 *
 * @param input Total, entrada e número de parcelas.
 * @returns Plano de parcelamento (sem valores negativos).
 */
export const computeInstallmentPlan = (
  input: InstallmentPlanInput,
): InstallmentPlan => {
  const total = Math.max(0, input.total);
  const downPayment = Math.max(0, Math.min(input.downPayment, total));
  const financed = Math.max(0, total - downPayment);
  const count = Math.max(1, Math.floor(input.installments));
  return { downPayment, financed, perInstallment: financed / count };
};

/** Chip de distribuição nas faturas. */
export interface DistributionChip {
  readonly key: string;
  readonly label: string;
  readonly sub: string;
  readonly value: number;
  readonly isEntry: boolean;
}

/** Entrada para montar a distribuição nas faturas. */
export interface DistributionInput {
  readonly mode: InstallmentMode;
  readonly total: number;
  readonly downPayment: number;
  readonly hasDownPayment: boolean;
  readonly installments: number;
  /** Mês de fatura inicial (`YYYY-MM`) em que a compra cai. */
  readonly startBillMonth: string;
}

/**
 * Monta a distribuição da compra nas faturas (entrada + parcelas, ou à vista).
 *
 * @param input Modo, total, entrada, nº de parcelas e mês de fatura inicial.
 * @returns Lista de chips para a prévia da UI.
 */
export const buildDistribution = (
  input: DistributionInput,
): DistributionChip[] => {
  const effectiveDown =
    input.mode === "parcelado" && input.hasDownPayment ? input.downPayment : 0;
  const plan = computeInstallmentPlan({
    total: input.total,
    downPayment: effectiveDown,
    installments: input.installments,
  });

  const chips: DistributionChip[] = [];
  if (plan.downPayment > 0) {
    chips.push({
      key: "entry",
      label: "Entrada",
      sub: "hoje",
      value: plan.downPayment,
      isEntry: true,
    });
  }

  if (input.mode === "parcelado") {
    const count = Math.max(1, Math.floor(input.installments));
    for (let index = 0; index < count; index += 1) {
      const monthKey = shiftMonthKey(input.startBillMonth, index);
      chips.push({
        key: `p${index}`,
        label: monthKeyShort(monthKey),
        sub: `${index + 1}/${count}`,
        value: plan.perInstallment,
        isEntry: false,
      });
    }
    return chips;
  }

  chips.push({
    key: "full",
    label: monthKeyShort(input.startBillMonth),
    sub: "à vista",
    value: plan.financed > 0 ? plan.financed : input.total,
    isEntry: false,
  });
  return chips;
};
