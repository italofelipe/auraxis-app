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

export const createTransactionSchema = z.object({
  title: trimmedString(2, 120, "Informe um titulo de 2 a 120 caracteres."),
  amount: decimalAmount,
  type: transactionTypeSchema,
  dueDate: isoDate,
  description: z.string().trim().max(500, "Descricao muito longa.").optional().nullable(),
  isRecurring: z.boolean().optional(),
});

export const updateTransactionSchema = z
  .object({
    title: trimmedString(2, 120, "Informe um titulo de 2 a 120 caracteres.").optional(),
    amount: decimalAmount.optional(),
    type: transactionTypeSchema.optional(),
    dueDate: isoDate.optional(),
    description: z.string().trim().max(500).optional().nullable(),
    isRecurring: z.boolean().optional(),
    status: z
      .enum(["paid", "pending", "cancelled", "postponed", "overdue"])
      .optional(),
  })
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
