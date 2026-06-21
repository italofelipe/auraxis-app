import type {
  CreateTransactionCommand,
  TransactionStatus,
} from "@/features/transactions/contracts";
import { serializeAmount } from "@/shared/utils/currency";

import { type InstallmentMode, computeInstallmentPlan } from "./installment-plan";

/**
 * Valores do formulário de "Lançar despesa" (despesa de cartão).
 *
 * O cartão é opcional (`creditCardId` pode ser `null`) e nunca bloqueia o
 * lançamento. A entrada ("entrada"/down payment) só se aplica no modo parcelado.
 */
export interface ExpenseFormValues {
  /** Título da despesa. */
  readonly title: string;
  /** Valor total da compra (em reais). */
  readonly amount: number;
  /** Data da compra (`YYYY-MM-DD`). */
  readonly purchaseDate: string;
  /** Cartão selecionado, ou `null` (nunca bloqueia o lançamento). */
  readonly creditCardId: string | null;
  /** Categoria/tag selecionada, ou `null`. */
  readonly tagId: string | null;
  /** Conta vinculada, ou `null`. */
  readonly accountId: string | null;
  /** Status inicial da transação. */
  readonly status: TransactionStatus;
  /** Modo de pagamento ("avista" | "parcelado"). */
  readonly mode: InstallmentMode;
  /** Número de parcelas (relevante apenas no modo parcelado). */
  readonly installments: number;
  /** Se há entrada (relevante apenas no modo parcelado). */
  readonly hasDownPayment: boolean;
  /** Valor da entrada em reais (clampado ao total). */
  readonly downPayment: number;
  /** Descrição livre (opcional). */
  readonly description: string;
}

/** Campos comuns a todos os payloads derivados de uma mesma despesa. */
type ExpenseBaseFields = Pick<
  CreateTransactionCommand,
  "type" | "dueDate" | "status" | "creditCardId" | "tagId" | "accountId"
> & {
  readonly title: string;
  readonly description?: string;
};

/**
 * Monta os campos comuns compartilhados por todos os payloads da despesa.
 *
 * @param values Valores do formulário.
 * @returns Campos base (sem `amount`/`isInstallment`).
 */
const buildBaseFields = (values: ExpenseFormValues): ExpenseBaseFields => {
  const description = values.description.trim();
  return {
    title: values.title.trim(),
    type: "expense",
    dueDate: values.purchaseDate,
    status: values.status,
    creditCardId: values.creditCardId,
    tagId: values.tagId,
    accountId: values.accountId,
    ...(description ? { description } : {}),
  };
};

/**
 * Resolve os campos de parcelamento do payload financiado. Só marca
 * `isInstallment` quando há de fato 2+ parcelas no modo parcelado.
 *
 * @param values Valores do formulário.
 * @returns Fragmento com `isInstallment` (+ `installmentCount` quando parcelado).
 */
const resolveInstallmentFields = (
  values: ExpenseFormValues,
): Pick<CreateTransactionCommand, "isInstallment" | "installmentCount"> => {
  const isInstallment = values.mode === "parcelado" && values.installments >= 2;
  return isInstallment
    ? { isInstallment: true, installmentCount: Math.floor(values.installments) }
    : { isInstallment: false };
};

/**
 * Constrói os payloads de criação de transação para uma despesa de cartão.
 *
 * A entrada não existe no backend, então é modelada como uma transação à vista
 * separada (data da compra, `isInstallment: false`) seguida do restante
 * financiado (parcelado quando o modo é "parcelado"). Quando não há entrada,
 * retorna um único payload (à vista ou parcelado). Total zero/negativo retorna
 * lista vazia.
 *
 * Não inclui `impactPolicy` — esse campo não existe no contrato do app. O
 * `amount` é serializado como string decimal via `serializeAmount`.
 *
 * @param values Valores do formulário de despesa.
 * @returns Lista de 0, 1 ou 2 payloads, a enviar sequencialmente.
 */
export const buildExpensePayloads = (
  values: ExpenseFormValues,
): CreateTransactionCommand[] => {
  const total = Math.max(0, values.amount);
  const useEntry = values.mode === "parcelado" && values.hasDownPayment;
  const plan = computeInstallmentPlan({
    total,
    downPayment: useEntry ? values.downPayment : 0,
    installments: values.installments,
  });

  const baseFields = buildBaseFields(values);
  const payloads: CreateTransactionCommand[] = [];

  if (plan.downPayment > 0) {
    payloads.push({
      ...baseFields,
      amount: serializeAmount(plan.downPayment),
      isInstallment: false,
    });
  }

  const remaining = plan.downPayment > 0 ? plan.financed : total;
  if (remaining > 0) {
    payloads.push({
      ...baseFields,
      amount: serializeAmount(remaining),
      ...resolveInstallmentFields(values),
    });
  }

  return payloads;
};
