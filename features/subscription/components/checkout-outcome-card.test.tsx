import { fireEvent, render } from "@testing-library/react-native";

import { CheckoutOutcomeCard } from "@/features/subscription/components/checkout-outcome-card";
import { initI18n } from "@/shared/i18n";
import { TestProviders } from "@/shared/testing/test-providers";

describe("CheckoutOutcomeCard", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  it("renders success copy and CTA", () => {
    const onPrimary = jest.fn();
    const { getByText } = render(
      <TestProviders>
        <CheckoutOutcomeCard outcome="completed" onPrimaryAction={onPrimary} />
      </TestProviders>,
    );
    expect(getByText(/Pagamento confirmado/i)).toBeTruthy();
    fireEvent.press(getByText("Explorar o app"));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it("renders cancel copy with retry and back actions", () => {
    const onPrimary = jest.fn();
    const onSecondary = jest.fn();
    const { getByText } = render(
      <TestProviders>
        <CheckoutOutcomeCard
          outcome="canceled"
          onPrimaryAction={onPrimary}
          onSecondaryAction={onSecondary}
        />
      </TestProviders>,
    );
    expect(getByText(/Pagamento nao concluido/i)).toBeTruthy();
    fireEvent.press(getByText("Voltar"));
    expect(onSecondary).toHaveBeenCalledTimes(1);
    fireEvent.press(getByText("Tentar novamente"));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });
});
