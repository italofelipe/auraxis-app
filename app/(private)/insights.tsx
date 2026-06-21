import type { ReactElement } from "react";

import { useLocalSearchParams } from "expo-router";

import { AiInsightsScreen } from "@/features/insights/screens/ai-insights-screen";
import { InsightsFluidaScreen } from "@/features/insights/screens/insights-fluida-screen";
import { AI_INSIGHTS_FLUIDA_FEATURE_FLAG_KEY } from "@/features/insights/insights-config";
import { isFeatureEnabled } from "@/shared/feature-flags";
import {
  INSIGHT_DIMENSION_PARAM,
  parseInsightDimensionParam,
} from "@/shared/insights";

export default function InsightsRoute(): ReactElement {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const initialDimension = parseInsightDimensionParam(
    params[INSIGHT_DIMENSION_PARAM],
  );

  if (isFeatureEnabled(AI_INSIGHTS_FLUIDA_FEATURE_FLAG_KEY)) {
    return <InsightsFluidaScreen initialDimension={initialDimension} />;
  }

  return <AiInsightsScreen />;
}
