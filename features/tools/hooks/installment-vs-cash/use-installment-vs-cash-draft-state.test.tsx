import { act, renderHook } from "@testing-library/react-native";

import { useInstallmentVsCashDraftState } from "./use-installment-vs-cash-draft-state";

describe("useInstallmentVsCashDraftState", () => {
  it("atualiza campos textuais e limpa erro específico", () => {
    const { result } = renderHook(() => useInstallmentVsCashDraftState());

    act(() => {
      result.current.setErrors({
        cashPrice: "Obrigatorio",
      });
      result.current.setTextField("cashPrice", "1500");
    });

    expect(result.current.draft.cashPrice).toBe("1500");
    expect(result.current.errors.cashPrice).toBeUndefined();
  });

  it("atualiza toggles estruturais do draft", () => {
    const { result } = renderHook(() => useInstallmentVsCashDraftState());

    act(() => {
      result.current.setInstallmentMode("amount");
      result.current.setDelayPreset("custom");
      result.current.setOpportunityRateType("inflation_only");
      result.current.setFeesEnabled(true);
    });

    expect(result.current.draft.installmentInputMode).toBe("amount");
    expect(result.current.draft.firstPaymentDelayPreset).toBe("custom");
    expect(result.current.draft.opportunityRateType).toBe("inflation_only");
    expect(result.current.draft.feesEnabled).toBe(true);
  });
});
