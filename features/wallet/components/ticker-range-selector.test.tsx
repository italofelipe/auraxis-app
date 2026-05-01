import { fireEvent, render } from "@testing-library/react-native";

import { TickerRangeSelector } from "@/features/wallet/components/ticker-range-selector";
import { TestProviders } from "@/shared/testing/test-providers";

const wrap = (ui: React.ReactElement) => <TestProviders>{ui}</TestProviders>;

describe("TickerRangeSelector", () => {
  it("renderiza todos os ranges suportados pela BRAPI", () => {
    const { getByTestId } = render(
      wrap(<TickerRangeSelector selectedRange="1mo" onSelect={jest.fn()} />),
    );
    ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y", "max"].forEach((range) => {
      expect(getByTestId(`ticker-range-${range}`)).toBeTruthy();
    });
  });

  it("dispara onSelect com o range escolhido", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      wrap(<TickerRangeSelector selectedRange="1mo" onSelect={onSelect} />),
    );
    fireEvent.press(getByTestId("ticker-range-1y"));
    expect(onSelect).toHaveBeenCalledWith("1y");
  });

  it("repassa disabled para os botoes", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      wrap(
        <TickerRangeSelector
          selectedRange="1mo"
          onSelect={onSelect}
          disabled
        />,
      ),
    );
    expect(getByTestId("ticker-range-1y").props.accessibilityState.disabled).toBe(
      true,
    );
  });
});
