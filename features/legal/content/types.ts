/**
 * Structured representation of an Auraxis legal document.
 *
 * Each document is a header (title + version + contact) plus an array of
 * sections. A section is a heading and an ordered sequence of blocks —
 * either a paragraph or an ordered list. Mirrors the markup used by the
 * web's `privacy-policy.vue` and `terms-of-service.vue` so content stays
 * in sync between the two surfaces.
 */

export type LegalDocumentId = "privacy-policy" | "terms-of-service";

/** Inline link rendered inside a paragraph or list item. */
export interface LegalInlineLink {
  readonly kind: "link";
  /** Visible label rendered inside the body text. */
  readonly label: string;
  /** External href (mailto:, https://, ...) opened with `Linking`. */
  readonly href: string;
}

/** A piece of body text — plain string, or a tuple of strings + inline links. */
export type LegalRichText = string | readonly (string | LegalInlineLink)[];

export interface LegalParagraphBlock {
  readonly kind: "paragraph";
  readonly text: LegalRichText;
}

export interface LegalListBlock {
  readonly kind: "list";
  readonly items: readonly LegalRichText[];
}

export type LegalBlock = LegalParagraphBlock | LegalListBlock;

export interface LegalSection {
  readonly heading: string;
  readonly blocks: readonly LegalBlock[];
}

export interface LegalDocument {
  readonly id: LegalDocumentId;
  readonly title: string;
  readonly version: string;
  readonly effectiveDate: string;
  readonly contactEmail: string;
  readonly sections: readonly LegalSection[];
  readonly siblingId: LegalDocumentId;
  readonly siblingLabel: string;
}
