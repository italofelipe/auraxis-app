import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { appRoutes } from "@/core/navigation/routes";
import { useConfirmEmailMutation } from "@/features/auth/hooks/use-auth-mutations";

export type ConfirmEmailStatus =
  | "idle"
  | "pending"
  | "success"
  | "error"
  | "no-token";

export interface ConfirmEmailScreenController {
  readonly status: ConfirmEmailStatus;
  readonly message: string | null;
  readonly error: unknown | null;
  readonly hasToken: boolean;
  readonly handleGoToDashboard: () => void;
  readonly handleGoToLogin: () => void;
  readonly handleResendConfirmation: () => void;
}

const stringOrNull = (raw: unknown): string | null => {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
};

interface MutationProgress {
  readonly isPending: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;
}

const deriveStatus = (
  hasToken: boolean,
  progress: MutationProgress,
): ConfirmEmailStatus => {
  if (!hasToken) {
    return "no-token";
  }
  if (progress.isPending) {
    return "pending";
  }
  if (progress.isSuccess) {
    return "success";
  }
  if (progress.isError) {
    return "error";
  }
  return "idle";
};

/**
 * Reactive controller for the post-click email confirmation landing.
 *
 * Reads the `token` query param, fires the confirmEmail mutation exactly
 * once when a token is present (subsequent re-renders don't retry on
 * their own — the user clicks "resend" if needed), and exposes the
 * derived state machine the screen renders against.
 *
 * @returns Controller bag with status + handlers.
 */
export const useConfirmEmailScreenController =
  (): ConfirmEmailScreenController => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const token = useMemo(() => stringOrNull(params["token"]), [params]);
    const hasToken = token !== null;
    const mutation = useConfirmEmailMutation();
    const firedRef = useRef(false);

    useEffect(() => {
      if (!hasToken || firedRef.current) {
        return;
      }
      firedRef.current = true;
      mutation.mutate({ token: token! });
    }, [hasToken, mutation, token]);

    const status = deriveStatus(hasToken, {
      isPending: mutation.isPending,
      isSuccess: mutation.isSuccess,
      isError: mutation.isError,
    });

    const handleGoToDashboard = useCallback((): void => {
      router.replace(appRoutes.private.dashboard);
    }, [router]);

    const handleGoToLogin = useCallback((): void => {
      router.replace(appRoutes.public.login);
    }, [router]);

    const handleResendConfirmation = useCallback((): void => {
      router.replace(appRoutes.public.resendConfirmation);
    }, [router]);

    return {
      status,
      message: mutation.data?.message ?? null,
      error: mutation.error,
      hasToken,
      handleGoToDashboard,
      handleGoToLogin,
      handleResendConfirmation,
    };
  };
