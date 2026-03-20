import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppProviders } from "./app-providers";

describe("AppProviders", () => {
  it("renderiza os filhos dentro do provider tree", () => {
    const { getByText } = render(
      <AppProviders>
        <Text>Runtime mobile</Text>
      </AppProviders>,
    );

    expect(getByText("Runtime mobile")).toBeTruthy();
  });
});
