import { z } from "zod";

const trimmedString = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, message);

const decimalAmount = z
  .string()
  .trim()
  .min(1, "Informe o valor.")
  .refine((value) => /^-?\d+([.,]\d{1,2})?$/.test(value), {
    message: "Valor invalido. Use ate 2 casas decimais.",
  })
  .refine((value) => Number.parseFloat(value.replace(",", ".")) > 0, {
    message: "Valor deve ser maior que zero.",
  });

const isoDate = z
  .string()
  .trim()
  .min(1, "Informe a data.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Data invalida.",
  });

export const transactionTypeSchema = z.enum(["income", "expense"]);

const creditCardIdSchema = z.string().uuid("Cartao invalido.").nullable();

const installmentCountSchema = z
  .number()
  .int("Informe uma quantidade inteira de parcelas.")
  .min(2, "Use pelo menos 2 parcelas.")
  .max(60, "Use no maximo 60 parcelas.")
  .nullable();

const validateInstallmentRequirements = (
  values: {
    readonly isInstallment?: boolean | null;
    readonly installmentCount?: number | null;
  },
  ctx: z.RefinementCtx,
): void => {
  if (
    values.isInstallment === true &&
    (values.installmentCount === null || values.installmentCount === undefined)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["installmentCount"],
      message: "Informe a quantidade de parcelas.",
    });
  }
};

export const createTransactionFieldsSchema = z.object({
  title: trimmedString(2, 120, "Informe um titulo de 2 a 120 caracteres."),
  amount: decimalAmount,
  type: transactionTypeSchema,
  dueDate: isoDate,
  description: z.string().trim().max(500, "Descricao muito longa.").optional().nullable(),
  isRecurring: z.boolean().optional(),
  creditCardId: creditCardIdSchema.default(null),
  isInstallment: z.boolean().default(false),
  installmentCount: installmentCountSchema.default(null),
});

export const createTransactionSchema = createTransactionFieldsSchema.superRefine(
  validateInstallmentRequirements,
);

export const updateTransactionSchema = z
  .object({
    title: trimmedString(2, 120, "Informe um titulo de 2 a 120 caracteres.").optional(),
    amount: decimalAmount.optional(),
    type: transactionTypeSchema.optional(),
    dueDate: isoDate.optional(),
    description: z.string().trim().max(500).optional().nullable(),
    isRecurring: z.boolean().optional(),
    creditCardId: creditCardIdSchema.optional(),
    isInstallment: z.boolean().optional(),
    installmentCount: installmentCountSchema.optional(),
    status: z
      .enum(["paid", "pending", "cancelled", "postponed", "overdue"])
      .optional(),
  })
  .superRefine(validateInstallmentRequirements)
  .refine(
    (values) => Object.values(values).some((value) => value !== undefined),
    { message: "Nenhuma alteracao informada." },
  );

export type CreateTransactionFormValues = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionFormValues = z.infer<typeof updateTransactionSchema>;

export const normalizeAmount = (value: string): string => {
  const trimmed = value.trim();
  const hasComma = trimmed.includes(",");
  const normalized = hasComma
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  return parsed.toFixed(2);
};
