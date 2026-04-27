import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useOnboardingScreenController } from "@/features/onboarding/hooks/use-onboarding-screen-controller";
import {
  clearPersistedOnboardingState,
  loadPersistedOnboardingState,
  persistOnboardingState,
} from "@/features/onboarding/services/onboarding-storage";

jest.mock("@/features/onboarding/services/onboarding-storage", () => ({
  loadPersistedOnboardingState: jest.fn(),
  persistOnboardingState: jest.fn(),
  clearPersistedOnboardingState: jest.fn(),
}));

const mockedLoad = jest.mocked(loadPersistedOnboardingState);
const mockedPersist = jest.mocked(persistOnboardingState);
const mockedClear = jest.mocked(clearPersistedOnboardingState);

beforeEach(() => {
  jest.clearAllMocks();
  mockedLoad.mockResolvedValue({
    done: false,
    skipped: false,
    currentStep: 1,
    formData: {},
  });
  mockedPersist.mockResolvedValue();
  mockedClear.mockResolvedValue();
});

describe("useOnboardingScreenController", () => {
  it("hidrata estado inicial do storage", async () => {
    const { result } = renderHook(() => useOnboardingScreenController());
    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });
    expect(result.current.currentStep).toBe(1);
  });

  it("step1 avanca para step2 e persiste", async () => {
    const { result } = renderHook(() => useOnboardingScreenController());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(async () => {
      await result.current.handleSubmitStep1({
        monthlyIncome: 1000,
        investorProfile: "conservador",
      });
    });
    expect(result.current.currentStep).toBe(2);
    expect(mockedPersist).toHaveBeenCalled();
  });

  it("step3 marca como done", async () => {
    mockedLoad.mockResolvedValue({
      done: false,
      skipped: false,
      currentStep: 3,
      formData: {},
    });
    const { result } = renderHook(() => useOnboardingScreenController());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(async () => {
      await result.current.handleSubmitStep3({
        name: "Reserva",
        targetAmount: 1000,
        targetDate: "2026-12-31",
      });
    });
    expect(result.current.isCompleted).toBe(true);
  });

  it("handleSkip marca skipped + done", async () => {
    const { result } = renderHook(() => useOnboardingScreenController());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(async () => {
      await result.current.handleSkip();
    });
    expect(result.current.isSkipped).toBe(true);
    expect(result.current.isCompleted).toBe(true);
  });

  it("handleReset limpa storage e estado", async () => {
    const { result } = renderHook(() => useOnboardingScreenController());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(async () => {
      await result.current.handleReset();
    });
    expect(mockedClear).toHaveBeenCalled();
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isCompleted).toBe(false);
  });
});
