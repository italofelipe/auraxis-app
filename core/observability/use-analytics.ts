import { getAnalyticsClient } from "@/core/observability/analytics-runtime";

import type { AnalyticsClient } from "@/core/observability/analytics-types";

export const useAnalytics = (): AnalyticsClient => {
  return getAnalyticsClient();
};
