import type { ReactElement } from "react";

import { InsightHub } from "@/features/insights/components/insight-hub";
import { useAiInsightsController } from "@/features/insights/hooks/use-ai-insights-controller";
import { AppScreen } from "@/shared/components/app-screen";

export function AiInsightsScreen(): ReactElement {
  const controller = useAiInsightsController();

  return (
    <AppScreen>
      <InsightHub controller={controller} />
    </AppScreen>
  );
}
