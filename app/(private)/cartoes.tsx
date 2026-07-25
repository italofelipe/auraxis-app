import type { ReactElement } from "react";

import { CriticalTabRoute } from "@/core/navigation/critical-tab-route";
import { CreditCardsScreen } from "@/features/credit-cards/screens/credit-cards-screen";

export default function CreditCardsRoute(): ReactElement {
  return (
    <CriticalTabRoute route="credit-cards" title="Cartões">
      <CreditCardsScreen />
    </CriticalTabRoute>
  );
}
