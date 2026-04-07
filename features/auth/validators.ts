import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o seu nome.")
    .max(120, "Informe um nome mais curto."),
  email: z.string().trim().email("Informe um e-mail valido."),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Informe o token de redefinicao."),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

export const confirmEmailSchema = z.object({
  token: z.string().trim().min(1, "Informe o token de confirmacao."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ConfirmEmailFormValues = z.infer<typeof confirmEmailSchema>;
