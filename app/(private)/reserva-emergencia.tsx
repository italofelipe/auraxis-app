import type { ReactElement } from "react";

import { PaywallGate } from "@/features/entitlements/components/paywall-gate";
import { EmergencyFundScreen } from "@/features/tools/screens/emergency-fund-screen";

export default function EmergencyFundRoute(): ReactElement {
  return (
    <PaywallGate featureKey="advanced_simulations">
      <EmergencyFundScreen />
    </PaywallGate>
  );
}
