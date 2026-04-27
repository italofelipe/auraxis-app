import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";

import { AppEmptyState } from "./app-empty-state";

describe("AppEmptyState", () => {
  it("renderiza titulo e descricao para a ilustracao informada", () => {
    const { getByText } = render(
      <AppProviders>
        <AppEmptyState
          illustration="transactions"
          title="Nenhuma transacao"
          description="Crie a primeira para comecar."
          testID="empty-tx"
        />
      </AppProviders>,
    );

    expect(getByText("Nenhuma transacao")).toBeTruthy();
    expect(getByText("Crie a primeira para comecar.")).toBeTruthy();
  });

  it("dispara CTA quando informada", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AppProviders>
        <AppEmptyState
          illustration="goals"
          title="Sem metas"
          cta={{ label: "Criar meta", onPress }}
        />
      </AppProviders>,
    );

    fireEvent.press(getByText("Criar meta"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renderiza customIllustration quando fornecida", () => {
    const { getByText } = render(
      <AppProviders>
        <AppEmptyState
          illustration="generic"
          title="Vazio"
          customIllustration={<></>}
        />
      </AppProviders>,
    );

    expect(getByText("Vazio")).toBeTruthy();
  });
});
