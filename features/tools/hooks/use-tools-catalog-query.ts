import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import {
  applyToolsFlags,
  toolsPlaceholder,
  toolsService,
} from "@/features/tools/services/tools-service";
import type { ToolsCatalog } from "@/features/tools/contracts";

/**
 * Loads the tools catalog using the canonical feature service.
 *
 * @returns Query result for the tools catalog with local flag fallbacks.
 */
export const useToolsCatalogQuery = () => {
  return useQuery<ToolsCatalog>({
    queryKey: queryKeys.tools.catalog(),
    queryFn: async (): Promise<ToolsCatalog> => {
      try {
        return await toolsService.getCatalog();
      } catch {
        return await applyToolsFlags(toolsPlaceholder);
      }
    },
  });
};
