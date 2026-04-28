import { useRouter } from "expo-router";
import { useState } from "react";

import { appRoutes } from "@/core/navigation/routes";
import { useBiometricGate } from "@/core/security/use-biometric-gate";
import { useLogoutMutation } from "@/features/auth/hooks/use-auth-mutations";
import { useDeleteAccountMutation } from "@/features/user-profile/hooks/use-user-profile-mutations";

const CONFIRM_PHRASE = "EXCLUIR";

export type DangerZoneSubmitError =
  | { readonly kind: "biometric" }
  | { readonly kind: "backend"; readonly error: unknown };

export interface DangerZoneScreenController {
  readonly consent: boolean;
  readonly confirmPhrase: string;
  readonly password: string;
  readonly canSubmit: boolean;
  readonly isDeleting: boolean;
  readonly submitError: DangerZoneSubmitError | null;
  readonly handleConsentChange: (next: boolean) => void;
  readonly handleConfirmPhraseChange: (next: string) => void;
  readonly handlePasswordChange: (next: string) => void;
  readonly handleSubmit: () => Promise<void>;
  readonly handleCancel: () => void;
  readonly dismissSubmitError: () => void;
}

/**
 * Canonical controller for the irreversible "Delete account" flow.
 * Owns the three-condition gate (consent toggle + literal phrase +
 * password), the biometric prompt and the post-success sign-out so the
 * screen stays a thin presentation layer.
 */
export function useDangerZoneScreenController(): DangerZoneScreenController {
  const router = useRouter();
  const requestBiometricGate = useBiometricGate();
  const deleteAccountMutation = useDeleteAccountMutation();
  const logoutMutation = useLogoutMutation();

  const [consent, setConsent] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<DangerZoneSubmitError | null>(null);

  const phraseMatches = confirmPhrase === CONFIRM_PHRASE;
  const passwordReady = password.length > 0;
  const canSubmit = consent && phraseMatches && passwordReady;

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setSubmitError(null);

    const gate = await requestBiometricGate({
      promptMessage: "Confirme para excluir sua conta",
      required: true,
      biometricsOnly: true,
    });
    if (!gate.authorised) {
      setSubmitError({ kind: "biometric" });
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync({ password });
    } catch (error) {
      setSubmitError({ kind: "backend", error });
      return;
    }

    try {
      await logoutMutation.mutateAsync();
    } finally {
      router.replace({
        pathname: appRoutes.public.login,
        params: { reason: "account-deleted" },
      });
    }
  };

  return {
    consent,
    confirmPhrase,
    password,
    canSubmit,
    isDeleting: deleteAccountMutation.isPending || logoutMutation.isPending,
    submitError,
    handleConsentChange: (next) => setConsent(next),
    handleConfirmPhraseChange: (next) => setConfirmPhrase(next),
    handlePasswordChange: (next) => setPassword(next),
    handleSubmit,
    handleCancel: () => router.back(),
    dismissSubmitError: () => {
      setSubmitError(null);
      deleteAccountMutation.reset();
      logoutMutation.reset();
    },
  };
}
