import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { SharedEntryCard } from "@/features/shared-entries/components/shared-entry-card";
import type { EntryView } from "@/features/shared-entries/services/shared-entries-classifier";

const buildView = (override: Partial<EntryView> = {}): EntryView => ({
  id: "se-1",
  ownerId: "u-1",
  transactionId: "tx-1",
  status: "active",
  splitType: "equal",
  transactionTitle: "Aluguel",
  transactionAmount: 2000,
  myShare: 1000,
  otherPartyEmail: "partner@auraxis.com",
  createdAt: "2026-04-01T00:00:00Z",
  updatedAt: "2026-04-02T00:00:00Z",
  bucket: "active",
  amountLabel: "R$ 2.000,00",
  myShareLabel: "R$ 1.000,00",
  ...override,
});

describe("SharedEntryCard", () => {
  it("renderiza title, valor total e sua parte", () => {
    const { getByText } = render(
      <AppProviders>
        <SharedEntryCard entry={buildView()} canRevoke={false} />
      </AppProviders>,
    );

    expect(getByText("Aluguel")).toBeTruthy();
    expect(getByText("R$ 2.000,00")).toBeTruthy();
    expect(getByText("R$ 1.000,00")).toBeTruthy();
    expect(getByText("Ativo")).toBeTruthy();
  });

  it("nao renderiza botao revoke quando canRevoke e false", () => {
    const onRevoke = jest.fn();
    const { queryByText } = render(
      <AppProviders>
        <SharedEntryCard entry={buildView()} canRevoke={false} onRevoke={onRevoke} />
      </AppProviders>,
    );
    expect(queryByText(/Revogar/i)).toBeNull();
  });

  it("dispara onRevoke quando canRevoke e true", () => {
    const onRevoke = jest.fn();
    const { getByText } = render(
      <AppProviders>
        <SharedEntryCard entry={buildView()} canRevoke onRevoke={onRevoke} />
      </AppProviders>,
    );
    fireEvent.press(getByText(/Revogar/));
    expect(onRevoke).toHaveBeenCalledTimes(1);
  });
});
