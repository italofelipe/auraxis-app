/**
 * Pure-math CDB / LCI / LCA comparator (DEC-196 lote B).
 *
 * Computes the gross yield, IR (Brazilian regressive bracket — only on
 * CDB; LCI and LCA are exempt by law) and the net yield for the same
 * principal across the three products, so the user can see at a glance
 * which one wins for the chosen tenor and rate.
 *
 * Rate inputs:
 *  • `cdi_percent` — rate is expressed as a fraction of the CDI
 *    (e.g. 110 % CDI). The current CDI rate must be supplied alongside.
 *  • `prefixed`    — rate is a fixed annual percentage.
 *
 * Returns one row per product with the same shape so the UI can render
 * them through a shared component.
 */

export type CdbLciLcaProduct = "cdb" | "lci" | "lca";
export type CdbLciLcaRateKind = "cdi_percent" | "prefixed";

export interface CdbLciLcaInputs {
  readonly amount: number;
  readonly months: number;
  readonly rateKind: CdbLciLcaRateKind;
  /** When `rateKind="cdi_percent"`, percentage of CDI (e.g. 110). When
   *  `rateKind="prefixed"`, annual rate in percent (e.g. 12). */
  readonly rateValue: number;
  /** Current CDI annual rate in percent. Only used when
   *  `rateKind="cdi_percent"`. */
  readonly cdiAnnualPercent: number;
}

export interface CdbLciLcaProductResult {
  readonly product: CdbLciLcaProduct;
  readonly grossYield: number;
  readonly irRatePercent: number;
  readonly irAmount: number;
  readonly netYield: number;
  readonly netAmount: number;
}

export interface CdbLciLcaResult {
  readonly cdb: CdbLciLcaProductResult;
  readonly lci: CdbLciLcaProductResult;
  readonly lca: CdbLciLcaProductResult;
  readonly bestProduct: CdbLciLcaProduct;
}

/**
 * Brazilian regressive IR table for fixed-income (CDB, Tesouro, etc.).
 * The threshold is the holding period in days.
 */
const IR_TABLE: readonly { maxDays: number; rate: number }[] = [
  { maxDays: 180, rate: 22.5 },
  { maxDays: 360, rate: 20 },
  { maxDays: 720, rate: 17.5 },
  { maxDays: Number.POSITIVE_INFINITY, rate: 15 },
];

const irRateForMonths = (months: number): number => {
  const days = months * 30;
  for (const bracket of IR_TABLE) {
    if (days <= bracket.maxDays) {
      return bracket.rate;
    }
  }
  return 15;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const annualRateFor = (inputs: CdbLciLcaInputs): number => {
  if (inputs.rateKind === "prefixed") {
    return inputs.rateValue / 100;
  }
  return (inputs.cdiAnnualPercent / 100) * (inputs.rateValue / 100);
};

const grossYieldFor = (
  inputs: CdbLciLcaInputs,
  annualRate: number,
): number => {
  // Convert annual rate to monthly and compound over the tenor.
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  const finalAmount = inputs.amount * Math.pow(1 + monthlyRate, inputs.months);
  return finalAmount - inputs.amount;
};

const computeProduct = (
  product: CdbLciLcaProduct,
  inputs: CdbLciLcaInputs,
  annualRate: number,
): CdbLciLcaProductResult => {
  const grossYield = grossYieldFor(inputs, annualRate);
  const irRatePercent = product === "cdb" ? irRateForMonths(inputs.months) : 0;
  const irAmount = (grossYield * irRatePercent) / 100;
  const netYield = grossYield - irAmount;
  return {
    product,
    grossYield: round2(grossYield),
    irRatePercent,
    irAmount: round2(irAmount),
    netYield: round2(netYield),
    netAmount: round2(inputs.amount + netYield),
  };
};

/**
 * Computes the comparative table for the inputs.
 * @param inputs Validated inputs from the screen.
 * @returns One result per product plus the best (highest net yield) discriminator.
 */
export const calculateCdbLciLca = (inputs: CdbLciLcaInputs): CdbLciLcaResult => {
  const annualRate = annualRateFor(inputs);
  const cdb = computeProduct("cdb", inputs, annualRate);
  const lci = computeProduct("lci", inputs, annualRate);
  const lca = computeProduct("lca", inputs, annualRate);
  const products: readonly CdbLciLcaProductResult[] = [cdb, lci, lca];
  const best = products.reduce<CdbLciLcaProductResult>(
    (acc, candidate) => (candidate.netYield > acc.netYield ? candidate : acc),
    cdb,
  );
  return { cdb, lci, lca, bestProduct: best.product };
};
