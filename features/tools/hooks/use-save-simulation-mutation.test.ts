import { describe, expect, it, jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { useSaveSimulationMutation } from "@/features/tools/hooks/use-save-simulation-mutation";
import type {
  SaveSimulationCommand,
  SimulationRecord,
} from "@/features/tools/contracts";

const mockSaveSimulation = jest.fn<(command: SaveSimulationCommand) => Promise<SimulationRecord>>();

jest.mock("@/features/tools/services/simulations-service", () => ({
  simulationsService: {
    saveSimulation: (command: SaveSimulationCommand): Promise<SimulationRecord> => {
      return mockSaveSimulation(command);
    },
  },
}));

const buildRecord = (overrides: Partial<SimulationRecord> = {}): SimulationRecord => ({
  id: "sim-saved",
  toolId: "compound-interest",
  ruleVersion: "2026.04",
  inputs: { initial: 1000 },
  result: { finalAmount: 1500 },
  metadata: null,
  saved: true,
  goalId: null,
  createdAt: "2026-04-29T00:00:00Z",
  ...overrides,
});

const wrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client }, children);
};

describe("useSaveSimulationMutation", () => {
  it("chama o service e devolve o registro persistido", async () => {
    mockSaveSimulation.mockResolvedValueOnce(buildRecord());

    const { result } = renderHook(() => useSaveSimulationMutation(), { wrapper });

    const record = await result.current.mutateAsync({
      toolId: "compound-interest",
      ruleVersion: "2026.04",
      inputs: { initial: 1000 },
      result: { finalAmount: 1500 },
    });

    expect(mockSaveSimulation).toHaveBeenCalledTimes(1);
    expect(record.id).toBe("sim-saved");
  });

  it("propaga erro do service como reject da mutation", async () => {
    mockSaveSimulation.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useSaveSimulationMutation(), { wrapper });

    await expect(
      result.current.mutateAsync({
        toolId: "compound-interest",
        ruleVersion: "2026.04",
        inputs: {},
        result: {},
      }),
    ).rejects.toThrow("network down");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
