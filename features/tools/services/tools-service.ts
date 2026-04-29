import type { ToolsCatalog } from "@/features/tools/contracts";
import { isFeatureEnabled, resolveProviderDecision } from "@/shared/feature-flags";

import { getCanonicalToolsCatalog } from "@/features/tools/services/tools-catalog";

/**
 * Re-exports the canonical, hand-authored tools catalog. Kept under the
 * old `toolsPlaceholder` symbol so legacy imports keep compiling.
 *
 * @deprecated Prefer `getCanonicalToolsCatalog()` for new code.
 */
export const toolsPlaceholder: ToolsCatalog = getCanonicalToolsCatalog();

/**
 * Applies feature-flag overrides to the local catalog. We still keep
 * the salary-raise calculator hidden behind a flag because the entry
 * predates the canonical catalog and other call sites rely on the gate.
 *
 * @param catalog The base catalog to refine.
 * @returns Catalog with `enabled` normalised by local feature flags.
 */
export const applyToolsFlags = async (catalog: ToolsCatalog): Promise<ToolsCatalog> => {
  const flaggedTools = await Promise.all(
    catalog.tools.map(async (tool): Promise<ToolsCatalog["tools"][number]> => {
      if (tool.id !== "salary-raise" && tool.id !== "raise-calculator") {
        return tool;
      }
      const flagKey = "app.tools.salary-raise-calculator";
      const providerDecision = await resolveProviderDecision(flagKey);
      return {
        ...tool,
        enabled: isFeatureEnabled(flagKey, providerDecision),
      };
    }),
  );

  return { tools: flaggedTools };
};

export const createToolsService = () => {
  return {
    getCatalog: async (): Promise<ToolsCatalog> => {
      return applyToolsFlags(getCanonicalToolsCatalog());
    },
  };
};

export const toolsService = createToolsService();
