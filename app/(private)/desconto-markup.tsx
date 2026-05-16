import type { ReactElement } from "react";

import { PaywallGate } from "@/features/entitlements/components/paywall-gate";
import { DescontoMarkupScreen } from "@/features/tools/screens/desconto-markup-screen";

export default function DescontoMarkupRoute(): ReactElement {
  return (
    <PaywallGate featureKey="advanced_simulations">
      <DescontoMarkupScreen />
    </PaywallGate>
  );
}
