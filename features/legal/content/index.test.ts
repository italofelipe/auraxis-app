import { describe, expect, it } from "@jest/globals";

import {
  PRIVACY_POLICY_DOCUMENT,
  TERMS_OF_SERVICE_DOCUMENT,
  legalDocumentPath,
  resolveLegalDocument,
} from "./index";

describe("resolveLegalDocument", () => {
  it("returns the privacy policy document for 'privacy-policy'", () => {
    expect(resolveLegalDocument("privacy-policy")).toBe(PRIVACY_POLICY_DOCUMENT);
  });

  it("returns the terms of service document for 'terms-of-service'", () => {
    expect(resolveLegalDocument("terms-of-service")).toBe(TERMS_OF_SERVICE_DOCUMENT);
  });
});

describe("legalDocumentPath", () => {
  it("returns the canonical Expo Router path for the privacy policy", () => {
    expect(legalDocumentPath("privacy-policy")).toBe("/privacy-policy");
  });

  it("returns the canonical Expo Router path for the terms of service", () => {
    expect(legalDocumentPath("terms-of-service")).toBe("/terms-of-service");
  });
});

describe("PRIVACY_POLICY_DOCUMENT", () => {
  it("declares the expected metadata", () => {
    expect(PRIVACY_POLICY_DOCUMENT.id).toBe("privacy-policy");
    expect(PRIVACY_POLICY_DOCUMENT.title).toBe("Política de Privacidade");
    expect(PRIVACY_POLICY_DOCUMENT.siblingId).toBe("terms-of-service");
    expect(PRIVACY_POLICY_DOCUMENT.contactEmail).toMatch(/@auraxis\.com\.br$/u);
  });

  it("contains 12 sections matching the canonical web copy", () => {
    expect(PRIVACY_POLICY_DOCUMENT.sections).toHaveLength(12);
    expect(PRIVACY_POLICY_DOCUMENT.sections[0]!.heading).toBe("1. Objetivo");
    expect(PRIVACY_POLICY_DOCUMENT.sections[11]!.heading).toBe("12. Alterações desta Política");
  });

  it("every section contains at least one block", () => {
    for (const section of PRIVACY_POLICY_DOCUMENT.sections) {
      expect(section.blocks.length).toBeGreaterThan(0);
    }
  });
});

describe("TERMS_OF_SERVICE_DOCUMENT", () => {
  it("declares the expected metadata", () => {
    expect(TERMS_OF_SERVICE_DOCUMENT.id).toBe("terms-of-service");
    expect(TERMS_OF_SERVICE_DOCUMENT.title).toBe("Termos de Uso");
    expect(TERMS_OF_SERVICE_DOCUMENT.siblingId).toBe("privacy-policy");
  });

  it("contains 16 sections matching the canonical web copy (v1.1.0 with billing addendum)", () => {
    expect(TERMS_OF_SERVICE_DOCUMENT.sections).toHaveLength(16);
    expect(TERMS_OF_SERVICE_DOCUMENT.sections[0]!.heading).toBe("1. Quem pode usar");
    expect(TERMS_OF_SERVICE_DOCUMENT.sections[15]!.heading).toBe("16. Aceite");
  });

  it("includes the billing addendum sections (planos, CDC, falha de pagamento)", () => {
    const headings = TERMS_OF_SERVICE_DOCUMENT.sections.map((s) => s.heading);
    expect(headings).toContain("7. Planos e cobrança");
    expect(headings).toContain("8. Cancelamento e direito de arrependimento");
    expect(headings).toContain("9. Falha de pagamento, reembolso e disputas");
  });

  it("includes an inline link to the privacy policy in the privacy section", () => {
    const privacySection = TERMS_OF_SERVICE_DOCUMENT.sections.find((s) =>
      s.heading.includes("Privacidade e dados pessoais"),
    );
    expect(privacySection).toBeDefined();
    const list = privacySection!.blocks.find((b) => b.kind === "list");
    expect(list).toBeDefined();
    const richItem = list!.kind === "list" ? list!.items[0]! : null;
    expect(Array.isArray(richItem)).toBe(true);
    if (Array.isArray(richItem)) {
      const link = richItem.find(
        (segment) => typeof segment !== "string" && segment.kind === "link",
      );
      expect(link).toBeDefined();
    }
  });
});
