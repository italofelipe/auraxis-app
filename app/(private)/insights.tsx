import type { ReactElement } from "react";

import { AiInsightsScreen } from "@/features/insights/screens/ai-insights-screen";
import { InsightsFluidaScreen } from "@/features/insights/screens/insights-fluida-screen";
import { AI_INSIGHTS_FLUIDA_FEATURE_FLAG_KEY } from "@/features/insights/insights-config";
import { isFeatureEnabled } from "@/shared/feature-flags";

export default function InsightsRoute(): ReactElement {
  if (isFeatureEnabled(AI_INSIGHTS_FLUIDA_FEATURE_FLAG_KEY)) {
    return <InsightsFluidaScreen />;
  }

  return <AiInsightsScreen />;
}
