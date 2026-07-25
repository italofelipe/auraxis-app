import { render } from "@testing-library/react-native";

import { AppBadge } from "@/shared/components/app-badge";
import { TestProviders } from "@/shared/testing/test-providers";

const flattenStyle = (style: unknown): Record<string, unknown> => {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(flattenStyle));
  }
  return (style ?? {}) as Record<string, unknown>;
};

describe("AppBadge", () => {
  it("renderiza o badge com o texto esperado", () => {
    const { getByText } = render(
      <TestProviders>
        <AppBadge tone="primary">Premium</AppBadge>
      </TestProviders>,
    );

    expect(getByText("Premium")).toBeTruthy();
  });

  it("usa foreground de alto contraste no tom de perigo", () => {
    const { getByText } = render(
      <TestProviders themeName="auraxis_light">
        <AppBadge tone="danger">Alto risco</AppBadge>
      </TestProviders>,
    );
    const style = flattenStyle(getByText("Alto risco").props.style);
    expect(style.color).toBe("#ffffff");
  });
});
