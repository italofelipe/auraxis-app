import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { BlurSurface } from "@/shared/components/blur-surface";
import { TestProviders } from "@/shared/testing/test-providers";

describe("BlurSurface", () => {
  it("renders children with the theme-derived tint", () => {
    const { getByText } = render(
      <TestProviders>
        <BlurSurface>
          <Text>tab bar</Text>
        </BlurSurface>
      </TestProviders>,
    );

    expect(getByText("tab bar")).toBeTruthy();
  });

  it("accepts an explicit tint and intensity", () => {
    const { getByTestId } = render(
      <TestProviders>
        <BlurSurface testID="blur" tint="dark" intensity={80}>
          <Text>x</Text>
        </BlurSurface>
      </TestProviders>,
    );

    expect(getByTestId("blur")).toBeTruthy();
  });
});
