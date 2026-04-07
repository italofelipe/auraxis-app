import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/validators";
import { useAppForm } from "@/shared/forms/use-app-form";

export const useLoginForm = () => {
  return useAppForm<LoginFormValues>(loginSchema, {
    defaultValues: {
      email: "",
      password: "",
    },
  });
};
