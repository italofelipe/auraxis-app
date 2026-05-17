import { Linking } from "react-native";

import { act, renderHook } from "@testing-library/react-native";

import { appRoutes } from "@/core/navigation/routes";
import {
  DATA_EXPORT_REQUEST_URL,
  usePrivacyCenterScreenController,
} from "@/features/legal/hooks/use-privacy-center-screen-controller";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const canOpenUrlSpy = jest.spyOn(Linking, "canOpenURL");
const openUrlSpy = jest.spyOn(Linking, "openURL");

describe("usePrivacyCenterScreenController", () => {
  beforeEach(() => {
    mockPush.mockReset();
    canOpenUrlSpy.mockReset();
    openUrlSpy.mockReset();
    canOpenUrlSpy.mockResolvedValue(true);
    openUrlSpy.mockResolvedValue(undefined);
  });

  it("routes to legal documents, cookies information and secure deletion", () => {
    const { result } = renderHook(() => usePrivacyCenterScreenController());

    act(() => {
      result.current.handleOpenPrivacyPolicy();
      result.current.handleOpenTermsOfService();
      result.current.handleOpenCookiesInfo();
      result.current.handleOpenDeleteAccount();
    });

    expect(mockPush).toHaveBeenNthCalledWith(1, appRoutes.legal.privacyPolicy);
    expect(mockPush).toHaveBeenNthCalledWith(2, appRoutes.legal.termsOfService);
    expect(mockPush).toHaveBeenNthCalledWith(3, appRoutes.legal.privacyPolicy);
    expect(mockPush).toHaveBeenNthCalledWith(4, appRoutes.private.dangerZone);
  });

  it("opens the official LGPD support channel for data export requests", async () => {
    const { result } = renderHook(() => usePrivacyCenterScreenController());

    await act(async () => {
      await result.current.handleRequestDataExport();
    });

    expect(canOpenUrlSpy).toHaveBeenCalledWith(DATA_EXPORT_REQUEST_URL);
    expect(openUrlSpy).toHaveBeenCalledWith(DATA_EXPORT_REQUEST_URL);
    expect(result.current.exportRequestState).toBe("success");
    expect(result.current.exportRequestError).toBeNull();
  });

  it("keeps an error state when the device cannot open the export request", async () => {
    canOpenUrlSpy.mockResolvedValue(false);
    const { result } = renderHook(() => usePrivacyCenterScreenController());

    await act(async () => {
      await result.current.handleRequestDataExport();
    });

    expect(openUrlSpy).not.toHaveBeenCalled();
    expect(result.current.exportRequestState).toBe("error");
    expect(result.current.exportRequestError).toBeInstanceOf(Error);
  });

  it("dismisses export request feedback", async () => {
    const { result } = renderHook(() => usePrivacyCenterScreenController());

    await act(async () => {
      await result.current.handleRequestDataExport();
    });
    act(() => {
      result.current.dismissExportRequestFeedback();
    });

    expect(result.current.exportRequestState).toBe("idle");
    expect(result.current.exportRequestError).toBeNull();
  });
});
