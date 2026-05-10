import React from "react";

import { render, type RenderResult } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";
import { createTestQueryClient } from "@/shared/testing/test-query-client";

/**
 * Renders a React element wrapped with all providers needed for E2E-style
 * integration tests: QueryClient, TamaguiProvider, Theme.
 *
 * Each call creates a fresh QueryClient so tests do not share cache state.
 */
export function renderWithProviders(ui: React.ReactElement): RenderResult {
  const queryClient = createTestQueryClient();
  return render(ui, {
    wrapper: ({ children }: { readonly children: React.ReactNode }) => (
      <TestProviders queryClient={queryClient}>{children}</TestProviders>
    ),
  });
}
