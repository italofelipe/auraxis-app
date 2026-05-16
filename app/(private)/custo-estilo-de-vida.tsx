import type { ReactElement } from "react";

import { PaywallGate } from "@/features/entitlements/components/paywall-gate";
import { CostOfLifestyleScreen } from "@/features/tools/screens/cost-of-lifestyle-screen";

export default function CostOfLifestyleRoute(): ReactElement {
  return (
    <PaywallGate featureKey="advanced_simulations">
      <CostOfLifestyleScreen />
    </PaywallGate>
  );
}
