import { useRouter } from "expo-router";
import { useState } from "react";

import { appRoutes } from "@/core/navigation/routes";
import { useSessionStore } from "@/core/session/session-store";
import { useResendConfirmationMutation } from "@/features/auth/hooks/use-auth-mutations";
import { maskEmail } from "@/features/auth/utils/email-mask";

export interface ConfirmEmailPendingController {
  readonly maskedEmail: string;
  readonly isResending: boolean;
  readonly resendSucceeded: boolean;
  readonly resendError: unknown | null;
  readonly handleResend: () => Promise<void>;
  readonly dismissResendError: () => void;
  readonly handleSkip: () => void;
}

/**
 * Bindings for the confirm-email-pending screen. Exposes a masked email,
 * resend mutation state, and a "skip for now" navigation hook.
 */
export function useConfirmEmailPendingController(): ConfirmEmailPendingController {
  const router = useRouter();
  const userEmail = useSessionStore((state) => state.userEmail);
  const resendMutation = useResendConfirmationMutation();
  const [resendSucceeded, setResendSucceeded] = useState(false);

  const handleResend = async () => {
    setResendSucceeded(false);
    try {
      await resendMutation.mutateAsync();
      setResendSucceeded(true);
    } catch {
      setResendSucceeded(false);
    }
  };

  return {
    maskedEmail: maskEmail(userEmail),
    isResending: resendMutation.isPending,
    resendSucceeded,
    resendError: resendMutation.error,
    handleResend,
    dismissResendError: () => {
      resendMutation.reset();
      setResendSucceeded(false);
    },
    handleSkip: () => {
      router.replace(appRoutes.private.dashboard);
    },
  };
}
