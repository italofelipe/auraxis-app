import { z } from "zod";

export const checkoutPlanSchema = z.object({
  planSlug: z.string().trim().min(1, "Selecione um plano."),
  billingCycle: z.enum(["monthly", "annual"], {
    message: "Selecione um ciclo de cobranca valido.",
  }),
});

export type CheckoutPlanFormValues = z.infer<typeof checkoutPlanSchema>;
