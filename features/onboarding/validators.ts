import { z } from "zod";

export const onboardingStep1Schema = z.object({
  monthlyIncome: z.number().nonnegative().finite(),
  investorProfile: z.enum(["conservador", "explorador", "entusiasta"]),
});

export const onboardingStep2Schema = z.object({
  title: z.string().trim().min(1, "Informe a descricao."),
  amount: z.number().positive().finite(),
  transactionType: z.enum(["income", "expense"]),
  dueDate: z
    .string()
    .trim()
    .min(1)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Data invalida.",
    }),
});

export const onboardingStep3Schema = z.object({
  name: z.string().trim().min(1, "Informe o nome da meta."),
  targetAmount: z.number().positive().finite(),
  targetDate: z
    .string()
    .trim()
    .min(1)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Data invalida.",
    }),
});

export type OnboardingStep1FormValues = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2FormValues = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3FormValues = z.infer<typeof onboardingStep3Schema>;
