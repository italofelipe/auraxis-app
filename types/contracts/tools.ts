export interface ToolDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
}

export interface ToolsCatalog {
  readonly tools: ToolDefinition[];
}
