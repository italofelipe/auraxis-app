import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { SharedInvitationCard } from "@/features/shared-entries/components/shared-invitation-card";
import type { InvitationView } from "@/features/shared-entries/services/shared-entries-classifier";

const buildView = (override: Partial<InvitationView> = {}): InvitationView => ({
  id: "inv-1",
  sharedEntryId: "se-1",
  fromUserId: "u-1",
  toUserEmail: "partner@auraxis.com",
  toUserId: null,
  splitValue: 50,
  shareAmount: null,
  message: "Aluguel",
  status: "pending",
  token: "t",
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  createdAt: "2026-04-01T00:00:00Z",
  respondedAt: null,
  bucket: "pending",
  isExpired: false,
  shareLabel: "Sua parte: 50%",
  ...override,
});

describe("SharedInvitationCard", () => {
  it("renderiza email do remetente, mensagem e share label", () => {
    const { getByText } = render(
      <AppProviders>
        <SharedInvitationCard
          invitation={buildView()}
          onAccept={jest.fn()}
          onReject={jest.fn()}
          isPending={false}
        />
      </AppProviders>,
    );

    expect(getByText("partner@auraxis.com")).toBeTruthy();
    expect(getByText("Aluguel")).toBeTruthy();
    expect(getByText("Sua parte: 50%")).toBeTruthy();
  });

  it("dispara onAccept e onReject", () => {
    const onAccept = jest.fn();
    const onReject = jest.fn();
    const { getByText } = render(
      <AppProviders>
        <SharedInvitationCard
          invitation={buildView()}
          onAccept={onAccept}
          onReject={onReject}
          isPending={false}
        />
      </AppProviders>,
    );

    fireEvent.press(getByText("Aceitar"));
    fireEvent.press(getByText("Recusar"));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("mostra badge de expirado quando isExpired e true", () => {
    const { getByText } = render(
      <AppProviders>
        <SharedInvitationCard
          invitation={buildView({ isExpired: true })}
          onAccept={jest.fn()}
          onReject={jest.fn()}
          isPending={false}
        />
      </AppProviders>,
    );
    expect(getByText("Expirado")).toBeTruthy();
  });
});
