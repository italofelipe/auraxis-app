import type { ReactElement } from "react";

import { PaywallGate } from "@/features/entitlements/components/paywall-gate";
import { SplitBillScreen } from "@/features/tools/screens/split-bill-screen";

export default function SplitBillRoute(): ReactElement {
  return (
    <PaywallGate featureKey="advanced_simulations">
      <SplitBillScreen />
    </PaywallGate>
  );
}
