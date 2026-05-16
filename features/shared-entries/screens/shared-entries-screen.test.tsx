import { render } from "@testing-library/react-native";
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

const buildQuery = () =>
  ({
    data: null,
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
    selectedTab: "invitations",
    setSelectedTab: jest.fn(),
    pendingInvitationIds: new Set<string>(),
    pendingEntryIds: new Set<string>(),
    lastError: null,
    handleAccept: jest.fn().mockResolvedValue(undefined),
    handleReject: jest.fn().mockResolvedValue(undefined),
    handleRevoke: jest.fn().mockResolvedValue(undefined),
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
    expect(getByText("Convites")).toBeTruthy();
  });
});
