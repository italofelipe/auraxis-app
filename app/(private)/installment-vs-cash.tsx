import type { ReactElement } from "react";

import { PaywallGate } from "@/features/entitlements/components/paywall-gate";
import { InstallmentVsCashScreen } from "@/features/tools/screens/installment-vs-cash-screen";

export default function InstallmentVsCashRoute(): ReactElement {
  return (
    <PaywallGate featureKey="advanced_simulations">
      <InstallmentVsCashScreen />
    </PaywallGate>
  );
}
