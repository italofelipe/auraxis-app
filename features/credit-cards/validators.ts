import { z } from "zod";

const dayOfMonth = z.number().int().min(1).max(28);

const isValidIsoDate = (value: string): boolean => {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const month = Number.parseInt(monthRaw ?? "", 10);
  const day = Number.parseInt(dayRaw ?? "", 10);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const validityDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Informe a validade em YYYY-MM-DD.")
  .refine(isValidIsoDate, "Informe uma data valida.")
  .optional()
  .nullable();

export const createCreditCardSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(100),
  brand: z
    .enum(["visa", "mastercard", "elo", "hipercard", "amex", "other"])
    .optional()
    .nullable(),
  limitAmount: z.number().nonnegative().finite().optional().nullable(),
  closingDay: dayOfMonth.optional().nullable(),
  dueDay: dayOfMonth.optional().nullable(),
  lastFourDigits: z
    .string()
    .trim()
    .regex(/^\d{4}$/u, "Informe 4 digitos.")
    .optional()
    .nullable(),
  bank: z.string().trim().max(80).optional().nullable(),
  description: z.string().trim().max(300).optional().nullable(),
  benefits: z
    .array(z.string().trim().min(1).max(120))
    .max(12)
    .optional()
    .nullable(),
  validityDate,
});

export type CreateCreditCardFormValues = z.infer<typeof createCreditCardSchema>;
