import type { ReactElement } from "react";

import { Linking } from "react-native";
import { Paragraph, Text, XStack, YStack } from "tamagui";

import type {
  LegalBlock,
  LegalDocument,
  LegalInlineLink,
  LegalListBlock,
  LegalParagraphBlock,
  LegalRichText,
} from "@/features/legal/content";

const isInlineLink = (
  segment: string | LegalInlineLink,
): segment is LegalInlineLink =>
  typeof segment !== "string" && segment.kind === "link";

const handleLinkPress = (href: string): void => {
  void Linking.openURL(href);
};

interface InlineRichTextProps {
  readonly text: LegalRichText;
}

function InlineRichText({ text }: InlineRichTextProps): ReactElement {
  if (typeof text === "string") {
    return <Text>{text}</Text>;
  }
  return (
    <Text>
      {text.map((segment, index) =>
        isInlineLink(segment) ? (
          <Text
            key={index}
            color="$primary"
            textDecorationLine="underline"
            onPress={() => handleLinkPress(segment.href)}
          >
            {segment.label}
          </Text>
        ) : (
          <Text key={index}>{segment}</Text>
        ),
      )}
    </Text>
  );
}

interface LegalListProps {
  readonly block: LegalListBlock;
}

function LegalList({ block }: LegalListProps): ReactElement {
  return (
    <YStack gap="$2" paddingLeft="$3">
      {block.items.map((item, index) => (
        <XStack key={index} gap="$2" alignItems="flex-start">
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3" minWidth={20}>
            {index + 1}.
          </Paragraph>
          <Paragraph color="$color" fontFamily="$body" fontSize="$3" flex={1}>
            <InlineRichText text={item} />
          </Paragraph>
        </XStack>
      ))}
    </YStack>
  );
}

interface LegalParagraphProps {
  readonly block: LegalParagraphBlock;
}

function LegalParagraph({ block }: LegalParagraphProps): ReactElement {
  return (
    <Paragraph color="$color" fontFamily="$body" fontSize="$3">
      <InlineRichText text={block.text} />
    </Paragraph>
  );
}

interface LegalBlockRendererProps {
  readonly block: LegalBlock;
}

function LegalBlockRenderer({ block }: LegalBlockRendererProps): ReactElement {
  return block.kind === "list" ? (
    <LegalList block={block} />
  ) : (
    <LegalParagraph block={block} />
  );
}

interface LegalDocumentRendererProps {
  readonly document: LegalDocument;
  readonly onOpenSibling?: () => void;
  readonly onOpenContact?: () => void;
}

/**
 * Renders a structured Auraxis legal document — header, numbered sections
 * and footer with sibling document link. Inline links are tappable and
 * fire `Linking.openURL` (mailto and external https). Pure presentational
 * component: callers wire navigation callbacks for the sibling/contact
 * actions.
 *
 * @param props Document data + optional navigation callbacks.
 * @returns The rendered document tree.
 */
export function LegalDocumentRenderer(
  props: LegalDocumentRendererProps,
): ReactElement {
  const { document, onOpenSibling, onOpenContact } = props;
  const contactHref = `mailto:${document.contactEmail}`;
  return (
    <YStack gap="$5">
      <YStack gap="$1" borderBottomWidth={1} borderBottomColor="$borderColor" paddingBottom="$3">
        <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
          {document.title}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Versão {document.version} · Vigência: {document.effectiveDate}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Contato:{" "}
          <Text
            color="$primary"
            textDecorationLine="underline"
            onPress={() => {
              if (onOpenContact !== undefined) {
                onOpenContact();
                return;
              }
              handleLinkPress(contactHref);
            }}
          >
            {document.contactEmail}
          </Text>
        </Paragraph>
      </YStack>
      {document.sections.map((section) => (
        <YStack key={section.heading} gap="$2">
          <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
            {section.heading}
          </Paragraph>
          {section.blocks.map((block, index) => (
            <LegalBlockRenderer key={index} block={block} />
          ))}
        </YStack>
      ))}
      <YStack gap="$1" borderTopWidth={1} borderTopColor="$borderColor" paddingTop="$3">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Dúvidas? Entre em contato:{" "}
          <Text
            color="$primary"
            textDecorationLine="underline"
            onPress={() => handleLinkPress(contactHref)}
          >
            {document.contactEmail}
          </Text>
        </Paragraph>
        {onOpenSibling !== undefined ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            <Text
              color="$primary"
              textDecorationLine="underline"
              onPress={onOpenSibling}
            >
              Ver {document.siblingLabel}
            </Text>
          </Paragraph>
        ) : null}
      </YStack>
    </YStack>
  );
}
