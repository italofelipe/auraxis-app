import { useRouter } from "expo-router";
import { useMemo, useState } from "react";

import { appRoutes } from "@/core/navigation/routes";
import {
  TOOL_CATEGORIES,
  type ToolCategory,
  type ToolDefinition,
} from "@/features/tools/contracts";
import { useToolsCatalogQuery } from "@/features/tools/hooks/use-tools-catalog-query";

export interface ToolsCategorySection {
  readonly category: ToolCategory;
  readonly tools: readonly ToolDefinition[];
}

export interface ToolsScreenController {
  readonly toolsCatalogQuery: ReturnType<typeof useToolsCatalogQuery>;
  readonly searchTerm: string;
  readonly handleSearchChange: (next: string) => void;
  readonly visibleSections: readonly ToolsCategorySection[];
  readonly emptyResults: boolean;
  readonly handleOpenTool: (tool: ToolDefinition) => void;
  readonly handleOpenSimulationsHistory: () => void;
}

const matchesQuery = (tool: ToolDefinition, query: string): boolean => {
  if (query.length === 0) {
    return true;
  }
  const haystack = `${tool.name} ${tool.description} ${tool.slug}`.toLowerCase();
  return haystack.includes(query);
};

const buildSections = (
  tools: readonly ToolDefinition[],
  query: string,
): ToolsCategorySection[] => {
  const normalised = query.trim().toLowerCase();
  return TOOL_CATEGORIES.map((category) => {
    const filtered = tools
      .filter((tool) => tool.category === category)
      .filter((tool) => matchesQuery(tool, normalised));
    return { category, tools: filtered };
  }).filter((section) => section.tools.length > 0);
};

/**
 * Canonical controller for the tools hub. Owns the search bar state,
 * derives the categorised sections from the canonical catalog, and
 * forwards taps on each tool to the route declared by the entry.
 */
export function useToolsScreenController(): ToolsScreenController {
  const router = useRouter();
  const toolsCatalogQuery = useToolsCatalogQuery();
  const [searchTerm, setSearchTerm] = useState("");

  const tools = useMemo<readonly ToolDefinition[]>(
    () => toolsCatalogQuery.data?.tools ?? [],
    [toolsCatalogQuery.data],
  );

  const visibleSections = useMemo(
    () => buildSections(tools, searchTerm),
    [tools, searchTerm],
  );

  const emptyResults = visibleSections.length === 0 && tools.length > 0;

  return {
    toolsCatalogQuery,
    searchTerm,
    handleSearchChange: (next) => setSearchTerm(next),
    visibleSections,
    emptyResults,
    handleOpenTool: (tool) => {
      if (!tool.enabled || !tool.route) {
        return;
      }
      router.push(tool.route as never);
    },
    handleOpenSimulationsHistory: () => {
      router.push(appRoutes.private.simulationsHistory);
    },
  };
}
