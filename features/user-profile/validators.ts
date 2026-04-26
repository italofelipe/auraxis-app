import { z } from "zod";

const optionalNumber = z
  .number({ error: "Informe um numero valido." })
  .nonnegative("Valor nao pode ser negativo.")
  .finite("Valor invalido.")
  .optional()
  .nullable();

const optionalString = (max: number) =>
  z.string().trim().max(max, "Texto muito longo.").optional().nullable();

export const updateUserProfileSchema = z
  .object({
    gender: z.enum(["male", "female", "other"]).optional().nullable(),
    occupation: optionalString(120),
    stateUf: z.string().trim().length(2, "UF deve ter 2 letras.").optional().nullable(),
    monthlyIncome: optionalNumber,
    monthlyIncomeNet: optionalNumber,
    monthlyExpenses: optionalNumber,
    netWorth: optionalNumber,
    initialInvestment: optionalNumber,
    monthlyInvestment: optionalNumber,
    investorProfile: z
      .enum(["conservador", "explorador", "entusiasta"])
      .optional()
      .nullable(),
    financialObjectives: optionalString(500),
  })
  .refine(
    (values) => Object.values(values).some((value) => value !== undefined),
    { message: "Nenhuma alteracao informada." },
  );

export type UpdateUserProfileFormValues = z.infer<typeof updateUserProfileSchema>;
