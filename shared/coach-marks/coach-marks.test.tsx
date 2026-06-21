import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { CoachMarks, type CoachMarkVisualStep } from "@/shared/coach-marks/coach-marks";
import type { Rect } from "@/shared/coach-marks/coach-marks-geometry";
import { TestProviders } from "@/shared/testing/test-providers";

const STEPS: readonly CoachMarkVisualStep[] = [
  {
    id: "welcome",
    anchorKey: null,
    center: true,
    padding: 0,
    radius: 16,
    eyebrow: "BEM-VINDO",
    title: "Boas-vindas",
    body: "Texto inicial.",
  },
  {
    id: "cards",
    anchorKey: "cards",
    center: false,
    padding: 8,
    radius: 16,
    eyebrow: "PASSO 2 DE 2",
    title: "Cartões",
    body: "Detalhe **importante**.",
  },
];

const RECT: Rect = { top: 200, left: 24, width: 320, height: 160 };

describe("CoachMarks", () => {
  it("não renderiza nada quando inativo", () => {
    const { queryByTestId } = render(
      <TestProviders>
        <CoachMarks
          steps={STEPS}
          active={false}
          measureAnchor={jest.fn().mockResolvedValue(RECT)}
          onFinish={jest.fn()}
        />
      </TestProviders>,
    );
    expect(queryByTestId("coach-tooltip")).toBeNull();
  });

  it("renderiza o primeiro passo centralizado quando ativo", async () => {
    const { getByTestId, getByText } = render(
      <TestProviders>
        <CoachMarks
          steps={STEPS}
          active
          measureAnchor={jest.fn().mockResolvedValue(RECT)}
          onFinish={jest.fn()}
        />
      </TestProviders>,
    );
    await waitFor(() => expect(getByTestId("coach-tooltip")).toBeTruthy());
    expect(getByText("Boas-vindas")).toBeTruthy();
    // Passo central: dim de tela cheia, sem anel.
    expect(getByTestId("coach-marks-dim-full")).toBeTruthy();
  });

  it("avança e conclui chamando onFinish no último passo", async () => {
    const onFinish = jest.fn();
    const { getByTestId, getByText } = render(
      <TestProviders>
        <CoachMarks
          steps={STEPS}
          active
          measureAnchor={jest.fn().mockResolvedValue(RECT)}
          onFinish={onFinish}
          finishLabel="Começar"
        />
      </TestProviders>,
    );
    await waitFor(() => expect(getByTestId("coach-tooltip")).toBeTruthy());

    // Passo 1 → 2 (com âncora): mede e mostra o recorte (anel), não centralizado.
    fireEvent.press(getByTestId("coach-tooltip-next"));
    await waitFor(() => expect(getByText("Cartões")).toBeTruthy());
    await waitFor(() => expect(getByTestId("coach-marks-ring")).toBeTruthy());

    // Último passo → "Começar" conclui.
    await waitFor(() => expect(getByText("Começar")).toBeTruthy());
    fireEvent.press(getByTestId("coach-tooltip-next"));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("pula o tour pelo botão Pular", async () => {
    const onFinish = jest.fn();
    const { getByTestId } = render(
      <TestProviders>
        <CoachMarks
          steps={STEPS}
          active
          measureAnchor={jest.fn().mockResolvedValue(RECT)}
          onFinish={onFinish}
        />
      </TestProviders>,
    );
    await waitFor(() => expect(getByTestId("coach-tooltip")).toBeTruthy());
    fireEvent.press(getByTestId("coach-tooltip-skip"));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
