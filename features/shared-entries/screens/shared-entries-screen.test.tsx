import { fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { AppProviders } from "@/core/providers/app-providers";
import { SharedEntriesScreen } from "@/features/shared-entries/screens/shared-entries-screen";
import { useSharedEntriesScreenController } from "@/features/shared-entries/hooks/use-shared-entries-screen-controller";

jest.mock(
  "@/features/shared-entries/hooks/use-shared-entries-screen-controller",
  () => ({
    useSharedEntriesScreenController: jest.fn(),
  }),
);

jest.mock("@/features/entitlements/components/paywall-gate", () => {
  const ReactInner = jest.requireActual("react");
  const ReactNative = jest.requireActual("react-native");

  return {
    PaywallGate: ({
      featureKey,
      children,
    }: {
      readonly featureKey: string;
      readonly children: ReactNode;
    }) =>
      ReactInner.createElement(
        ReactNative.View,
        { testID: `paywall-${featureKey}` },
        children,
      ),
  };
});

const mockedUseController = jest.mocked(useSharedEntriesScreenController);

const buildQuery = (data: unknown = null) =>
  ({
    data,
    isLoading: false,
    isFetching: false,
    isSuccess: true,
    isError: false,
    isPending: false,
    refetch: jest.fn(),
  }) as never;

const buildController = (
  overrides: Partial<ReturnType<typeof useSharedEntriesScreenController>> = {},
) =>
  ({
    invitationsQuery: buildQuery(),
    byMeQuery: buildQuery(),
    withMeQuery: buildQuery(),
    pendingInvitations: [],
    byMeEntries: [],
    withMeEntries: [],
    activeByMeEntries: [],
    outgoingInvitations: [],
    tabCounts: {
      invitations: 0,
      byMe: 0,
      withMe: 0,
    },
    summary: {
      totalEntries: 0,
      activeEntries: 0,
      pendingInvitations: 0,
    },
    selectedTab: "invitations",
    setSelectedTab: jest.fn(),
    pendingInvitationIds: new Set<string>(),
    pendingEntryIds: new Set<string>(),
    invitationForm: {
      sharedEntryId: "",
      inviteeEmail: "",
      splitValue: "50",
      shareAmount: "",
      message: "",
      expiresInHours: "168",
    },
    invitationFormError: null,
    isCreatingInvitation: false,
    lastError: null,
    setInvitationFormField: jest.fn(),
    selectInvitationEntry: jest.fn(),
    handleCreateInvitation: jest.fn().mockResolvedValue(undefined),
    handleAccept: jest.fn().mockResolvedValue(undefined),
    handleReject: jest.fn().mockResolvedValue(undefined),
    handleRevoke: jest.fn().mockResolvedValue(undefined),
    handleRevokeInvitation: jest.fn().mockResolvedValue(undefined),
    dismissError: jest.fn(),
    ...overrides,
  }) as never;

const renderWithProviders = (
  controller: ReturnType<typeof buildController>,
): ReturnType<typeof render> => {
  mockedUseController.mockReturnValue(controller);
  return render(
    <AppProviders>
      <SharedEntriesScreen />
    </AppProviders>,
  );
};

describe("SharedEntriesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("protege a tela com entitlement shared_entries", () => {
    const { getByTestId, getByText } = renderWithProviders(buildController());

    expect(getByTestId("paywall-shared_entries")).toBeTruthy();
    expect(getByText("Convites (0)")).toBeTruthy();
  });

  it("renderiza resumo mobile e contadores por tab", () => {
    const { getByTestId, getByText } = renderWithProviders(
      buildController({
        tabCounts: {
          invitations: 1,
          byMe: 1,
          withMe: 2,
        },
        summary: {
          totalEntries: 3,
          activeEntries: 2,
          pendingInvitations: 1,
        },
      }),
    );

    expect(getByTestId("shared-entries-summary-total")).toHaveTextContent("3");
    expect(getByTestId("shared-entries-summary-active")).toHaveTextContent("2");
    expect(getByTestId("shared-entries-summary-invitations")).toHaveTextContent(
      "1",
    );
    expect(getByText("Compartilhei (1)")).toBeTruthy();
    expect(getByText("Recebi (2)")).toBeTruthy();
  });

  it("aciona tabs visuais com ids estaveis", () => {
    const setSelectedTab = jest.fn();
    const { getByTestId } = renderWithProviders(
      buildController({ setSelectedTab }),
    );

    fireEvent.press(getByTestId("shared-entries-tab-byMe"));

    expect(setSelectedTab).toHaveBeenCalledWith("byMe");
  });

  it("renderiza composer e convites enviados na aba Compartilhei", () => {
    const setInvitationFormField = jest.fn();
    const handleCreateInvitation = jest.fn().mockResolvedValue(undefined);
    const handleRevokeInvitation = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, getByTestId, getByText } = renderWithProviders(
      buildController({
        selectedTab: "byMe",
        byMeQuery: buildQuery({ sharedEntries: [] }),
        invitationsQuery: buildQuery({ invitations: [] }),
        byMeEntries: [
          {
            id: "se-1",
            ownerId: "current-user",
            transactionId: "tx-1",
            status: "active",
            splitType: "equal",
            transactionTitle: "Aluguel",
            transactionAmount: 2000,
            myShare: 1000,
            otherPartyEmail: "partner@example.com",
            createdAt: "2026-04-01T00:00:00Z",
            updatedAt: "2026-04-01T00:00:00Z",
            bucket: "active",
            amountLabel: "R$ 2.000,00",
            myShareLabel: "R$ 1.000,00",
          },
        ],
        activeByMeEntries: [
          {
            id: "se-1",
            ownerId: "current-user",
            transactionId: "tx-1",
            status: "active",
            splitType: "equal",
            transactionTitle: "Aluguel",
            transactionAmount: 2000,
            myShare: 1000,
            otherPartyEmail: "partner@example.com",
            createdAt: "2026-04-01T00:00:00Z",
            updatedAt: "2026-04-01T00:00:00Z",
            bucket: "active",
            amountLabel: "R$ 2.000,00",
            myShareLabel: "R$ 1.000,00",
          },
        ],
        outgoingInvitations: [
          {
            id: "inv-out-1",
            sharedEntryId: "se-1",
            fromUserId: "current-user",
            toUserEmail: "partner@example.com",
            toUserId: null,
            splitValue: 50,
            shareAmount: null,
            message: "Aluguel",
            status: "pending",
            token: "token",
            expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
            createdAt: "2026-04-01T00:00:00Z",
            respondedAt: null,
            bucket: "pending",
            isExpired: false,
            shareLabel: "Sua parte: 50%",
          },
        ],
        invitationForm: {
          sharedEntryId: "se-1",
          inviteeEmail: "",
          splitValue: "50",
          shareAmount: "",
          message: "",
          expiresInHours: "168",
        },
        setInvitationFormField,
        handleCreateInvitation,
        handleRevokeInvitation,
      }),
    );

    fireEvent.changeText(
      getByPlaceholderText("email@exemplo.com"),
      "partner@example.com",
    );
    fireEvent.press(getByTestId("shared-invitation-create"));
    fireEvent.press(getByTestId("outgoing-invitation-inv-out-1-revoke"));

    expect(getByText("Novo convite")).toBeTruthy();
    expect(getByText("Convites enviados")).toBeTruthy();
    expect(setInvitationFormField).toHaveBeenCalledWith(
      "inviteeEmail",
      "partner@example.com",
    );
    expect(handleCreateInvitation).toHaveBeenCalledTimes(1);
    expect(handleRevokeInvitation).toHaveBeenCalledTimes(1);
  });
});
