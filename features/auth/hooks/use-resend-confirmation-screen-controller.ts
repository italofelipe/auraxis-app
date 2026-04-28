import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { appRoutes } from "@/core/navigation/routes";
import { useSessionStore } from "@/core/session/session-store";
import { useResendConfirmationMutation } from "@/features/auth/hooks/use-auth-mutations";

const RATE_LIMIT_SECONDS = 60;

export interface ResendConfirmationScreenController {
  readonly email: string;
  readonly canEditEmail: boolean;
  readonly setEmail: (value: string) => void;
  readonly isSubmitting: boolean;
  readonly hasSucceeded: boolean;
  readonly submitError: unknown | null;
  readonly remainingSeconds: number;
  readonly handleSubmit: () => Promise<void>;
  readonly dismissSubmitError: () => void;
  readonly handleBackToLogin: () => void;
}

/**
 * Controller for the standalone /resend-confirmation screen.
 *
 * Pulls the user's email from the session store when available so a
 * post-register flow doesn't have to re-type it. When the user is
 * unauthenticated (came in via deep link) we let them edit the email.
 *
 * Enforces a local 60-second rate limit between submissions so a
 * frustrated user can't accidentally hammer the endpoint — the
 * backend already enforces its own limit; this is purely UX.
 */
export function useResendConfirmationScreenController(): ResendConfirmationScreenController {
  const router = useRouter();
  const sessionEmail = useSessionStore((state) => state.userEmail);
  const resendMutation = useResendConfirmationMutation();
  const [email, setEmail] = useState<string>(sessionEmail ?? "");
  const [hasSucceeded, setHasSucceeded] = useState<boolean>(false);
  const [lastSubmitAt, setLastSubmitAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const elapsed =
    lastSubmitAt === null ? Number.POSITIVE_INFINITY : (now - lastSubmitAt) / 1000;
  const remainingSeconds = Math.max(
    0,
    Math.ceil(RATE_LIMIT_SECONDS - elapsed),
  );

  useEffect(() => {
    if (lastSubmitAt === null) {
      return undefined;
    }
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [lastSubmitAt]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (remainingSeconds > 0) {
      return;
    }
    setHasSucceeded(false);
    try {
      await resendMutation.mutateAsync();
      setHasSucceeded(true);
      setLastSubmitAt(Date.now());
      setNow(Date.now());
    } catch {
      setHasSucceeded(false);
    }
  }, [remainingSeconds, resendMutation]);

  return {
    email,
    canEditEmail: sessionEmail === null,
    setEmail,
    isSubmitting: resendMutation.isPending,
    hasSucceeded,
    submitError: resendMutation.error,
    remainingSeconds,
    handleSubmit,
    dismissSubmitError: () => {
      resendMutation.reset();
      setHasSucceeded(false);
    },
    handleBackToLogin: () => {
      router.replace(appRoutes.public.login);
    },
  };
}
