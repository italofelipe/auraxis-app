import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { appRoutes } from "@/core/navigation/routes";
import { useResetPasswordMutation } from "@/features/auth/hooks/use-auth-mutations";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/validators";
import { useAppForm } from "@/shared/forms/use-app-form";

export type ResetPasswordStatus = "idle" | "success";

export interface ResetPasswordScreenController {
  readonly form: UseFormReturn<ResetPasswordFormValues>;
  readonly status: ResetPasswordStatus;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly hasTokenFromLink: boolean;
  readonly handleSubmit: () => Promise<void>;
  readonly handleBackToLogin: () => void;
  readonly dismissSubmitError: () => void;
}

const resolveStringParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

/**
 * Controller for the password reset flow. Reads `token` from the deep link
 * search params, prefills the form, and on success switches to the success
 * state with a back-to-login CTA.
 *
 * Cross-field validation (password === confirmPassword) is handled by the
 * `resetPasswordSchema` refinement, plus a side effect that re-triggers the
 * confirm field whenever the password changes after the confirm has been
 * touched.
 */
export function useResetPasswordScreenController(): ResetPasswordScreenController {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const tokenFromLink = resolveStringParam(params.token);
  const resetMutation = useResetPasswordMutation();
  const [status, setStatus] = useState<ResetPasswordStatus>("idle");

  const form = useAppForm<ResetPasswordFormValues>(resetPasswordSchema, {
    defaultValues: {
      token: tokenFromLink,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (tokenFromLink) {
      form.setValue("token", tokenFromLink, { shouldValidate: false });
    }
  }, [tokenFromLink, form]);

  const { watch, getFieldState, trigger } = form;
  useEffect(() => {
    const subscription = watch((_values, info) => {
      if (info.name === "password" && getFieldState("confirmPassword").isTouched) {
        void trigger("confirmPassword");
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, getFieldState, trigger]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await resetMutation.mutateAsync({
        token: values.token,
        password: values.password,
      });
      setStatus("success");
    } catch {
      setStatus("idle");
    }
  });

  return {
    form,
    status,
    isSubmitting: resetMutation.isPending,
    submitError: resetMutation.error,
    hasTokenFromLink: tokenFromLink.length > 0,
    handleSubmit,
    handleBackToLogin: () => {
      router.replace(appRoutes.public.login);
    },
    dismissSubmitError: () => {
      resetMutation.reset();
    },
  };
}
