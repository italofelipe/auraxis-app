import { createRef } from "react";
import type { ScrollView as NativeScrollView } from "react-native";

import { render, waitFor } from "@testing-library/react-native";

import {
  CardsTour,
  type CardsTourHandle,
} from "@/features/credit-cards/cards-tour/cards-tour";
import { loadCardsTourSeen } from "@/features/credit-cards/services/cards-tour-seen-storage";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("@/features/credit-cards/services/cards-tour-seen-storage", () => ({
  loadCardsTourSeen: jest.fn(),
  persistCardsTourSeen: jest.fn().mockResolvedValue(undefined),
}));

const mockLoadSeen = jest.mocked(loadCardsTourSeen);

const makeProps = () => ({
  handlers: { setView: jest.fn(), selectCard: jest.fn() },
  scrollRef: { current: null } as React.RefObject<NativeScrollView | null>,
  measureAnchor: jest.fn().mockResolvedValue(null),
});

describe("CardsTour", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadSeen.mockResolvedValue(true);
  });

  it("não renderiza o tooltip quando inativo (já visto, sem replay)", async () => {
    const props = makeProps();
    const { queryByTestId } = render(
      <TestProviders>
        <CardsTour {...props} autoOpenEnabled />
      </TestProviders>,
    );
    await waitFor(() => expect(mockLoadSeen).toHaveBeenCalled());
    expect(queryByTestId("coach-tooltip")).toBeNull();
  });

  it("abre automaticamente na primeira visita", async () => {
    mockLoadSeen.mockResolvedValue(false);
    const props = makeProps();
    const { getByTestId } = render(
      <TestProviders>
        <CardsTour {...props} autoOpenEnabled />
      </TestProviders>,
    );
    await waitFor(() => expect(getByTestId("coach-tooltip")).toBeTruthy());
    expect(getByTestId("coach-tooltip-dots").children).toHaveLength(8);
  });

  it("reabre via a ref imperativa (replay do botão ?)", async () => {
    const props = makeProps();
    const ref = createRef<CardsTourHandle>();
    const { getByTestId, queryByTestId } = render(
      <TestProviders>
        <CardsTour {...props} autoOpenEnabled={false} controllerRef={ref} />
      </TestProviders>,
    );
    expect(queryByTestId("coach-tooltip")).toBeNull();

    ref.current?.open();
    await waitFor(() => expect(getByTestId("coach-tooltip")).toBeTruthy());
  });
});
