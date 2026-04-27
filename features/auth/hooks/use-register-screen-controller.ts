import { Linking } from "react-native";

import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { ApiError } from "@/core/http/api-error";
import { appRoutes } from "@/core/navigation/routes";
import { resolveTurnstilePolicy } from "@/core/security/turnstile-config";
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
  readonly captcha: {
    readonly required: boolean;
    readonly token: string | null;
    readonly missingChallenge: boolean;
  };
  readonly handleCaptchaToken: (token: string) => void;
  readonly handleCaptchaExpired: () => void;
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
// eslint-disable-next-line max-lines-per-function
export function useRegisterScreenController(
  dependencies: { readonly openUrl?: typeof Linking.openURL } = {},
): RegisterScreenController {
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();
  const captchaPolicy = useMemo(() => resolveTurnstilePolicy(), []);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [missingChallenge, setMissingChallenge] = useState<boolean>(false);
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

  const handleCaptchaToken = useCallback((token: string): void => {
    setCaptchaToken(token);
    setMissingChallenge(false);
  }, []);

  const handleCaptchaExpired = useCallback((): void => {
    setCaptchaToken(null);
  }, []);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    if (captchaPolicy.enabled && !captchaToken) {
      setMissingChallenge(true);
      return;
    }

    try {
      await registerMutation.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        captchaToken: captchaToken ?? undefined,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        applyApiFormErrors(error, form.setError);
      }
      setSubmitError(error);
      // Token is single-use server-side; force a fresh challenge.
      setCaptchaToken(null);
      return;
    }

    try {
      await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
        captchaToken: captchaToken ?? undefined,
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
    captcha: {
      required: captchaPolicy.enabled,
      token: captchaToken,
      missingChallenge,
    },
    handleCaptchaToken,
    handleCaptchaExpired,
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
