import { useRouter } from "expo-router";

import { useToolsCatalogQuery } from "@/features/tools/hooks/use-tools-catalog-query";

export interface ToolsScreenController {
  readonly toolsCatalogQuery: ReturnType<typeof useToolsCatalogQuery>;
  readonly handleOpenTool: (toolId: string) => Promise<void>;
}

/**
 * Creates the canonical controller for the tools catalog route.
 *
 * @returns View-only bindings for the tools catalog and navigation actions.
 */
export function useToolsScreenController(): ToolsScreenController {
  const router = useRouter();
  const toolsCatalogQuery = useToolsCatalogQuery();

  return {
    toolsCatalogQuery,
    handleOpenTool: async (toolId: string): Promise<void> => {
      if (toolId === "installment-vs-cash") {
        await router.push("/installment-vs-cash");
      }
    },
  };
}
