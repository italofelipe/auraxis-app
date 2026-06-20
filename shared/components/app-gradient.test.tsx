import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppGradient } from "@/shared/components/app-gradient";
import { lightSemanticGradients } from "@/shared/theme";
import { TestProviders } from "@/shared/testing/test-providers";

describe("AppGradient", () => {
  it("renders children with a gradient token", () => {
    const { getByText } = render(
      <TestProviders>
        <AppGradient gradient={lightSemanticGradients.hero} borderRadius="$3">
          <Text>hero</Text>
        </AppGradient>
      </TestProviders>,
    );

    expect(getByText("hero")).toBeTruthy();
  });

  it("renders children from raw colors", () => {
    const { getByTestId } = render(
      <TestProviders>
        <AppGradient testID="grad" colors={["#000000", "#ffffff"]}>
          <Text>cta</Text>
        </AppGradient>
      </TestProviders>,
    );

    expect(getByTestId("grad")).toBeTruthy();
  });
});
