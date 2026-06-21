import { memo, type ReactElement } from "react";

import { ScrollView } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import type { Account } from "@/features/accounts/contracts";
import type { Tag } from "@/features/tags/contracts";
import type { TransactionStatus } from "@/features/transactions/contracts";
import { AppPeriodChips } from "@/shared/components/app-period-chips";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { onDarkSurfaceColors, resolveCategoryColor } from "@/shared/theme";

const STATUS_OPTIONS: readonly { value: TransactionStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
];

// Geometria do marcador de cor da categoria (quadradinho), números OK.
const CATEGORY_DOT_SIZE = 8;

/** Props da seção de classificação (categoria + status + conta). */
export interface ClassificationSectionProps {
  /** Categorias disponíveis (tags). */
  readonly tags: readonly Tag[];
  /** Tag selecionada, ou `null`. */
  readonly tagId: string | null;
  /** Contas disponíveis (vazio = oculta a linha de conta). */
  readonly accounts: readonly Account[];
  /** Conta selecionada, ou `null`. */
  readonly accountId: string | null;
  /** Status inicial da transação. */
  readonly status: TransactionStatus;
  readonly onSelectTag: (tagId: string | null) => void;
  readonly onSelectAccount: (accountId: string | null) => void;
  readonly onChangeStatus: (status: TransactionStatus) => void;
}

interface CategoryChipProps {
  readonly tag: Tag;
  readonly selected: boolean;
  readonly onPress: () => void;
}

function CategoryChip({ tag, selected, onPress }: CategoryChipProps): ReactElement {
  const color = resolveCategoryColor({ id: tag.id, color: tag.color });
  return (
    <XStack
      accessibilityRole="button"
      accessibilityLabel={tag.name}
      accessibilityState={{ selected }}
      testID={`expense-category-chip-${tag.id}`}
      onPress={onPress}
      alignItems="center"
      gap="$2"
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderRadius="$5"
      borderWidth={borderWidths.hairline}
      borderColor={selected ? color : "$borderColor"}
      backgroundColor={selected ? color : "$surfaceCard"}
      pressStyle={{ scale: 0.97 }}
    >
      <YStack
        width={CATEGORY_DOT_SIZE}
        height={CATEGORY_DOT_SIZE}
        borderRadius="$0"
        backgroundColor={selected ? onDarkSurfaceColors.text : color}
      />
      <Paragraph
        fontFamily="$body"
        fontSize="$3"
        fontWeight="$6"
        color={selected ? onDarkSurfaceColors.text : "$color"}
      >
        {tag.name}
      </Paragraph>
    </XStack>
  );
}

interface AccountChipProps {
  readonly account: Account;
  readonly selected: boolean;
  readonly onPress: () => void;
}

function AccountChip({ account, selected, onPress }: AccountChipProps): ReactElement {
  return (
    <XStack
      accessibilityRole="button"
      accessibilityLabel={`Conta ${account.name}`}
      accessibilityState={{ selected }}
      testID={`expense-account-chip-${account.id}`}
      onPress={onPress}
      alignItems="center"
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderRadius="$5"
      borderWidth={borderWidths.hairline}
      borderColor={selected ? "$primary" : "$borderColor"}
      backgroundColor={selected ? "$primarySubtle" : "$surfaceCard"}
      pressStyle={{ scale: 0.97 }}
    >
      <Paragraph
        fontFamily="$body"
        fontSize="$3"
        fontWeight="$6"
        color={selected ? "$primary" : "$color"}
      >
        {account.name}
      </Paragraph>
    </XStack>
  );
}

function SectionLabel({ children }: { readonly children: string }): ReactElement {
  return (
    <Paragraph
      fontFamily="$body"
      fontSize="$2"
      fontWeight="$6"
      color="$muted"
      textTransform="uppercase"
    >
      {children}
    </Paragraph>
  );
}

/**
 * Seção "Classificação": trilha de chips de categoria (tags, com a cor própria
 * da tag), segmented de status (Pendente / Pago) e, quando há contas, uma
 * trilha de chips de conta. Todas as seleções são toggle (tocar de novo
 * limpa) e nenhuma é obrigatória.
 *
 * @param props Tags, contas, seleção atual, status e handlers do controller.
 * @returns Bloco de classificação.
 */
const ClassificationSectionComponent = ({
  tags,
  tagId,
  accounts,
  accountId,
  status,
  onSelectTag,
  onSelectAccount,
  onChangeStatus,
}: ClassificationSectionProps): ReactElement => {
  return (
    <YStack gap="$3" testID="classification-section">
      <SectionLabel>Classificação</SectionLabel>
      {tags.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
        >
          {tags.map((tag) => (
            <CategoryChip
              key={tag.id}
              tag={tag}
              selected={tag.id === tagId}
              onPress={() => {
                triggerHapticImpact("light");
                onSelectTag(tag.id === tagId ? null : tag.id);
              }}
            />
          ))}
        </ScrollView>
      ) : null}
      <AppPeriodChips
        options={STATUS_OPTIONS}
        value={status}
        onChange={onChangeStatus}
        testID="expense-status-chips"
      />
      {accounts.length > 0 ? (
        <YStack gap="$2">
          <SectionLabel>Conta</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
          >
            {accounts.map((account) => (
              <AccountChip
                key={account.id}
                account={account}
                selected={account.id === accountId}
                onPress={() => {
                  triggerHapticImpact("light");
                  onSelectAccount(account.id === accountId ? null : account.id);
                }}
              />
            ))}
          </ScrollView>
        </YStack>
      ) : null}
    </YStack>
  );
};

export const ClassificationSection = memo(ClassificationSectionComponent);
