import { appRoutes } from "@/core/navigation/routes";

export const WEEKLY_INSIGHT_FEATURE_FLAG_KEY = "app.insights.weekly";
export const AI_INSIGHT_TRANSPARENCY_FEATURE_FLAG_KEY = "app.insights.ai-transparency";
export const WEEKLY_INSIGHT_DASHBOARD_FOCUS_TARGET = "weekly-insight";
export const WEEKLY_INSIGHT_DASHBOARD_FOCUS_URL =
  `${appRoutes.private.dashboard}?focus=${WEEKLY_INSIGHT_DASHBOARD_FOCUS_TARGET}` as const;
