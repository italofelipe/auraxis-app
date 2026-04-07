import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/validators";
import { useAppForm } from "@/shared/forms/use-app-form";

export const useForgotPasswordForm = () => {
  return useAppForm<ForgotPasswordFormValues>(forgotPasswordSchema, {
    defaultValues: {
      email: "",
    },
  });
};
