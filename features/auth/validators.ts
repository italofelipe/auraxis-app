import { z } from "zod";

export const passwordPolicy = {
  minLength: 10,
  patterns: {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    digit: /\d/,
    symbol: /[^A-Za-z0-9]/,
  },
} as const;

const strongPasswordSchema = z
  .string()
  .min(
    passwordPolicy.minLength,
    `A senha precisa ter ao menos ${passwordPolicy.minLength} caracteres.`,
  )
  .regex(passwordPolicy.patterns.uppercase, "A senha precisa ter ao menos uma letra maiuscula.")
  .regex(passwordPolicy.patterns.digit, "A senha precisa ter ao menos um numero.")
  .regex(passwordPolicy.patterns.symbol, "A senha precisa ter ao menos um simbolo.");

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe a senha."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Informe o seu nome.")
      .max(120, "Informe um nome mais curto."),
    email: z.string().trim().email("Informe um e-mail valido."),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme a senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas precisam ser iguais.",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Informe o token de redefinicao."),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme a senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas precisam ser iguais.",
  });

export const confirmEmailSchema = z.object({
  token: z.string().trim().min(1, "Informe o token de confirmacao."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ConfirmEmailFormValues = z.infer<typeof confirmEmailSchema>;
