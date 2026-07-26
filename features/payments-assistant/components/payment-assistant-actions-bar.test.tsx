import { render } from "@testing-library/react-native";

import { PaymentAssistantActionsBar } from "@/features/payments-assistant/components/payment-assistant-actions-bar";
import { TestProviders } from "@/shared/testing/test-providers";

const mockLabels: Record<string, string> = {
  "paymentsAssistant.actions.processing": "Atualizando...",
  "paymentsAssistant.actions.delete": "Excluir",
  "paymentsAssistant.actions.skip": "Pular",
};

jest.mock("@/shared/i18n", () => ({
  useT: () => ({ t: (key: string) => mockLabels[key] ?? key }),
}));

describe("PaymentAssistantActionsBar", () => {
  test("uses accessible labels and prevents actions while a mutation is pending", () => {
    const onPay = jest.fn();
    const onDelete = jest.fn();
    const onSkip = jest.fn();
    const { getAllByRole, getByText } = render(
      <TestProviders>
        <PaymentAssistantActionsBar
          payLabel="Marcar como paga"
          isActing
          onPay={onPay}
          onDelete={onDelete}
          onSkip={onSkip}
        />
      </TestProviders>,
    );

    expect(getByText("Atualizando...")).toBeTruthy();
    expect(
      getAllByRole("button").every(
        (button) => button.props.accessibilityState?.disabled === true,
      ),
    ).toBe(true);

    expect(onPay).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(onSkip).not.toHaveBeenCalled();
  });
});
