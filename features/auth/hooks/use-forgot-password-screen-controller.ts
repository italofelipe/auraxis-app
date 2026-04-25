import { useRouter } from "expo-router";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { appRoutes } from "@/core/navigation/routes";
import { useForgotPasswordMutation } from "@/features/auth/hooks/use-auth-mutations";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/validators";
import { useAppForm } from "@/shared/forms/use-app-form";

export type ForgotPasswordSubmissionStatus = "idle" | "success";

export interface ForgotPasswordScreenController {
  readonly form: UseFormReturn<ForgotPasswordFormValues>;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly status: ForgotPasswordSubmissionStatus;
  readonly handleSubmit: () => Promise<void>;
  readonly dismissSubmitError: () => void;
  readonly handleBackToLogin: () => void;
  readonly handleResubmit: () => void;
}

/**
 * Canonical controller for the forgot-password route.
 *
 * Tracks the submission status so the screen can render an
 * email-enumeration-safe success message after a request is accepted by the
 * backend (the backend always responds 200 to avoid leaking account existence).
 */
export function useForgotPasswordScreenController(): ForgotPasswordScreenController {
  const router = useRouter();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const [status, setStatus] = useState<ForgotPasswordSubmissionStatus>("idle");
  const form = useAppForm<ForgotPasswordFormValues>(forgotPasswordSchema, {
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await forgotPasswordMutation.mutateAsync(values);
      setStatus("success");
    } catch {
      setStatus("idle");
    }
  });

  return {
    form,
    isSubmitting: forgotPasswordMutation.isPending,
    submitError: forgotPasswordMutation.error,
    status,
    handleSubmit,
    dismissSubmitError: () => {
      forgotPasswordMutation.reset();
    },
    handleBackToLogin: () => {
      router.replace(appRoutes.public.login);
    },
    handleResubmit: () => {
      forgotPasswordMutation.reset();
      setStatus("idle");
    },
  };
}
