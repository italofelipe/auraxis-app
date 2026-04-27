import { renderHook } from "@testing-library/react-native";

import { resetAppShellStore, useAppShellStore } from "@/core/shell/app-shell-store";
import { requestBiometricAuth } from "@/core/security/biometric-gate";
import { useBiometricGate } from "@/core/security/use-biometric-gate";

jest.mock("@/core/security/biometric-gate", () => ({
  requestBiometricAuth: jest.fn(),
}));

const mockedRequest = requestBiometricAuth as jest.MockedFunction<
  typeof requestBiometricAuth
>;

describe("useBiometricGate", () => {
  beforeEach(() => {
    resetAppShellStore();
    mockedRequest.mockReset();
  });

  it("pula o prompt quando lock esta desligado e nao é required", async () => {
    const { result } = renderHook(() => useBiometricGate());
    const outcome = await result.current({ promptMessage: "Auth" });
    expect(outcome).toEqual({ authorised: true, via: "skipped" });
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it("dispara o prompt quando lock esta ativo", async () => {
    useAppShellStore.getState().setBiometricLockEnabled(true);
    mockedRequest.mockResolvedValue({ outcome: "success" });
    const { result } = renderHook(() => useBiometricGate());
    const outcome = await result.current({ promptMessage: "Auth" });
    expect(outcome).toEqual({ authorised: true, via: "biometric" });
    expect(mockedRequest).toHaveBeenCalledTimes(1);
  });

  it("dispara o prompt quando required mesmo com lock desligado", async () => {
    mockedRequest.mockResolvedValue({ outcome: "success" });
    const { result } = renderHook(() => useBiometricGate());
    await result.current({ promptMessage: "Auth", required: true });
    expect(mockedRequest).toHaveBeenCalledTimes(1);
  });

  it("trata fallback_pin como autorizado", async () => {
    useAppShellStore.getState().setBiometricLockEnabled(true);
    mockedRequest.mockResolvedValue({ outcome: "fallback_pin" });
    const { result } = renderHook(() => useBiometricGate());
    const outcome = await result.current({ promptMessage: "Auth" });
    expect(outcome).toEqual({ authorised: true, via: "biometric" });
  });

  it("propaga cancelamento como nao autorizado", async () => {
    useAppShellStore.getState().setBiometricLockEnabled(true);
    mockedRequest.mockResolvedValue({ outcome: "cancelled" });
    const { result } = renderHook(() => useBiometricGate());
    const outcome = await result.current({ promptMessage: "Auth" });
    expect(outcome).toEqual({
      authorised: false,
      outcome: { outcome: "cancelled" },
    });
  });

  it("propaga unavailable como nao autorizado", async () => {
    useAppShellStore.getState().setBiometricLockEnabled(true);
    mockedRequest.mockResolvedValue({
      outcome: "unavailable",
      reason: "unavailable_no_hardware",
    });
    const { result } = renderHook(() => useBiometricGate());
    const outcome = await result.current({ promptMessage: "Auth" });
    expect(outcome.authorised).toBe(false);
  });

  it("propaga biometricsOnly para o request", async () => {
    useAppShellStore.getState().setBiometricLockEnabled(true);
    mockedRequest.mockResolvedValue({ outcome: "success" });
    const { result } = renderHook(() => useBiometricGate());
    await result.current({ promptMessage: "Auth", biometricsOnly: true });
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ biometricsOnly: true }),
    );
  });
});
