import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useAiInsightConsent } from "@/features/insights/hooks/use-ai-insight-consent";
import {
  loadAiInsightConsent,
  persistAiInsightConsent,
} from "@/features/insights/services/ai-insight-consent-storage";

jest.mock("@/features/insights/services/ai-insight-consent-storage", () => ({
  loadAiInsightConsent: jest.fn(),
  persistAiInsightConsent: jest.fn(),
}));

const mockedLoadConsent = jest.mocked(loadAiInsightConsent);
const mockedPersistConsent = jest.mocked(persistAiInsightConsent);

describe("useAiInsightConsent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadConsent.mockResolvedValue({
      hasConsent: false,
      grantedAt: null,
    });
    mockedPersistConsent.mockResolvedValue({
      hasConsent: true,
      grantedAt: "2026-05-17T01:00:00.000Z",
    });
  });

  it("hidrata o consentimento salvo", async () => {
    mockedLoadConsent.mockResolvedValueOnce({
      hasConsent: true,
      grantedAt: "2026-05-17T01:00:00.000Z",
    });

    const { result } = renderHook(() => useAiInsightConsent());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    expect(result.current.hasConsent).toBe(true);
    expect(result.current.grantedAt).toBe("2026-05-17T01:00:00.000Z");
  });

  it("aceita consentimento e persiste o estado local", async () => {
    const { result } = renderHook(() => useAiInsightConsent());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    await act(async () => {
      await result.current.grantConsent();
    });

    expect(mockedPersistConsent).toHaveBeenCalledTimes(1);
    expect(result.current.hasConsent).toBe(true);
    expect(result.current.grantedAt).toBe("2026-05-17T01:00:00.000Z");
  });

  it("nao hidrata storage quando o hook esta desabilitado", () => {
    const { result } = renderHook(() => useAiInsightConsent({ enabled: false }));

    expect(result.current.isHydrated).toBe(true);
    expect(result.current.hasConsent).toBe(false);
    expect(mockedLoadConsent).not.toHaveBeenCalled();
  });
});
