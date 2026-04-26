import { z } from "zod";

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/u, "Use formato decimal (ex.: 1500.00).");

const optionalDate = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Data invalida.",
  })
  .optional()
  .nullable();

export const createBudgetSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(120),
  amount: decimalString,
  period: z.enum(["monthly", "weekly", "custom"]).optional(),
  tagId: z.string().trim().min(1).optional().nullable(),
  startDate: optionalDate,
  endDate: optionalDate,
});

export type CreateBudgetFormValues = z.infer<typeof createBudgetSchema>;
