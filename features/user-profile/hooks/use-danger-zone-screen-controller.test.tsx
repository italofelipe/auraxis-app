import { act, renderHook } from "@testing-library/react-native";

import { useBiometricGate } from "@/core/security/use-biometric-gate";
import { useLogoutMutation } from "@/features/auth/hooks/use-auth-mutations";
import { useDeleteAccountMutation } from "@/features/user-profile/hooks/use-user-profile-mutations";
import { useDangerZoneScreenController } from "@/features/user-profile/hooks/use-danger-zone-screen-controller";

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
}));

jest.mock("@/core/security/use-biometric-gate", () => ({
  useBiometricGate: jest.fn(),
}));

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useLogoutMutation: jest.fn(),
}));

jest.mock("@/features/user-profile/hooks/use-user-profile-mutations", () => ({
  useDeleteAccountMutation: jest.fn(),
}));

const mockedUseBiometricGate = jest.mocked(useBiometricGate);
const mockedUseLogout = jest.mocked(useLogoutMutation);
const mockedUseDelete = jest.mocked(useDeleteAccountMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
});

let logoutStub: ReturnType<typeof buildMutationStub>;
let deleteStub: ReturnType<typeof buildMutationStub>;
let biometricStub: jest.Mock;

beforeEach(() => {
  mockReplace.mockClear();
  mockBack.mockClear();
  logoutStub = buildMutationStub();
  deleteStub = buildMutationStub();
  biometricStub = jest.fn().mockResolvedValue({ authorised: true, via: "biometric" });
  mockedUseLogout.mockReturnValue(logoutStub as never);
  mockedUseDelete.mockReturnValue({
    ...deleteStub,
    mutateAsync: deleteStub.mutateAsync.mockResolvedValue({ deletedAt: "2026-04-28T00:00:00Z" }),
  } as never);
  mockedUseBiometricGate.mockReturnValue(biometricStub as never);
});

describe("useDangerZoneScreenController gating", () => {
  it("blocks delete when consent toggle is off", () => {
    const { result } = renderHook(() => useDangerZoneScreenController());
    expect(result.current.canSubmit).toBe(false);
  });

  it("blocks delete when confirmation phrase mismatches (case-sensitive)", () => {
    const { result } = renderHook(() => useDangerZoneScreenController());
    act(() => {
      result.current.handleConsentChange(true);
      result.current.handleConfirmPhraseChange("excluir");
      result.current.handlePasswordChange("S3nhaForte!");
    });
    expect(result.current.canSubmit).toBe(false);
  });

  it("blocks delete when password is empty", () => {
    const { result } = renderHook(() => useDangerZoneScreenController());
    act(() => {
      result.current.handleConsentChange(true);
      result.current.handleConfirmPhraseChange("EXCLUIR");
      result.current.handlePasswordChange("");
    });
    expect(result.current.canSubmit).toBe(false);
  });

  it("enables delete only when all three conditions are met", () => {
    const { result } = renderHook(() => useDangerZoneScreenController());
    act(() => {
      result.current.handleConsentChange(true);
      result.current.handleConfirmPhraseChange("EXCLUIR");
      result.current.handlePasswordChange("S3nhaForte!");
    });
    expect(result.current.canSubmit).toBe(true);
  });
});

describe("useDangerZoneScreenController submit flow", () => {
  const arrangeReady = (
    result: { current: ReturnType<typeof useDangerZoneScreenController> },
  ): void => {
    act(() => {
      result.current.handleConsentChange(true);
      result.current.handleConfirmPhraseChange("EXCLUIR");
      result.current.handlePasswordChange("S3nhaForte!");
    });
  };

  it("does not call delete when biometric gate denies", async () => {
    biometricStub.mockResolvedValueOnce({
      authorised: false,
      outcome: { outcome: "user_cancelled" },
    });

    const { result } = renderHook(() => useDangerZoneScreenController());
    arrangeReady(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(deleteStub.mutateAsync).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.submitError).toEqual({ kind: "biometric" });
  });

  it("calls delete with the typed password and routes to login on success", async () => {
    const { result } = renderHook(() => useDangerZoneScreenController());
    arrangeReady(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(biometricStub).toHaveBeenCalledWith({
      promptMessage: expect.any(String),
      required: true,
      biometricsOnly: true,
    });
    expect(deleteStub.mutateAsync).toHaveBeenCalledWith({ password: "S3nhaForte!" });
    expect(logoutStub.mutateAsync).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/login",
      params: { reason: "account-deleted" },
    });
  });

  it("captures backend error and does not route", async () => {
    deleteStub.mutateAsync.mockRejectedValueOnce(new Error("invalid password"));

    const { result } = renderHook(() => useDangerZoneScreenController());
    arrangeReady(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.submitError).toEqual({
      kind: "backend",
      error: expect.any(Error),
    });
  });

  it("handleCancel routes back without touching mutations", () => {
    const { result } = renderHook(() => useDangerZoneScreenController());

    act(() => {
      result.current.handleCancel();
    });

    expect(mockBack).toHaveBeenCalled();
    expect(deleteStub.mutateAsync).not.toHaveBeenCalled();
  });
});
