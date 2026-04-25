import { z } from "zod";

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

export const createReceivableSchema = z.object({
  description: z
    .string()
    .trim()
    .min(2, "Informe uma descricao de 2 a 200 caracteres.")
    .max(200, "Descricao muito longa."),
  amount: decimalAmount,
  expectedDate: isoDate,
  category: z.string().trim().max(60).optional().nullable(),
});

export const markReceivableReceivedSchema = z.object({
  receivedDate: isoDate,
  receivedAmount: decimalAmount.optional().nullable(),
});

export type CreateReceivableFormValues = z.infer<typeof createReceivableSchema>;
export type MarkReceivableReceivedFormValues = z.infer<
  typeof markReceivableReceivedSchema
>;

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
