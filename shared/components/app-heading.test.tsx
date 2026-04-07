import { render } from "@testing-library/react-native";

import { AppHeading } from "@/shared/components/app-heading";
import { TestProviders } from "@/shared/testing/test-providers";

describe("AppHeading", () => {
  it("renderiza headings em niveis diferentes", () => {
    const { getByText } = render(
      <TestProviders>
        <>
          <AppHeading level={1}>Titulo principal</AppHeading>
          <AppHeading level={3}>Subtitulo</AppHeading>
        </>
      </TestProviders>,
    );

    expect(getByText("Titulo principal")).toBeTruthy();
    expect(getByText("Subtitulo")).toBeTruthy();
  });
});
