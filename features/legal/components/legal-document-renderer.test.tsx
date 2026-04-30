import { fireEvent, render } from "@testing-library/react-native";
import { Linking } from "react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { LegalDocumentRenderer } from "@/features/legal/components/legal-document-renderer";
import type { LegalDocument } from "@/features/legal/content";

const buildDocument = (): LegalDocument => ({
  id: "privacy-policy",
  title: "Política de Privacidade",
  version: "1.0.0",
  effectiveDate: "07/03/2026",
  contactEmail: "suporte@auraxis.com.br",
  siblingId: "terms-of-service",
  siblingLabel: "Termos de Uso",
  sections: [
    {
      heading: "1. Objetivo",
      blocks: [
        { kind: "paragraph", text: "Texto de objetivo." },
        {
          kind: "list",
          items: [
            "primeiro item",
            ["segundo item com ", { kind: "link", label: "link", href: "https://example.com" }, "."],
          ],
        },
      ],
    },
  ],
});

describe("LegalDocumentRenderer", () => {
  it("renders header metadata + section heading + paragraph", () => {
    const document = buildDocument();
    const { getByText } = render(
      <TestProviders>
        <LegalDocumentRenderer document={document} />
      </TestProviders>,
    );
    expect(getByText("Política de Privacidade")).toBeTruthy();
    expect(getByText(/Versão 1\.0\.0/u)).toBeTruthy();
    expect(getByText("1. Objetivo")).toBeTruthy();
    expect(getByText("Texto de objetivo.")).toBeTruthy();
    expect(getByText("primeiro item")).toBeTruthy();
  });

  it("renders inline link inside list item", () => {
    const { getByText } = render(
      <TestProviders>
        <LegalDocumentRenderer document={buildDocument()} />
      </TestProviders>,
    );
    expect(getByText("link")).toBeTruthy();
  });

  it("opens contact email via Linking.openURL by default", () => {
    const openUrlSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { getAllByText } = render(
      <TestProviders>
        <LegalDocumentRenderer document={buildDocument()} />
      </TestProviders>,
    );
    const emailLinks = getAllByText("suporte@auraxis.com.br");
    fireEvent.press(emailLinks[0]!);
    expect(openUrlSpy).toHaveBeenCalledWith("mailto:suporte@auraxis.com.br");
    openUrlSpy.mockRestore();
  });

  it("invokes onOpenSibling when the sibling link is pressed", () => {
    const onOpenSibling = jest.fn();
    const { getByText } = render(
      <TestProviders>
        <LegalDocumentRenderer document={buildDocument()} onOpenSibling={onOpenSibling} />
      </TestProviders>,
    );
    fireEvent.press(getByText("Ver Termos de Uso"));
    expect(onOpenSibling).toHaveBeenCalledTimes(1);
  });

  it("does not render the sibling link when onOpenSibling is omitted", () => {
    const { queryByText } = render(
      <TestProviders>
        <LegalDocumentRenderer document={buildDocument()} />
      </TestProviders>,
    );
    expect(queryByText("Ver Termos de Uso")).toBeNull();
  });

  it("invokes onOpenContact when provided instead of opening URL", () => {
    const onOpenContact = jest.fn();
    const openUrlSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { getAllByText } = render(
      <TestProviders>
        <LegalDocumentRenderer document={buildDocument()} onOpenContact={onOpenContact} />
      </TestProviders>,
    );
    const headerEmail = getAllByText("suporte@auraxis.com.br")[0]!;
    fireEvent.press(headerEmail);
    expect(onOpenContact).toHaveBeenCalledTimes(1);
    expect(openUrlSpy).not.toHaveBeenCalled();
    openUrlSpy.mockRestore();
  });
});
