import type { ReactElement } from "react";

import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppErrorBoundary } from "@/core/errors/app-error-boundary";
import { appLogger } from "@/core/telemetry/app-logger";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("@/core/telemetry/app-logger", () => ({
  appLogger: {
    error: jest.fn(),
  },
}));

describe("AppErrorBoundary", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renderiza fallback canônico e permite reset do boundary", () => {
    const runtimeState = {
      shouldThrow: true,
    };
    const handleReset = jest.fn(() => {
      runtimeState.shouldThrow = false;
    });

    const FlakyComponent = (): ReactElement => {
      if (runtimeState.shouldThrow) {
        throw new Error("Boom");
      }

      return <Text>Runtime recuperado</Text>;
    };

    const { getByText } = render(
      <TestProviders>
        <AppErrorBoundary
          scope="private-layout"
          presentation="screen"
          fallbackTitle="Nao foi possivel abrir a area logada"
          onReset={handleReset}>
          <FlakyComponent />
        </AppErrorBoundary>
      </TestProviders>,
    );

    expect(getByText("Nao foi possivel abrir a area logada")).toBeTruthy();
    fireEvent.press(getByText("Tentar novamente"));
    expect(handleReset).toHaveBeenCalledTimes(1);
    expect(getByText("Runtime recuperado")).toBeTruthy();
    expect(appLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: "runtime",
        event: "runtime.error_boundary_captured",
      }),
    );
  });
});
