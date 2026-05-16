import type { ReactElement } from "react";

import { PaywallGate } from "@/features/entitlements/components/paywall-gate";
import { CompoundInterestScreen } from "@/features/tools/screens/compound-interest-screen";

export default function CompoundInterestRoute(): ReactElement {
  return (
    <PaywallGate featureKey="advanced_simulations">
      <CompoundInterestScreen />
    </PaywallGate>
  );
}
