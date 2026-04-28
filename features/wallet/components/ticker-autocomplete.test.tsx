import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import type { BrapiTickerSearchResult } from "@/features/wallet/brapi-contracts";
import { TickerAutocomplete } from "@/features/wallet/components/ticker-autocomplete";

const mockSearchTickers = jest.fn<Promise<BrapiTickerSearchResult[]>, [string]>();

jest.mock("@/features/wallet/services/brapi-service", () => ({
  brapiService: {
    searchTickers: (...args: readonly unknown[]) => mockSearchTickers(...(args as [string])),
    getCurrentQuote: jest.fn(),
    getHistoricalPrices: jest.fn(),
    getFiiQuote: jest.fn(),
    getCurrencies: jest.fn(),
  },
  createBrapiService: jest.fn(),
}));

const buildResult = (
  overrides: Partial<BrapiTickerSearchResult> = {},
): BrapiTickerSearchResult => ({
  stock: "PETR4",
  name: "Petroleo Brasileiro PN",
  close: 38.5,
  change: 0.42,
  volume: 1_000_000,
  marketCapBasic: null,
  logo: null,
  sector: "Energy",
  ...overrides,
});

describe("TickerAutocomplete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderWithProviders = (props: {
    onChange: jest.Mock;
    onSelect: jest.Mock;
    value?: string;
  }) =>
    render(
      <AppProviders>
        <TickerAutocomplete
          id="ticker-input"
          value={props.value ?? ""}
          onChange={props.onChange}
          onSelect={props.onSelect}
          debounceMs={50}
        />
      </AppProviders>,
    );

  it("renders the input with default label", () => {
    const onChange = jest.fn();
    const onSelect = jest.fn();
    const { getByLabelText } = renderWithProviders({ onChange, onSelect });

    expect(getByLabelText("Ticker")).toBeTruthy();
  });

  it("does not call the search service when input is shorter than 2 chars", async () => {
    const onChange = jest.fn();
    const onSelect = jest.fn();
    const { getByLabelText } = renderWithProviders({ onChange, onSelect, value: "p" });

    fireEvent(getByLabelText("Ticker"), "focus");
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(mockSearchTickers).not.toHaveBeenCalled();
  });

  it("debounces, calls service and renders the matching results", async () => {
    mockSearchTickers.mockResolvedValue([
      buildResult(),
      buildResult({ stock: "PETR3", name: "Petroleo Brasileiro ON" }),
    ]);

    const onChange = jest.fn();
    const onSelect = jest.fn();
    const { getByLabelText, getByText } = renderWithProviders({
      onChange,
      onSelect,
      value: "petr",
    });

    fireEvent(getByLabelText("Ticker"), "focus");
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockSearchTickers).toHaveBeenCalledWith("petr");
    });

    await waitFor(() => {
      expect(getByText("PETR4")).toBeTruthy();
      expect(getByText("PETR3")).toBeTruthy();
    });
  });

  it("invokes onSelect and onChange with the picked ticker", async () => {
    mockSearchTickers.mockResolvedValue([buildResult()]);

    const onChange = jest.fn();
    const onSelect = jest.fn();
    const { getByLabelText, getByTestId } = renderWithProviders({
      onChange,
      onSelect,
      value: "petr",
    });

    fireEvent(getByLabelText("Ticker"), "focus");
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(getByTestId("ticker-autocomplete-result-PETR4")).toBeTruthy();
    });

    fireEvent.press(getByTestId("ticker-autocomplete-result-PETR4"));

    expect(onChange).toHaveBeenCalledWith("PETR4");
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ stock: "PETR4", name: "Petroleo Brasileiro PN" }),
    );
  });
});
