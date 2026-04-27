import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useUpdateNotificationPreferencesMutation } from "@/features/user-profile/hooks/use-notification-preferences-mutation";
import { useNotificationPreferencesQuery } from "@/features/user-profile/hooks/use-notification-preferences-query";
import { useNotificationPreferencesScreenController } from "@/features/user-profile/hooks/use-notification-preferences-screen-controller";

jest.mock("@/features/user-profile/hooks/use-notification-preferences-query", () => ({
  useNotificationPreferencesQuery: jest.fn(),
}));

jest.mock(
  "@/features/user-profile/hooks/use-notification-preferences-mutation",
  () => ({
    useUpdateNotificationPreferencesMutation: jest.fn(),
  }),
);

const mockedUseQuery = jest.mocked(useNotificationPreferencesQuery);
const mockedUseUpdate = jest.mocked(useUpdateNotificationPreferencesMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn(),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

let updateStub: ReturnType<typeof buildMutationStub>;

const initialPrefs = [
  { category: "alerts", enabled: true, globalOptOut: false },
  { category: "weekly_snapshot", enabled: false, globalOptOut: false },
];

beforeEach(() => {
  updateStub = buildMutationStub();
  updateStub.mutateAsync.mockResolvedValue({ preferences: initialPrefs });
  mockedUseUpdate.mockReturnValue(updateStub as never);
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
});
