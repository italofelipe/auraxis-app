import { z } from "zod";

export const simulateGoalSchema = z.object({
  targetAmount: z.number().positive().finite(),
  currentAmount: z.number().nonnegative().finite(),
  targetDate: z
    .string()
    .trim()
    .min(1)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Data invalida.",
    })
    .optional()
    .nullable(),
  monthlyIncome: z.number().nonnegative().finite().optional().nullable(),
  monthlyExpenses: z.number().nonnegative().finite().optional().nullable(),
  monthlyContribution: z.number().nonnegative().finite().optional().nullable(),
});

export type SimulateGoalFormValues = z.infer<typeof simulateGoalSchema>;
