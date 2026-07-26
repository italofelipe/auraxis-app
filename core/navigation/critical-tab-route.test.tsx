import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { Text } from "react-native";

import { CriticalTabRoute } from "@/core/navigation/critical-tab-route";
import { navigationLogger } from "@/core/telemetry/domain-loggers";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("@/core/telemetry/domain-loggers", () => ({
  navigationLogger: { log: jest.fn() },
  runtimeLogger: { log: jest.fn() },
}));

const mockedLog = jest.mocked(navigationLogger.log);

function CrashingTab(): ReactElement {
  throw new Error("native composition failed");
}

describe("CriticalTabRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("records mount and unmount breadcrumbs for the critical route", () => {
    const { unmount } = render(
      <TestProviders>
        <CriticalTabRoute route="insights" title="Insights">
          <Text>Conteúdo</Text>
        </CriticalTabRoute>
      </TestProviders>,
    );

    expect(mockedLog).toHaveBeenCalledWith("navigation.critical_tab_mounted", {
      context: { route: "insights" },
    });

    unmount();

    expect(mockedLog).toHaveBeenCalledWith("navigation.critical_tab_unmounted", {
      context: { route: "insights" },
    });
  });

  test("contains a tab exception and keeps a retryable screen mounted", () => {
    const { getByText, getByTestId } = render(
      <TestProviders>
        <CriticalTabRoute route="credit-cards" title="Cartões">
          <CrashingTab />
        </CriticalTabRoute>
      </TestProviders>,
    );

    expect(getByTestId("credit-cards-error-boundary")).toBeTruthy();
    expect(getByText("Não foi possível abrir Cartões")).toBeTruthy();
    expect(getByText("Tentar novamente")).toBeTruthy();
  });
});
