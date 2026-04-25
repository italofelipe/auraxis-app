import { z } from "zod";

const positiveNumber = (message: string) =>
  z.number({ error: message }).positive(message).finite(message);

const optionalPositiveNumber = (message: string) =>
  z.number({ error: message }).nonnegative(message).finite(message);

const isoDateOptional = z
  .string()
  .trim()
  .min(1, "Data invalida.")
  .refine(
    (value) => !Number.isNaN(new Date(value).getTime()),
    "Data invalida.",
  )
  .optional()
  .nullable();

export const createGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Informe um titulo para a meta.")
    .max(120, "Titulo muito longo."),
  targetAmount: positiveNumber("Defina um valor alvo maior que zero."),
  currentAmount: optionalPositiveNumber(
    "Valor atual nao pode ser negativo.",
  ).optional(),
  targetDate: isoDateOptional,
});

export const updateGoalSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Informe um titulo para a meta.")
      .max(120, "Titulo muito longo.")
      .optional(),
    targetAmount: positiveNumber("Defina um valor alvo maior que zero.").optional(),
    currentAmount: optionalPositiveNumber(
      "Valor atual nao pode ser negativo.",
    ).optional(),
    targetDate: isoDateOptional,
    status: z.string().min(1).optional(),
  })
  .refine(
    (values) => Object.values(values).some((value) => value !== undefined),
    { message: "Nenhuma alteracao informada." },
  );

export type CreateGoalFormValues = z.infer<typeof createGoalSchema>;
export type UpdateGoalFormValues = z.infer<typeof updateGoalSchema>;
