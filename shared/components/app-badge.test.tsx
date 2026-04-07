import { render } from "@testing-library/react-native";

import { AppBadge } from "@/shared/components/app-badge";
import { TestProviders } from "@/shared/testing/test-providers";

describe("AppBadge", () => {
  it("renderiza o badge com o texto esperado", () => {
    const { getByText } = render(
      <TestProviders>
        <AppBadge tone="primary">Premium</AppBadge>
      </TestProviders>,
    );

    expect(getByText("Premium")).toBeTruthy();
  });
});
