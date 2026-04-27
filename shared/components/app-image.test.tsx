import { render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";

import { AppImage } from "./app-image";

/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock("expo-image", () => {
  const React = require("react");
  const ExpoImageMock = React.forwardRef(
    (props: Record<string, unknown>, ref: unknown) =>
      React.createElement("ExpoImage", { ...props, ref }),
  );
  ExpoImageMock.displayName = "ExpoImageMock";
  return { Image: ExpoImageMock };
});
/* eslint-enable @typescript-eslint/no-require-imports */

describe("AppImage", () => {
  it("renderiza com cachePolicy memory-disk e transition default", () => {
    const tree = render(
      <AppProviders>
        <AppImage source={{ uri: "https://example.com/x.png" }} testID="img" />
      </AppProviders>,
    );
    const img = tree.getByTestId("img");
    expect(img.props.cachePolicy).toBe("memory-disk");
    expect(img.props.transition).toBe(200);
  });

  it("respeita override explícito de cachePolicy", () => {
    const tree = render(
      <AppProviders>
        <AppImage
          source={{ uri: "https://example.com/x.png" }}
          cachePolicy="none"
          testID="img"
        />
      </AppProviders>,
    );
    expect(tree.getByTestId("img").props.cachePolicy).toBe("none");
  });

  it("desliga transição quando fade=false", () => {
    const tree = render(
      <AppProviders>
        <AppImage
          source={{ uri: "https://example.com/x.png" }}
          fade={false}
          testID="img"
        />
      </AppProviders>,
    );
    expect(tree.getByTestId("img").props.transition).toBeUndefined();
  });
});
