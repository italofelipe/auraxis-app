import { act, renderHook } from "@testing-library/react-native";

import type { ImportTransactionDraft } from "@/features/import/contracts";
import { useImportReview } from "@/features/import/hooks/use-import-review";

const draft = (
  overrides: Partial<ImportTransactionDraft> = {},
): ImportTransactionDraft => ({
  id: "draft-1",
  date: "2026-05-01",
  description: "Uber",
  amount: "25.50",
  type: "expense",
  category: "transporte",
  confidence: 0.9,
  isDuplicate: false,
  missingFields: [],
  ...overrides,
});

const missingDescription = draft({ id: "d1", description: "", missingFields: ["description"] });
const missingAmount = draft({ id: "d2", amount: "0", missingFields: ["amount"] });

describe("useImportReview", () => {
  it("nao considera completo quando nao ha nada para conferir", () => {
    const { result } = renderHook(() => useImportReview([]));

    expect(result.current.totalCount).toBe(0);
    expect(result.current.pendingCount).toBe(0);
    // Lista vazia nao pode liberar um confirm que nunca teve pendencia.
    expect(result.current.isComplete).toBe(false);
    expect(result.current.completions).toEqual({});
  });

  it("conta cada linha incompleta como pendente ate ser respondida", () => {
    const { result } = renderHook(() =>
      useImportReview([missingDescription, missingAmount]),
    );

    expect(result.current.totalCount).toBe(2);
    expect(result.current.pendingCount).toBe(2);
    expect(result.current.resolvedCount).toBe(0);
    expect(result.current.isComplete).toBe(false);

    act(() => {
      result.current.answer("d1", "description", "Mercado do bairro");
    });

    expect(result.current.resolvedCount).toBe(1);
    expect(result.current.pendingCount).toBe(1);
    expect(result.current.isComplete).toBe(false);

    act(() => {
      result.current.answer("d2", "amount", "149,90");
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.completions).toEqual({
      d1: { description: "Mercado do bairro" },
      d2: { amount: "149,90" },
    });
  });

  it("trata resposta so com espacos como nao respondida", () => {
    const { result } = renderHook(() => useImportReview([missingDescription]));

    act(() => {
      result.current.answer("d1", "description", "   ");
    });

    // String vazia viraria 422 no backend, que valida com as regras do v1.
    expect(result.current.isComplete).toBe(false);
    expect(result.current.pendingCount).toBe(1);
    expect(result.current.completions).toEqual({});
  });

  it("apara espacos da resposta antes de montar o payload", () => {
    const { result } = renderHook(() => useImportReview([missingDescription]));

    act(() => {
      result.current.answer("d1", "description", "  Farmacia  ");
    });

    expect(result.current.completions).toEqual({ d1: { description: "Farmacia" } });
  });

  it("exige as duas respostas quando a linha perdeu titulo e valor", () => {
    const both = draft({
      id: "d3",
      description: "",
      amount: "0",
      missingFields: ["description", "amount"],
    });
    const { result } = renderHook(() => useImportReview([both]));

    act(() => {
      result.current.answer("d3", "description", "Conta de luz");
    });

    expect(result.current.isComplete).toBe(false);

    act(() => {
      result.current.answer("d3", "amount", "212,55");
    });

    expect(result.current.isComplete).toBe(true);
  });

  it("navega entre os cards sem sair dos limites da fila", () => {
    const { result } = renderHook(() =>
      useImportReview([missingDescription, missingAmount]),
    );

    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.goToPrevious();
    });
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentCard?.draft.id).toBe("d2");

    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it("limpa respostas e posicao no reset", () => {
    const { result } = renderHook(() =>
      useImportReview([missingDescription, missingAmount]),
    );

    act(() => {
      result.current.answer("d1", "description", "Mercado");
      result.current.goToNext();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.completions).toEqual({});
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.resolvedCount).toBe(0);
  });
});
