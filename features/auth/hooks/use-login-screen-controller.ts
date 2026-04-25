import { Linking } from "react-native";

import { useRouter } from "expo-router";
import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useAuthRedirectStore } from "@/core/navigation/auth-redirect-context";
import { appRoutes } from "@/core/navigation/routes";
import { useSessionFailureNotice } from "@/core/session/use-session-failure-notice";
import { useLoginMutation } from "@/features/auth/hooks/use-auth-mutations";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/validators";
import { PRIVACY_URL, TERMS_URL } from "@/shared/config/web-urls";
import { useAppForm } from "@/shared/forms/use-app-form";

export interface LoginScreenController {
  readonly form: UseFormReturn<LoginFormValues>;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly sessionFailureNotice: {
    readonly title: string;
    readonly description: string;
    readonly dismissLabel: string | null;
  } | null;
  readonly handleSubmit: () => Promise<void>;
  readonly dismissSubmitError: () => void;
  readonly dismissSessionFailureNotice: () => void;
  readonly handleForgotPassword: () => void;
  readonly handleRegister: () => void;
  readonly handleOpenTerms: () => Promise<void>;
  readonly handleOpenPrivacy: () => Promise<void>;
}

/**
 * Creates the canonical controller for the login screen.
 *
 * @param dependencies Optional side-effect overrides for tests.
 * @returns View-only bindings for the login route.
 */
export function useLoginScreenController(
  dependencies: {
    readonly openUrl?: typeof Linking.openURL;
  } = {},
): LoginScreenController {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const consumeRedirect = useAuthRedirectStore((state) => state.consume);
  const { notice, dismissNotice } = useSessionFailureNotice();
  const form = useAppForm<LoginFormValues>(loginSchema, {
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const openUrl = dependencies.openUrl ?? Linking.openURL;

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values);
    } catch {
      return;
    }
    const intended = consumeRedirect();
    router.replace(intended ?? appRoutes.private.dashboard);
  });

  const handleOpenTerms = useCallback(async () => openUrl(TERMS_URL), [openUrl]);
  const handleOpenPrivacy = useCallback(async () => openUrl(PRIVACY_URL), [openUrl]);

  return {
    form,
    isSubmitting: loginMutation.isPending,
    submitError: loginMutation.error,
    sessionFailureNotice: notice,
    handleSubmit,
    dismissSubmitError: () => {
      loginMutation.reset();
    },
    dismissSessionFailureNotice: dismissNotice,
    handleForgotPassword: () => {
      router.push(appRoutes.public.forgotPassword);
    },
    handleRegister: () => {
      router.push(appRoutes.public.register);
    },
    handleOpenTerms,
    handleOpenPrivacy,
  };
}
