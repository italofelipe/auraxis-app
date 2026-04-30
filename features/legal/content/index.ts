import { PRIVACY_POLICY_DOCUMENT } from "./privacy-policy";
import { TERMS_OF_SERVICE_DOCUMENT } from "./terms-of-service";
import type { LegalDocument, LegalDocumentId } from "./types";

const DOCUMENTS: Readonly<Record<LegalDocumentId, LegalDocument>> = {
  "privacy-policy": PRIVACY_POLICY_DOCUMENT,
  "terms-of-service": TERMS_OF_SERVICE_DOCUMENT,
};

/**
 * Returns the canonical legal document for the given id.
 * @param id Document identifier.
 * @returns The structured document (header + sections).
 */
export const resolveLegalDocument = (id: LegalDocumentId): LegalDocument =>
  DOCUMENTS[id];

/**
 * Returns the in-app navigation path for a legal document.
 * @param id Document identifier.
 * @returns Expo Router path including the (legal) group prefix.
 */
export const legalDocumentPath = (id: LegalDocumentId): string => `/${id}`;

export type {
  LegalBlock,
  LegalDocument,
  LegalDocumentId,
  LegalInlineLink,
  LegalListBlock,
  LegalParagraphBlock,
  LegalRichText,
  LegalSection,
} from "./types";
export { PRIVACY_POLICY_DOCUMENT } from "./privacy-policy";
export { TERMS_OF_SERVICE_DOCUMENT } from "./terms-of-service";
