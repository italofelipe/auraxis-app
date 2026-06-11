import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import {
  DeleteConfirmModal,
  MarkPaidConfirmModal,
  todayLocalIsoDate,
} from "@/features/transactions/components/transaction-action-modals";

describe("MarkPaidConfirmModal", () => {
  const renderModal = (overrides: Record<string, unknown> = {}) => {
    const props = {
      target: { id: "tx-1", title: "Aluguel" },
      isSubmitting: false,
      onConfirm: jest.fn(),
      onClose: jest.fn(),
      ...overrides,
    };
    const rendered = render(
      <AppProviders>
        <MarkPaidConfirmModal {...props} />
      </AppProviders>,
    );
    return { ...rendered, props };
  };

  it("confirma pagamento com a data de hoje por padrao", () => {
    const { getByTestId, props } = renderModal();

    fireEvent.press(getByTestId("mark-paid-confirm"));
    expect(props.onConfirm).toHaveBeenCalledWith("tx-1", todayLocalIsoDate());
  });

  it("confirma pagamento com data customizada", () => {
    const { getByTestId, props } = renderModal();

    fireEvent.changeText(getByTestId("mark-paid-date-input"), "2026-06-01");
    fireEvent.press(getByTestId("mark-paid-confirm"));
    expect(props.onConfirm).toHaveBeenCalledWith("tx-1", "2026-06-01");
  });

  it("bloqueia confirmacao com data invalida", () => {
    const { getByTestId, getByText, props } = renderModal();

    fireEvent.changeText(getByTestId("mark-paid-date-input"), "01/06/2026");
    expect(getByText("Use o formato AAAA-MM-DD.")).toBeTruthy();

    fireEvent.press(getByTestId("mark-paid-confirm"));
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("cancelar fecha o modal", () => {
    const { getByText, props } = renderModal();

    fireEvent.press(getByText("Cancelar"));
    expect(props.onClose).toHaveBeenCalled();
  });
});

describe("DeleteConfirmModal", () => {
  const renderModal = (overrides: Record<string, unknown> = {}) => {
    const props = {
      target: { id: "tx-9", title: "Energia", isSeries: false },
      isDeleting: false,
      onConfirm: jest.fn(),
      onClose: jest.fn(),
      ...overrides,
    };
    const rendered = render(
      <AppProviders>
        <DeleteConfirmModal {...props} />
      </AppProviders>,
    );
    return { ...rendered, props };
  };

  it("transacao simples confirma exclusao com escopo occurrence", () => {
    const { getByTestId, queryByTestId, props } = renderModal();

    expect(queryByTestId("delete-series")).toBeNull();

    fireEvent.press(getByTestId("delete-occurrence"));
    expect(props.onConfirm).toHaveBeenCalledWith("tx-9", "occurrence");
  });

  it("serie oferece excluir somente esta ou a serie inteira", () => {
    const { getByTestId, getByText, props } = renderModal({
      target: { id: "tx-9", title: "Assinatura", isSeries: true },
    });

    expect(getByText("Excluir somente esta")).toBeTruthy();

    fireEvent.press(getByTestId("delete-series"));
    expect(props.onConfirm).toHaveBeenCalledWith("tx-9", "series");
  });

  it("cancelar fecha o modal", () => {
    const { getByText, props } = renderModal();

    fireEvent.press(getByText("Cancelar"));
    expect(props.onClose).toHaveBeenCalled();
  });
});
