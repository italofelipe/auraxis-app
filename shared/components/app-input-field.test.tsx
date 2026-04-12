import { render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";

import { AppInputField } from "./app-input-field";

describe("AppInputField", () => {
  it("renderiza label e helper text", () => {
    const { getByText } = render(
      <AppProviders>
        <AppInputField
          id="email"
          label="E-mail"
          helperText="Use o mesmo e-mail da sua conta"
        />
      </AppProviders>,
    );

    expect(getByText("E-mail")).toBeTruthy();
    expect(getByText("Use o mesmo e-mail da sua conta")).toBeTruthy();
  });

  it("prioriza error text quando presente", () => {
    const { getByText, queryByText } = render(
      <AppProviders>
        <AppInputField
          id="email"
          label="E-mail"
          helperText="helper"
          errorText="Campo obrigatório"
        />
      </AppProviders>,
    );

    expect(getByText("Campo obrigatório")).toBeTruthy();
    expect(queryByText("helper")).toBeNull();
  });
});
