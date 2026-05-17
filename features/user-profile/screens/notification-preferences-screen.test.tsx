import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { NotificationPreferencesScreen } from "@/features/user-profile/screens/notification-preferences-screen";
import { useNotificationPreferencesScreenController } from "@/features/user-profile/hooks/use-notification-preferences-screen-controller";

jest.mock(
  "@/features/user-profile/hooks/use-notification-preferences-screen-controller",
  () => ({
    useNotificationPreferencesScreenController: jest.fn(),
  }),
);

const mockedUseController = jest.mocked(useNotificationPreferencesScreenController);

const buildController = () => ({
  preferencesQuery: {
    data: {
      preferences: [
        { category: "alerts", enabled: true, globalOptOut: false },
      ],
    },
    error: null,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: jest.fn(),
  },
  preferences: [
    { category: "alerts", enabled: true, globalOptOut: false },
  ],
  isSubmitting: false,
  submitError: null,
  pushRegistration: {
    status: "unregistered",
    endpoint: null,
    error: null,
    isBusy: false,
    isPushEnabled: false,
    enablePush: jest.fn(),
    disablePush: jest.fn(),
    dismissError: jest.fn(),
  },
  togglePreference: jest.fn(),
  toggleGlobalOptOut: jest.fn(),
  handlePushToggle: jest.fn(),
  handleSave: jest.fn(),
  dismissSubmitError: jest.fn(),
});

describe("NotificationPreferencesScreen", () => {
  beforeEach(() => {
    mockedUseController.mockReturnValue(buildController() as never);
  });

  it("renderiza toggle nativo de push e encaminha alteracao ao controller", () => {
    const controller = buildController();
    mockedUseController.mockReturnValue(controller as never);

    const { getByText, getByTestId } = render(
      <AppProviders>
        <NotificationPreferencesScreen />
      </AppProviders>,
    );

    expect(getByText("Push notifications")).toBeTruthy();
    fireEvent(getByTestId("push-notifications-switch"), "onCheckedChange", true);

    expect(controller.handlePushToggle).toHaveBeenCalledWith(true);
  });
});
