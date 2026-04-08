import type { PropsWithChildren, ReactElement } from "react";

import { UpgradeCta } from "@/features/subscription/components/upgrade-cta";
import { useFeatureAccess } from "@/features/entitlements/hooks/use-feature-access";
import type { FeatureKey } from "@/features/entitlements/contracts";

export interface PaywallGateProps extends PropsWithChildren {
  readonly featureKey: FeatureKey;
}

/**
 * Canonical gate for premium-only sections in the mobile app.
 *
 * @param props Paywalled feature key and protected children.
 * @returns Protected content or the upgrade CTA when access is absent.
 */
export function PaywallGate({
  featureKey,
  children,
}: PaywallGateProps): ReactElement | null {
  const { hasAccess, isLoading } = useFeatureAccess(featureKey);

  if (isLoading) {
    return null;
  }

  if (!hasAccess) {
    return <UpgradeCta />;
  }

  return <>{children}</>;
}
