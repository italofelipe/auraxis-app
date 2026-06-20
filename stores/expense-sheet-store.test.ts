import { act } from "@testing-library/react-native";

import {
  resetExpenseSheetStore,
  useExpenseSheetStore,
} from "@/stores/expense-sheet-store";

describe("useExpenseSheetStore", () => {
  beforeEach(() => {
    resetExpenseSheetStore();
  });

  it("começa fechado", () => {
    expect(useExpenseSheetStore.getState().isOpen).toBe(false);
  });

  it("open() abre o sheet", () => {
    act(() => {
      useExpenseSheetStore.getState().open();
    });
    expect(useExpenseSheetStore.getState().isOpen).toBe(true);
  });

  it("close() fecha o sheet", () => {
    act(() => {
      useExpenseSheetStore.getState().open();
    });
    act(() => {
      useExpenseSheetStore.getState().close();
    });
    expect(useExpenseSheetStore.getState().isOpen).toBe(false);
  });

  it("resetExpenseSheetStore() volta ao estado fechado", () => {
    act(() => {
      useExpenseSheetStore.getState().open();
    });
    resetExpenseSheetStore();
    expect(useExpenseSheetStore.getState().isOpen).toBe(false);
  });
});
