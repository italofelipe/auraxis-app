import { useState, type ReactElement } from "react";

import { fireEvent, render } from "@testing-library/react-native";

import { CurrencyInputField } from "@/shared/forms/currency-input-field";
import { TestProviders } from "@/shared/testing/test-providers";

const Harness = ({
  onChange,
  initial = "",
}: {
  readonly onChange?: (amount: string) => void;
  readonly initial?: string;
}): ReactElement => {
  const [value, setValue] = useState(initial);
  return (
    <CurrencyInputField
      id="amount"
      label="Valor (R$)"
      placeholder="0,00"
      value={value}
      onChangeAmount={(amount) => {
        setValue(amount);
        onChange?.(amount);
      }}
    />
  );
};

describe("CurrencyInputField", () => {
  it("renders the label and placeholder", () => {
    const { getByText, getByPlaceholderText } = render(
      <TestProviders>
        <Harness />
      </TestProviders>,
    );

    expect(getByText("Valor (R$)")).toBeTruthy();
    expect(getByPlaceholderText("0,00")).toBeTruthy();
  });

  it("emits the canonical decimal string as the user types cents-first", () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <TestProviders>
        <Harness onChange={onChange} />
      </TestProviders>,
    );

    const input = getByPlaceholderText("0,00");
    fireEvent.changeText(input, "5");
    expect(onChange).toHaveBeenLastCalledWith("0.05");
  });

  it("shows the masked pt-BR amount for a canonical value", () => {
    const { getByDisplayValue } = render(
      <TestProviders>
        <Harness initial="120.25" />
      </TestProviders>,
    );

    expect(getByDisplayValue("120,25")).toBeTruthy();
  });

  it("renders an empty field (not NaN) for an empty value", () => {
    const { getByPlaceholderText } = render(
      <TestProviders>
        <Harness initial="" />
      </TestProviders>,
    );

    const input = getByPlaceholderText("0,00");
    expect(input.props.value).toBe("");
  });
});
