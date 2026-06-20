import { forwardRef, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, useTheme } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import { AmountField } from "@/features/credit-cards/components/expense-sheet/amount-field";
import { CardChips } from "@/features/credit-cards/components/expense-sheet/card-chips";
import { ClassificationSection } from "@/features/credit-cards/components/expense-sheet/classification-section";
import { FaturaPreview } from "@/features/credit-cards/components/expense-sheet/fatura-preview";
import { InstallmentSection } from "@/features/credit-cards/components/expense-sheet/installment-section";
import type { ExpenseFormController } from "@/features/credit-cards/hooks/use-expense-form";
import { AppButton } from "@/shared/components/app-button";
import { AppHeading } from "@/shared/components/app-heading";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppText } from "@/shared/components/app-text";
import { iconSizes } from "@/shared/theme";

// Snap point ~90% da altura — sheet quase cheio, como no handoff.
const SNAP_POINTS: string[] = ["90%"];
// Geometria do drag handle (números OK por governança — geometria SVG-like).
const HANDLE_WIDTH = 42;
const HANDLE_HEIGHT = 5;

/** Props do bottom sheet de lançar despesa. */
export interface ExpenseSheetProps {
  /** Controller já instanciado (`useExpenseForm`) — fonte de estado/handlers. */
  readonly controller: ExpenseFormController;
  /** Fecha o sheet (dispara o `dismiss` do modal via host). */
  readonly onClose: () => void;
  /** Confirma o lançamento — o host trata o submit + reset. */
  readonly onSubmit: () => void;
}

interface SheetHeaderProps {
  readonly onClose: () => void;
}

function SheetHeader({ onClose }: SheetHeaderProps): ReactElement {
  return (
    <XStack
      paddingHorizontal="$5"
      paddingBottom="$3"
      alignItems="center"
      justifyContent="space-between"
    >
      <YStack>
        <AppHeading level={2}>Lançar despesa</AppHeading>
        <AppText size="bodySm" tone="muted">
          Compra, fatura e impacto
        </AppText>
      </YStack>
      <XStack
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        testID="expense-sheet-close"
        onPress={onClose}
        padding="$2"
        borderRadius="$2"
        backgroundColor="$surfaceRaised"
        pressStyle={{ scale: 0.92 }}
      >
        <MaterialCommunityIcons name="close" size={iconSizes.md} color="$color" />
      </XStack>
    </XStack>
  );
}

interface SheetFooterProps {
  readonly controller: ExpenseFormController;
  readonly onSubmit: () => void;
}

function SheetFooter({ controller, onSubmit }: SheetFooterProps): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <YStack
      paddingHorizontal="$5"
      paddingTop="$3"
      paddingBottom={Math.max(insets.bottom, 16)}
      gap="$2"
      borderTopWidth={borderWidths.hairline}
      borderTopColor="$borderColor"
      backgroundColor="$surfaceCard"
    >
      <AppText size="caption" tone="muted" textAlign="center">
        {controller.creditCardId
          ? "Lançar no cartão selecionado"
          : "O cartão pode ser escolhido depois"}
      </AppText>
      <AppButton
        fullWidth
        glow
        disabled={!controller.canSubmit || controller.isSubmitting}
        accessibilityLabel="Lançar despesa"
        testID="expense-sheet-submit"
        onPress={onSubmit}
      >
        {controller.isSubmitting ? "Lançando…" : "Lançar despesa"}
      </AppButton>
    </YStack>
  );
}

function renderBackdrop(props: BottomSheetBackdropProps): ReactElement {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
    />
  );
}

interface SheetBodyProps {
  readonly controller: ExpenseFormController;
}

/** Conteúdo rolável do sheet (todas as seções do formulário). */
function SheetBody({ controller }: SheetBodyProps): ReactElement {
  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <AmountField
        value={controller.amountText}
        onChangeAmount={controller.setAmountText}
        testID="expense-amount-field"
      />
      <CardChips
        cards={controller.cards}
        selectedCardId={controller.creditCardId}
        onSelectCard={controller.selectCard}
        testID="expense-card-chips"
      />
      <YStack gap="$3">
        <AppInputField
          id="expense-title"
          label="Título"
          placeholder="Ex: Mercado do mês"
          value={controller.title}
          onChangeText={controller.setTitle}
        />
        <AppInputField
          id="expense-purchase-date"
          label="Data da compra"
          placeholder="AAAA-MM-DD"
          autoCapitalize="none"
          value={controller.purchaseDate}
          onChangeText={controller.setPurchaseDate}
        />
      </YStack>
      {controller.installmentsEnabled ? (
        <InstallmentSection
          mode={controller.mode}
          installments={controller.installments}
          hasDownPayment={controller.hasDownPayment}
          downPaymentText={controller.downPaymentText}
          plan={controller.plan}
          distribution={controller.distribution}
          onChangeMode={controller.setMode}
          onChangeInstallments={controller.setInstallments}
          onToggleDownPayment={controller.toggleDownPayment}
          onChangeDownPayment={controller.setDownPaymentText}
        />
      ) : null}
      <ClassificationSection
        tags={controller.tags}
        tagId={controller.tagId}
        accounts={controller.accounts}
        accountId={controller.accountId}
        status={controller.status}
        onSelectTag={controller.selectTag}
        onSelectAccount={controller.selectAccount}
        onChangeStatus={controller.setStatus}
      />
      <FaturaPreview preview={controller.faturaPreview} amount={controller.amount} />
    </BottomSheetScrollView>
  );
}

/**
 * Bottom sheet "Lançar despesa" (apresentacional): orquestra as seções
 * (valor, cartão, título/data, parcelamento, classificação e prévia) dentro de
 * um `BottomSheetModal` com scroll e rodapé fixo (CTA). Todo o estado vem do
 * `controller` recebido por prop — o host (`ExpenseSheetHost`) instancia o
 * `useExpenseForm`, controla o ref e trata o submit.
 *
 * A seção de parcelamento só aparece quando `controller.installmentsEnabled`.
 *
 * @param props Controller, `onClose` e `onSubmit`.
 * @returns Modal de bottom sheet com o formulário de despesa.
 */
export const ExpenseSheet = forwardRef<BottomSheetModal, ExpenseSheetProps>(
  function ExpenseSheet({ controller, onClose, onSubmit }, ref): ReactElement {
    const theme = useTheme();
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.surfaceCard?.val }}
        handleIndicatorStyle={{
          backgroundColor: theme.borderColor?.val,
          width: HANDLE_WIDTH,
          height: HANDLE_HEIGHT,
        }}
        onDismiss={onClose}
      >
        <YStack flex={1} testID="expense-sheet">
          <SheetHeader onClose={onClose} />
          <SheetBody controller={controller} />
          <SheetFooter controller={controller} onSubmit={onSubmit} />
        </YStack>
      </BottomSheetModal>
    );
  },
);
