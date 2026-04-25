import { Linking } from "react-native";

import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { ApiError } from "@/core/http/api-error";
import { appRoutes } from "@/core/navigation/routes";
import {
  useLoginMutation,
  useRegisterMutation,
} from "@/features/auth/hooks/use-auth-mutations";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/validators";
import { PRIVACY_URL, TERMS_URL } from "@/shared/config/web-urls";
import { applyApiFormErrors } from "@/shared/forms/apply-api-form-errors";
import { useAppForm } from "@/shared/forms/use-app-form";

export interface RegisterScreenController {
  readonly form: UseFormReturn<RegisterFormValues>;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly handleSubmit: () => Promise<void>;
  readonly dismissSubmitError: () => void;
  readonly handleBackToLogin: () => void;
  readonly handleOpenTerms: () => Promise<void>;
  readonly handleOpenPrivacy: () => Promise<void>;
}

/**
 * Controller for the registration screen. Orchestrates the register call,
 * auto-login on success, and graceful fallback to the login route when the
 * backend rejects the auto-login attempt (e.g. requires email confirmation).
 *
 * Side-effects owned here (kept out of the screen):
 * - Cross-field revalidation: re-trigger `confirmPassword` validation when
 *   `password` changes after `confirmPassword` was already touched, so the
 *   user cannot bypass the equality refinement by editing `password` last.
 */
export function useRegisterScreenController(
  dependencies: { readonly openUrl?: typeof Linking.openURL } = {},
): RegisterScreenController {
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const form = useAppForm<RegisterFormValues>(registerSchema, {
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { watch, getFieldState, trigger } = form;
  useEffect(() => {
    const subscription = watch((_values, info) => {
      if (info.name === "password" && getFieldState("confirmPassword").isTouched) {
        void trigger("confirmPassword");
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, getFieldState, trigger]);

  const openUrl = dependencies.openUrl ?? Linking.openURL;

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await registerMutation.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        applyApiFormErrors(error, form.setError);
      }
      setSubmitError(error);
      return;
    }

    try {
      await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });
      router.replace(appRoutes.private.confirmEmailPending);
    } catch {
      router.replace(appRoutes.public.login);
    }
  });

  const handleOpenTerms = useCallback(async () => openUrl(TERMS_URL), [openUrl]);
  const handleOpenPrivacy = useCallback(async () => openUrl(PRIVACY_URL), [openUrl]);

  return {
    form,
    isSubmitting: registerMutation.isPending || loginMutation.isPending,
    submitError,
    handleSubmit,
    dismissSubmitError: () => {
      registerMutation.reset();
      setSubmitError(null);
    },
    handleBackToLogin: () => {
      router.replace(appRoutes.public.login);
    },
    handleOpenTerms,
    handleOpenPrivacy,
  };
}
