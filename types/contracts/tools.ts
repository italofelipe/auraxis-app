/**
 * Canonical categories used to group tools in the hub.
 * Order in the UI follows the order defined here.
 */
export const TOOL_CATEGORIES = [
  "salary-and-work",
  "investments",
  "debt-and-financing",
  "real-estate",
  "daily-life",
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

/**
 * Canonical tool definition surfaced by the hub.
 *
 * - `id` is a stable slug used both for routing (`/ferramentas/[slug]`) and
 *   feature-flag keys (`app.tools.<id>`).
 * - `enabled = false` puts the card on the "Em breve" track.
 * - `requiresPremium = true` lets the hub render a premium badge and the
 *   detail screen short-circuit through the paywall gate.
 */
export interface ToolDefinition {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly category: ToolCategory;
  readonly enabled: boolean;
  readonly requiresPremium?: boolean;
  /** Internal route the tool opens to (when null, hub shows "Em breve"). */
  readonly route?: string | null;
}

export interface ToolsCatalog {
  readonly tools: ToolDefinition[];
}
