import { z } from "zod";

const optionalNumber = z
  .number({ error: "Informe um numero valido." })
  .nonnegative("Valor nao pode ser negativo.")
  .finite("Valor invalido.")
  .optional()
  .nullable();

const isoDate = z
  .string()
  .trim()
  .min(1, "Data invalida.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Data invalida.")
  .optional()
  .nullable();

export const createWalletEntrySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome de 2 a 120 caracteres.")
    .max(120, "Nome muito longo."),
  assetClass: z.string().trim().min(1, "Informe a classe do ativo."),
  ticker: z.string().trim().max(20, "Ticker muito longo.").optional().nullable(),
  value: optionalNumber,
  quantity: optionalNumber,
  annualRate: z
    .number({ error: "Taxa invalida." })
    .min(-1, "Taxa invalida.")
    .max(10, "Taxa invalida.")
    .optional()
    .nullable(),
  targetWithdrawDate: isoDate,
  registerDate: isoDate,
});

export const updateWalletEntrySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    assetClass: z.string().trim().min(1).optional(),
    ticker: z.string().trim().max(20).optional().nullable(),
    value: optionalNumber,
    quantity: optionalNumber,
    annualRate: z.number().min(-1).max(10).optional().nullable(),
    targetWithdrawDate: isoDate,
    shouldBeOnWallet: z.boolean().optional(),
  })
  .refine(
    (values) => Object.values(values).some((value) => value !== undefined),
    { message: "Nenhuma alteracao informada." },
  );

export type CreateWalletEntryFormValues = z.infer<typeof createWalletEntrySchema>;
export type UpdateWalletEntryFormValues = z.infer<typeof updateWalletEntrySchema>;
