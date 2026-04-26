import { z } from "zod";

const dayOfMonth = z.number().int().min(1).max(31);

export const createCreditCardSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(120),
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
});

export type CreateCreditCardFormValues = z.infer<typeof createCreditCardSchema>;
