export type CheckoutProviderChannel = "hosted" | "store";

const STORE_ALIASES = new Set(["store", "app-store", "play-store", "iap"]);

export const normalizeCheckoutProviderChannel = (
  rawValue: string | null | undefined,
): CheckoutProviderChannel => {
  const normalised = rawValue?.trim().toLowerCase() ?? "";
  return STORE_ALIASES.has(normalised) ? "store" : "hosted";
};
