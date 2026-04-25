import { Linking } from "react-native";

import { useRouter } from "expo-router";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { ApiError } from "@/core/http/api-error";
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
  readonly password: string;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly handleSubmit: () => Promise<void>;
  readonly dismissSubmitError: () => void;
  readonly handleBackToLogin: () => void;
  readonly handleOpenTerms: () => Promise<void>;
  readonly handleOpenPrivacy: () => Promise<void>;
}

const POST_REGISTER_ROUTE = "/confirm-email-pending" as const;
const POST_REGISTER_FALLBACK = "/login" as const;

/**
 * Controller for the registration screen. Orchestrates the register call,
 * auto-login on success, and graceful fallback to the login route when the
 * backend rejects the auto-login attempt (e.g. requires email confirmation).
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

  const password = form.watch("password");
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
      router.replace(POST_REGISTER_ROUTE);
    } catch {
      router.replace(POST_REGISTER_FALLBACK);
    }
  });

  return {
    form,
    password: typeof password === "string" ? password : "",
    isSubmitting: registerMutation.isPending || loginMutation.isPending,
    submitError,
    handleSubmit,
    dismissSubmitError: () => {
      registerMutation.reset();
      setSubmitError(null);
    },
    handleBackToLogin: () => {
      router.replace("/login");
    },
    handleOpenTerms: async () => openUrl(TERMS_URL),
    handleOpenPrivacy: async () => openUrl(PRIVACY_URL),
  };
}
