import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useAiInsightConsent } from "@/features/insights/hooks/use-ai-insight-consent";
import {
  clearAiInsightConsent,
  loadAiInsightConsent,
  persistAiInsightConsent,
} from "@/features/insights/services/ai-insight-consent-storage";
import { aiConsentService } from "@/features/insights/services/ai-consent-service";

jest.mock("@/features/insights/services/ai-insight-consent-storage", () => ({
  clearAiInsightConsent: jest.fn(),
  loadAiInsightConsent: jest.fn(),
  persistAiInsightConsent: jest.fn(),
}));
jest.mock("@/features/insights/services/ai-consent-service", () => ({
  aiConsentService: {
    load: jest.fn(),
    grant: jest.fn(),
  },
}));

const mockedClearConsent = jest.mocked(clearAiInsightConsent);
const mockedLoadConsent = jest.mocked(loadAiInsightConsent);
const mockedPersistConsent = jest.mocked(persistAiInsightConsent);
const mockedRemoteLoad = jest.mocked(aiConsentService.load);
const mockedRemoteGrant = jest.mocked(aiConsentService.grant);

describe("useAiInsightConsent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadConsent.mockResolvedValue({
      hasConsent: false,
      grantedAt: null,
    });
    mockedRemoteLoad.mockResolvedValue({
      hasConsent: false,
      grantedAt: null,
    });
    mockedRemoteGrant.mockResolvedValue({
      hasConsent: true,
      grantedAt: "2026-05-17T01:00:00.000Z",
    });
    mockedPersistConsent.mockResolvedValue({
      hasConsent: true,
      grantedAt: "2026-05-17T01:00:00.000Z",
    });
  });

  it("hidrata o consentimento salvo", async () => {
    mockedRemoteLoad.mockResolvedValueOnce({
      hasConsent: true,
      grantedAt: "2026-05-17T01:00:00.000Z",
    });

    const { result } = renderHook(() => useAiInsightConsent());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    expect(result.current.hasConsent).toBe(true);
    expect(result.current.grantedAt).toBe("2026-05-17T01:00:00.000Z");
    expect(mockedPersistConsent).toHaveBeenCalledWith("2026-05-17T01:00:00.000Z");
  });

  it("aceita consentimento na API e persiste o cache local", async () => {
    const { result } = renderHook(() => useAiInsightConsent());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    await act(async () => {
      await result.current.grantConsent();
    });

    expect(mockedRemoteGrant).toHaveBeenCalledTimes(1);
    expect(mockedPersistConsent).toHaveBeenCalledWith("2026-05-17T01:00:00.000Z");
    expect(result.current.hasConsent).toBe(true);
    expect(result.current.grantedAt).toBe("2026-05-17T01:00:00.000Z");
  });

  it("usa o cache local quando a leitura remota falha", async () => {
    mockedRemoteLoad.mockRejectedValueOnce(new Error("offline"));
    mockedLoadConsent.mockResolvedValueOnce({
      hasConsent: true,
      grantedAt: "2026-05-16T01:00:00.000Z",
    });

    const { result } = renderHook(() => useAiInsightConsent());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });
    expect(result.current.hasConsent).toBe(true);
    expect(mockedLoadConsent).toHaveBeenCalledTimes(1);
  });

  it("limpa o cache quando a API informa ausência de consentimento", async () => {
    renderHook(() => useAiInsightConsent());

    await waitFor(() => {
      expect(mockedClearConsent).toHaveBeenCalledTimes(1);
    });
  });

  it("nao hidrata storage quando o hook esta desabilitado", () => {
    const { result } = renderHook(() => useAiInsightConsent({ enabled: false }));

    expect(result.current.isHydrated).toBe(true);
    expect(result.current.hasConsent).toBe(false);
    expect(mockedLoadConsent).not.toHaveBeenCalled();
    expect(mockedRemoteLoad).not.toHaveBeenCalled();
  });
});
