export interface Simulation {
  readonly id: string;
  readonly name: string;
  readonly tool_slug: string;
  readonly inputs: Record<string, unknown>;
  readonly result: Record<string, unknown>;
  readonly created_at: string;
}

export interface SaveSimulationPayload {
  readonly name: string;
  readonly tool_slug: string;
  readonly inputs: Record<string, unknown>;
  readonly result: Record<string, unknown>;
}
