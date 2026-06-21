import { fireEvent, render } from "@testing-library/react-native";

import type { TooltipPlacement } from "@/shared/coach-marks/coach-marks-geometry";
import { CoachTooltip } from "@/shared/coach-marks/coach-tooltip";
import { TestProviders } from "@/shared/testing/test-providers";

const PLACEMENT_BELOW: TooltipPlacement = {
  top: 320,
  left: 18,
  width: 354,
  below: true,
  caretX: 195,
};

const PLACEMENT_CENTERED: TooltipPlacement = {
  top: 320,
  left: 18,
  width: 354,
  below: true,
  caretX: null,
};

const renderTooltip = (
  overrides: Partial<React.ComponentProps<typeof CoachTooltip>> = {},
) => {
  const onNext = jest.fn();
  const onBack = jest.fn();
  const onSkip = jest.fn();
  const utils = render(
    <TestProviders>
      <CoachTooltip
        placement={PLACEMENT_BELOW}
        eyebrow="PASSO 2 DE 8"
        title="Reunimos todos os seus cartões"
        body="Deslize para navegar. O cartão **Todos os cartões** soma tudo."
        index={1}
        total={8}
        showBack
        primaryLabel="Próximo"
        animationKey={1}
        onNext={onNext}
        onBack={onBack}
        onSkip={onSkip}
        {...overrides}
      />
    </TestProviders>,
  );
  return { ...utils, onNext, onBack, onSkip };
};

describe("CoachTooltip", () => {
  it("renderiza eyebrow, título e o corpo com trechos em negrito", () => {
    const { getByText } = renderTooltip();
    expect(getByText("PASSO 2 DE 8")).toBeTruthy();
    expect(getByText("Reunimos todos os seus cartões")).toBeTruthy();
    // O trecho em negrito é um segmento textual próprio.
    expect(getByText("Todos os cartões")).toBeTruthy();
  });

  it("mostra o caret quando há alvo", () => {
    const { getByTestId } = renderTooltip();
    expect(getByTestId("coach-tooltip-caret")).toBeTruthy();
  });

  it("omite o caret em passos centralizados", () => {
    const { queryByTestId } = renderTooltip({ placement: PLACEMENT_CENTERED });
    expect(queryByTestId("coach-tooltip-caret")).toBeNull();
  });

  it("dispara onNext, onBack e onSkip", () => {
    const { getByTestId, onNext, onBack, onSkip } = renderTooltip();
    fireEvent.press(getByTestId("coach-tooltip-next"));
    fireEvent.press(getByTestId("coach-tooltip-back"));
    fireEvent.press(getByTestId("coach-tooltip-skip"));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("oculta 'Voltar' no primeiro passo", () => {
    const { queryByTestId } = renderTooltip({ showBack: false });
    expect(queryByTestId("coach-tooltip-back")).toBeNull();
  });

  it("renderiza um dot por passo", () => {
    const { getByTestId } = renderTooltip();
    const dots = getByTestId("coach-tooltip-dots");
    expect(dots.children).toHaveLength(8);
  });

  it("usa o rótulo de avanço fornecido (ex.: Começar)", () => {
    const { getByText } = renderTooltip({ primaryLabel: "Começar" });
    expect(getByText("Começar")).toBeTruthy();
  });
});
