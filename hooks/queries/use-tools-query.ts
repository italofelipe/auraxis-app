import { useQuery } from "@tanstack/react-query";

import { toolsApi, toolsPlaceholder } from "@/lib/tools-api";
import type { ToolsCatalog } from "@/types/contracts";

export const useToolsCatalogQuery = () => {
  return useQuery<ToolsCatalog>({
    queryKey: ["tools", "catalog"],
    queryFn: async (): Promise<ToolsCatalog> => {
      try {
        return await toolsApi.getCatalog();
      } catch {
        return toolsPlaceholder;
      }
    },
  });
};
