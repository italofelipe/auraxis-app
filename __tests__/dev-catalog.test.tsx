import { render } from "@testing-library/react-native";

import DevComponentsScreen, {
  DEV_COMPONENT_CATALOG_TEST_ID,
} from "@/app/(legal)/dev-catalog";
import { TestProviders } from "@/shared/testing/test-providers";

const wrap = (ui: React.ReactElement) => <TestProviders>{ui}</TestProviders>;

describe("DevComponentsScreen", () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;

  afterEach(() => {
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it("renderiza placeholder quando nao e build de desenvolvimento", () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    const { getByText, getByTestId } = render(wrap(<DevComponentsScreen />));
    expect(getByTestId(DEV_COMPONENT_CATALOG_TEST_ID)).toBeTruthy();
    expect(getByText("Catalogo nao disponivel")).toBeTruthy();
  });

  it("renderiza secoes do catalogo em builds de desenvolvimento", () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const { getAllByText, getByText } = render(wrap(<DevComponentsScreen />));
    expect(getByText("Component catalog")).toBeTruthy();
    expect(getByText("AppButton")).toBeTruthy();
    expect(getByText("AppInputField")).toBeTruthy();
    expect(getByText("AppMetricCard")).toBeTruthy();
    expect(getByText("AppEmptyState")).toBeTruthy();
    expect(getByText("AppSkeletonBlock")).toBeTruthy();
    // Sanity: ao menos um botao Primary renderizado pela seccao AppButton.
    expect(getAllByText("Primary").length).toBeGreaterThan(0);
  });
});
