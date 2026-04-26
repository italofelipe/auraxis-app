import { z } from "zod";

const positiveNumber = (message: string) =>
  z.number({ error: message }).positive(message).finite(message);

const isoDate = z
  .string()
  .trim()
  .min(1, "Informe a data.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Data invalida.",
  });

export const createWalletOperationSchema = z.object({
  kind: z.enum(["buy", "sell"]),
  quantity: positiveNumber("Quantidade deve ser maior que zero."),
  unitPrice: positiveNumber("Preco unitario deve ser maior que zero."),
  executedAt: isoDate,
  notes: z.string().trim().max(500).optional().nullable(),
});

export type CreateWalletOperationFormValues = z.infer<
  typeof createWalletOperationSchema
>;
