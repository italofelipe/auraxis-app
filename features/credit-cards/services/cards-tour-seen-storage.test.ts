import * as SecureStore from "expo-secure-store";

import {
  CARDS_TOUR_SEEN_STORAGE_KEY,
  loadCardsTourSeen,
  persistCardsTourSeen,
} from "@/features/credit-cards/services/cards-tour-seen-storage";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockGetItemAsync = jest.mocked(SecureStore.getItemAsync);
const mockSetItemAsync = jest.mocked(SecureStore.setItemAsync);

describe("cards-tour-seen-storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItemAsync.mockResolvedValue(null);
  });

  it("retorna false quando nada foi persistido (primeira visita)", async () => {
    await expect(loadCardsTourSeen()).resolves.toBe(false);
    expect(mockGetItemAsync).toHaveBeenCalledWith(CARDS_TOUR_SEEN_STORAGE_KEY);
  });

  it("retorna true quando o tour já foi visto", async () => {
    mockGetItemAsync.mockResolvedValueOnce("1");
    await expect(loadCardsTourSeen()).resolves.toBe(true);
  });

  it("retorna false para qualquer valor inesperado", async () => {
    mockGetItemAsync.mockResolvedValueOnce("0");
    await expect(loadCardsTourSeen()).resolves.toBe(false);
  });

  it("retorna false (seguro) quando a leitura falha", async () => {
    mockGetItemAsync.mockRejectedValueOnce(new Error("read error"));
    await expect(loadCardsTourSeen()).resolves.toBe(false);
  });

  it("persiste a flag de visto", async () => {
    await persistCardsTourSeen();
    expect(mockSetItemAsync).toHaveBeenCalledWith(
      CARDS_TOUR_SEEN_STORAGE_KEY,
      "1",
    );
  });

  it("engole erros de escrita sem lançar", async () => {
    mockSetItemAsync.mockRejectedValueOnce(new Error("write error"));
    await expect(persistCardsTourSeen()).resolves.toBeUndefined();
  });
});
