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

  it("contains 13 sections matching the canonical web copy", () => {
    expect(TERMS_OF_SERVICE_DOCUMENT.sections).toHaveLength(13);
    expect(TERMS_OF_SERVICE_DOCUMENT.sections[0]!.heading).toBe("1. Quem pode usar");
    expect(TERMS_OF_SERVICE_DOCUMENT.sections[12]!.heading).toBe("13. Aceite");
  });

  it("includes an inline link to the privacy policy in section 8", () => {
    const section8 = TERMS_OF_SERVICE_DOCUMENT.sections.find((s) => s.heading.startsWith("8."));
    expect(section8).toBeDefined();
    const list = section8!.blocks.find((b) => b.kind === "list");
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
