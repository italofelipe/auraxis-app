import type { PropsWithChildren } from "react";

import { UpgradeCTA } from "@/components/upgrade-cta";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import type { FeatureKey } from "@/types/contracts";

interface PaywallGateProps extends PropsWithChildren {
  readonly featureKey: FeatureKey;
}

export const PaywallGate = ({ featureKey, children }: PaywallGateProps) => {
  const { hasAccess, isLoading } = useFeatureAccess(featureKey);

  if (isLoading) {
    return null;
  }

  if (!hasAccess) {
    return <UpgradeCTA />;
  }

  return <>{children}</>;
};
