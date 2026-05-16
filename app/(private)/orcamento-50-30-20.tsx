import type { ReactElement } from "react";

import { PaywallGate } from "@/features/entitlements/components/paywall-gate";
import { FiftyThirtyTwentyScreen } from "@/features/tools/screens/fifty-thirty-twenty-screen";

export default function FiftyThirtyTwentyRoute(): ReactElement {
  return (
    <PaywallGate featureKey="advanced_simulations">
      <FiftyThirtyTwentyScreen />
    </PaywallGate>
  );
}
