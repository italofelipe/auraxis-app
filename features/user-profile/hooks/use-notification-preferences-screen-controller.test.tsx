import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useUpdateNotificationPreferencesMutation } from "@/features/user-profile/hooks/use-notification-preferences-mutation";
import { useNotificationPreferencesQuery } from "@/features/user-profile/hooks/use-notification-preferences-query";
import { useNotificationPreferencesScreenController } from "@/features/user-profile/hooks/use-notification-preferences-screen-controller";
import { usePushRegistration } from "@/features/notifications/hooks/use-push-registration";

jest.mock("@/features/user-profile/hooks/use-notification-preferences-query", () => ({
  useNotificationPreferencesQuery: jest.fn(),
}));

jest.mock(
  "@/features/user-profile/hooks/use-notification-preferences-mutation",
  () => ({
    useUpdateNotificationPreferencesMutation: jest.fn(),
  }),
);

jest.mock("@/features/notifications/hooks/use-push-registration", () => ({
  usePushRegistration: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useNotificationPreferencesQuery);
const mockedUseUpdate = jest.mocked(useUpdateNotificationPreferencesMutation);
const mockedUsePushRegistration = jest.mocked(usePushRegistration);

const buildMutationStub = () => ({
  mutateAsync: jest.fn(),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

const buildPushRegistrationStub = () => ({
  status: "unregistered",
  endpoint: null,
  error: null,
  isBusy: false,
  isPushEnabled: false,
  enablePush: jest.fn(),
  disablePush: jest.fn(),
  dismissError: jest.fn(),
});

let updateStub: ReturnType<typeof buildMutationStub>;
let pushRegistrationStub: ReturnType<typeof buildPushRegistrationStub>;

const initialPrefs = [
  { category: "alerts", enabled: true, globalOptOut: false },
  { category: "weekly_snapshot", enabled: false, globalOptOut: false },
];

beforeEach(() => {
  updateStub = buildMutationStub();
  pushRegistrationStub = buildPushRegistrationStub();
  updateStub.mutateAsync.mockResolvedValue({ preferences: initialPrefs });
  mockedUseUpdate.mockReturnValue(updateStub as never);
  mockedUsePushRegistration.mockReturnValue(pushRegistrationStub as never);
  mockedUseQuery.mockReturnValue({
    data: { preferences: initialPrefs },
  } as never);
});

describe("useNotificationPreferencesScreenController", () => {
  it("hidrata preferencias quando query resolve", async () => {
    const { result } = renderHook(() =>
      useNotificationPreferencesScreenController(),
    );
    await waitFor(() => {
      expect(result.current.preferences).toEqual(initialPrefs);
    });
  });

  it("togglePreference inverte o enabled da categoria", async () => {
    const { result } = renderHook(() =>
      useNotificationPreferencesScreenController(),
    );
    await waitFor(() => expect(result.current.preferences.length).toBe(2));
    act(() => {
      result.current.togglePreference("alerts");
    });
    expect(
      result.current.preferences.find((p) => p.category === "alerts")?.enabled,
    ).toBe(false);
  });

  it("toggleGlobalOptOut inverte o globalOptOut", async () => {
    const { result } = renderHook(() =>
      useNotificationPreferencesScreenController(),
    );
    await waitFor(() => expect(result.current.preferences.length).toBe(2));
    act(() => {
      result.current.toggleGlobalOptOut("alerts");
    });
    expect(
      result.current.preferences.find((p) => p.category === "alerts")
        ?.globalOptOut,
    ).toBe(true);
  });

  it("handleSave chama mutation com preferencias atuais", async () => {
    const { result } = renderHook(() =>
      useNotificationPreferencesScreenController(),
    );
    await waitFor(() => expect(result.current.preferences.length).toBe(2));
    await act(async () => {
      await result.current.handleSave();
    });
    expect(updateStub.mutateAsync).toHaveBeenCalledWith({
      preferences: initialPrefs,
    });
  });

  it("captura submitError quando save falha", async () => {
    updateStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() =>
      useNotificationPreferencesScreenController(),
    );
    await waitFor(() => expect(result.current.preferences.length).toBe(2));
    await act(async () => {
      await result.current.handleSave();
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
  });

  it("handlePushToggle ativa registro nativo quando usuario liga push", async () => {
    const { result } = renderHook(() =>
      useNotificationPreferencesScreenController(),
    );

    await act(async () => {
      await result.current.handlePushToggle(true);
    });

    expect(pushRegistrationStub.enablePush).toHaveBeenCalledTimes(1);
    expect(pushRegistrationStub.disablePush).not.toHaveBeenCalled();
  });

  it("handlePushToggle remove registro nativo quando usuario desliga push", async () => {
    const { result } = renderHook(() =>
      useNotificationPreferencesScreenController(),
    );

    await act(async () => {
      await result.current.handlePushToggle(false);
    });

    expect(pushRegistrationStub.disablePush).toHaveBeenCalledTimes(1);
    expect(pushRegistrationStub.enablePush).not.toHaveBeenCalled();
  });
});
