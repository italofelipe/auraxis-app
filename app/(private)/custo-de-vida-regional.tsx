import type { ReactElement } from "react";

import { PaywallGate } from "@/features/entitlements/components/paywall-gate";
import { RegionalCostOfLivingScreen } from "@/features/tools/screens/regional-cost-of-living-screen";

export default function RegionalCostOfLivingRoute(): ReactElement {
  return (
    <PaywallGate featureKey="advanced_simulations">
      <RegionalCostOfLivingScreen />
    </PaywallGate>
  );
}
