import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import type { AlertRecord } from "@/features/alerts/contracts";
import { formatShortDate } from "@/shared/utils/formatters";

import { AlertRecordCard } from "./alert-record-card";

const buildAlert = (overrides?: Partial<AlertRecord>): AlertRecord => ({
  id: "alert-1",
  userId: "user-1",
  category: "payment_due",
  status: null,
  entityType: "transaction",
  entityId: "txn-123",
  triggeredAt: "2026-04-07T10:00:00Z",
  sentAt: null,
  createdAt: "2026-04-07T09:00:00Z",
  ...overrides,
});

describe("AlertRecordCard", () => {
  it("renderiza o alerta pendente e aciona handlers canonicos", () => {
    const onMarkRead = jest.fn();
    const onDelete = jest.fn();
    const alert = buildAlert();

    const { getByText } = render(
      <AppProviders>
        <AlertRecordCard
          alert={alert}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      </AppProviders>,
    );

    expect(getByText("payment due")).toBeTruthy();
    expect(getByText("novo")).toBeTruthy();
    expect(getByText("Referencia")).toBeTruthy();
    expect(getByText("txn-123")).toBeTruthy();
    expect(getByText(formatShortDate(alert.triggeredAt!))).toBeTruthy();

    fireEvent.press(getByText("Marcar lido"));
    fireEvent.press(getByText("Excluir"));

    expect(onMarkRead).toHaveBeenCalledWith("alert-1");
    expect(onDelete).toHaveBeenCalledWith("alert-1");
  });

  it("oculta a acao de leitura quando o alerta ja foi lido", () => {
    const { getByText, queryByText } = render(
      <AppProviders>
        <AlertRecordCard
          alert={buildAlert({
            status: "read",
            entityType: null,
            entityId: null,
            triggeredAt: null,
          })}
          onMarkRead={jest.fn()}
          onDelete={jest.fn()}
        />
      </AppProviders>,
    );

    expect(getByText("lido")).toBeTruthy();
    expect(queryByText("Marcar lido")).toBeNull();
  });
});
