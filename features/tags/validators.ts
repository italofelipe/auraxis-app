import { z } from "zod";

const colorRegex = /^#[0-9a-fA-F]{6}$/u;

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(80),
  color: z
    .string()
    .trim()
    .regex(colorRegex, "Use formato #RRGGBB.")
    .optional()
    .nullable(),
  icon: z.string().trim().max(40).optional().nullable(),
});

export type CreateTagFormValues = z.infer<typeof createTagSchema>;
