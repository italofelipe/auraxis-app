import { render } from "@testing-library/react-native";

import { resetAppShellStore } from "@/core/shell/app-shell-store";
import type { Rect } from "@/shared/coach-marks/coach-marks-geometry";
import { CoachMarksOverlay } from "@/shared/coach-marks/coach-marks-overlay";

const RECT: Rect = { top: 200, left: 24, width: 320, height: 160 };

describe("CoachMarksOverlay", () => {
  afterEach(() => {
    resetAppShellStore();
  });

  it("renderiza anel e glow quando há recorte", () => {
    const { getByTestId } = render(
      <CoachMarksOverlay cutout={RECT} radius={16} />,
    );
    expect(getByTestId("coach-marks-ring")).toBeTruthy();
    expect(getByTestId("coach-marks-glow")).toBeTruthy();
  });

  it("escurece a tela inteira (sem anel) em passo centralizado", () => {
    const { getByTestId, queryByTestId } = render(
      <CoachMarksOverlay cutout={null} radius={16} />,
    );
    expect(getByTestId("coach-marks-dim-full")).toBeTruthy();
    expect(queryByTestId("coach-marks-ring")).toBeNull();
  });

  it("posiciona o recorte sem animar quando 'reduce motion' está ativo", () => {
    resetAppShellStore({ reducedMotionEnabled: true });
    const { getByTestId } = render(
      <CoachMarksOverlay cutout={RECT} radius={999} />,
    );
    expect(getByTestId("coach-marks-ring")).toBeTruthy();
    expect(getByTestId("coach-marks-glow")).toBeTruthy();
  });
});
