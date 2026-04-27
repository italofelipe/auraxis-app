import { useCallback, useEffect, useState, type ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { inspectBiometricSupport } from "@/core/security/biometric-gate";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppToggleRow } from "@/shared/components/app-toggle-row";
import { useT } from "@/shared/i18n";

type SupportState = "checking" | "available" | "unavailable" | "not_enrolled";

/**
 * Profile section that lets the user toggle biometric lock for the
 * app. Inspects device capability on mount and disables the toggle
 * gracefully when biometrics are absent or not enrolled.
 */
export function SecuritySection(): ReactElement {
  const { t } = useT();
  const enabled = useAppShellStore((state) => state.biometricLockEnabled);
  const setEnabled = useAppShellStore((state) => state.setBiometricLockEnabled);
  const [support, setSupport] = useState<SupportState>("checking");

  useEffect(() => {
    let cancelled = false;
    void inspectBiometricSupport().then((snapshot) => {
      if (cancelled) {
        return;
      }
      if (snapshot.status === "available") {
        setSupport("available");
      } else if (snapshot.status === "unavailable_not_enrolled") {
        setSupport("not_enrolled");
      } else {
        setSupport("unavailable");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = useCallback(
    (next: boolean): void => {
      if (support !== "available") {
        return;
      }
      setEnabled(next);
    },
    [setEnabled, support],
  );

  const helperText =
    support === "unavailable"
      ? t("common.security.biometric.unavailable")
      : support === "not_enrolled"
        ? t("common.security.biometric.notEnrolled")
        : undefined;

  return (
    <AppSurfaceCard title={t("common.security.title")}>
      <YStack gap="$3">
        <AppToggleRow
          label={t("common.security.biometric.label")}
          description={t("common.security.biometric.description")}
          checked={enabled && support === "available"}
          disabled={support !== "available"}
          onCheckedChange={handleToggle}
          testID="security-biometric"
        />
        {helperText ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            {helperText}
          </Paragraph>
        ) : null}
      </YStack>
    </AppSurfaceCard>
  );
}
