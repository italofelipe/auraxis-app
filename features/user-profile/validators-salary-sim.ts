import { z } from "zod";

export const simulateSalaryIncreaseSchema = z.object({
  baseSalary: z.number().nonnegative().finite(),
  baseDate: z
    .string()
    .trim()
    .min(1)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Data invalida.",
    }),
  discounts: z.number().nonnegative().finite(),
  targetRealIncrease: z.number().nonnegative().finite(),
});

export type SimulateSalaryIncreaseFormValues = z.infer<
  typeof simulateSalaryIncreaseSchema
>;
