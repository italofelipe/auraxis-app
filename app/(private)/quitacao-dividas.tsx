import type { ReactElement } from "react";

import { PaywallGate } from "@/features/entitlements/components/paywall-gate";
import { DebtPayoffScreen } from "@/features/tools/screens/debt-payoff-screen";

export default function DebtPayoffRoute(): ReactElement {
  return (
    <PaywallGate featureKey="advanced_simulations">
      <DebtPayoffScreen />
    </PaywallGate>
  );
}
