import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { AppPeriodChips } from "@/shared/components/app-period-chips";

jest.mock("@/shared/feedback/haptics", () => ({
  triggerHapticImpact: jest.fn(),
}));

const OPTIONS = [
  { value: "month", label: "Mês" },
  { value: "quarter", label: "3m" },
  { value: "semester", label: "6m" },
] as const;

describe("AppPeriodChips", () => {
  it("renderiza todas as opções", () => {
    const { getByText } = render(
      <AppProviders>
        <AppPeriodChips options={OPTIONS} value="month" onChange={() => {}} />
      </AppProviders>,
    );

    expect(getByText("Mês")).toBeTruthy();
    expect(getByText("3m")).toBeTruthy();
    expect(getByText("6m")).toBeTruthy();
  });

  it("dispara onChange com o valor ao tocar um chip", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <AppProviders>
        <AppPeriodChips options={OPTIONS} value="month" onChange={onChange} />
      </AppProviders>,
    );

    fireEvent.press(getByTestId("period-chip-quarter"));
    expect(onChange).toHaveBeenCalledWith("quarter");
  });

  it("marca o chip ativo como selecionado", () => {
    const { getByTestId } = render(
      <AppProviders>
        <AppPeriodChips options={OPTIONS} value="semester" onChange={() => {}} />
      </AppProviders>,
    );

    expect(
      getByTestId("period-chip-semester").props.accessibilityState.selected,
    ).toBe(true);
    expect(
      getByTestId("period-chip-month").props.accessibilityState.selected,
    ).toBe(false);
  });
});
