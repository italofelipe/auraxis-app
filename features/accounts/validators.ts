import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(120),
  accountType: z.enum(["checking", "savings", "investment", "wallet", "other"]),
  institution: z.string().trim().max(120).optional().nullable(),
  initialBalance: z.number().finite().optional(),
});

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;
