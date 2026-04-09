import { useRouter } from "expo-router";
import type { UseFormReturn } from "react-hook-form";

import { useForgotPasswordMutation } from "@/features/auth/hooks/use-auth-mutations";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/validators";
import { useAppForm } from "@/shared/forms/use-app-form";

export interface ForgotPasswordScreenController {
  readonly form: UseFormReturn<ForgotPasswordFormValues>;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly handleSubmit: () => Promise<void>;
  readonly dismissSubmitError: () => void;
  readonly handleBackToLogin: () => void;
}

/**
 * Creates the canonical controller for the forgot-password route.
 *
 * @returns View-only bindings for password reset request flow.
 */
export function useForgotPasswordScreenController(): ForgotPasswordScreenController {
  const router = useRouter();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const form = useAppForm<ForgotPasswordFormValues>(forgotPasswordSchema, {
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await forgotPasswordMutation.mutateAsync(values);
  });

  return {
    form,
    isSubmitting: forgotPasswordMutation.isPending,
    submitError: forgotPasswordMutation.error,
    handleSubmit,
    dismissSubmitError: () => {
      forgotPasswordMutation.reset();
    },
    handleBackToLogin: () => {
      router.replace("/login");
    },
  };
}
