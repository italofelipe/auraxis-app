import { memo, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import type {
  DistributionChip,
  InstallmentMode,
  InstallmentPlan,
} from "@/features/credit-cards/model/installment-plan";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppPeriodChips } from "@/shared/components/app-period-chips";
import { AppReveal } from "@/shared/components/app-reveal";
import { AppToggleRow } from "@/shared/components/app-toggle-row";
import { CurrencyInputField } from "@/shared/forms/currency-input-field";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { iconSizes } from "@/shared/theme";
import { formatCurrency } from "@/shared/utils/formatters";

const MODE_OPTIONS: readonly { value: InstallmentMode; label: string }[] = [
  { value: "avista", label: "À vista" },
  { value: "parcelado", label: "Parcelado" },
];

const MIN_INSTALLMENTS = 2;
const MAX_INSTALLMENTS = 24;
const MAX_DISTRIBUTION_CHIPS = 8;

/** Props da seção de parcelamento. */
export interface InstallmentSectionProps {
  /** Modo atual ("avista" | "parcelado"). */
  readonly mode: InstallmentMode;
  /** Número de parcelas atual. */
  readonly installments: number;
  /** Se há entrada (down payment). */
  readonly hasDownPayment: boolean;
  /** Valor canônico da entrada (decimal string). */
  readonly downPaymentText: string;
  /** Plano calculado (entrada/financiado/valor por parcela). */
  readonly plan: InstallmentPlan;
  /** Distribuição nas faturas (entrada + parcelas, ou à vista). */
  readonly distribution: readonly DistributionChip[];
  readonly onChangeMode: (mode: InstallmentMode) => void;
  readonly onChangeInstallments: (value: number) => void;
  readonly onToggleDownPayment: (value: boolean) => void;
  readonly onChangeDownPayment: (value: string) => void;
}

interface StepperProps {
  readonly installments: number;
  readonly perInstallment: number;
  readonly onChange: (value: number) => void;
}

function InstallmentStepper({
  installments,
  perInstallment,
  onChange,
}: StepperProps): ReactElement {
  const step = (delta: number): void => {
    triggerHapticImpact("light");
    onChange(installments + delta);
  };
  return (
    <XStack
      alignItems="center"
      gap="$3"
      padding="$3"
      borderRadius="$2"
      borderWidth={borderWidths.hairline}
      borderColor="$borderColor"
      backgroundColor="$surfaceRaised"
    >
      <Paragraph flex={1} fontFamily="$body" fontSize="$4" fontWeight="$5" color="$color">
        Parcelas
      </Paragraph>
      <XStack
        accessibilityRole="button"
        accessibilityLabel="Menos uma parcela"
        accessibilityState={{ disabled: installments <= MIN_INSTALLMENTS }}
        testID="installment-stepper-minus"
        onPress={() => step(-1)}
        padding="$2"
        borderRadius="$1"
        backgroundColor="$surfaceCard"
        pressStyle={{ scale: 0.92 }}
        opacity={installments <= MIN_INSTALLMENTS ? 0.4 : 1}
      >
        <MaterialCommunityIcons name="chevron-left" size={iconSizes.sm} color="$color" />
      </XStack>
      <AppMoneyText fontSize="$5" fontWeight="$6" minWidth={iconSizes.xl} textAlign="center">
        {`${installments}x`}
      </AppMoneyText>
      <XStack
        accessibilityRole="button"
        accessibilityLabel="Mais uma parcela"
        accessibilityState={{ disabled: installments >= MAX_INSTALLMENTS }}
        testID="installment-stepper-plus"
        onPress={() => step(1)}
        padding="$2"
        borderRadius="$1"
        backgroundColor="$surfaceCard"
        pressStyle={{ scale: 0.92 }}
        opacity={installments >= MAX_INSTALLMENTS ? 0.4 : 1}
      >
        <MaterialCommunityIcons name="chevron-right" size={iconSizes.sm} color="$color" />
      </XStack>
      <YStack alignItems="flex-end">
        <Paragraph fontFamily="$body" fontSize="$1" color="$muted">
          {`${installments}x de`}
        </Paragraph>
        <AppMoneyText fontSize="$5" fontWeight="$6" color="$primary">
          {formatCurrency(perInstallment)}
        </AppMoneyText>
      </YStack>
    </XStack>
  );
}

function DistributionChipItem({
  chip,
  index,
}: {
  readonly chip: DistributionChip;
  readonly index: number;
}): ReactElement {
  return (
    <AppReveal index={index} testID={`distribution-chip-${chip.key}`}>
      <YStack
        minWidth={iconSizes.xl * 2.4}
        gap="$1"
        paddingVertical="$2"
        paddingHorizontal="$3"
        borderRadius="$2"
        borderWidth={borderWidths.hairline}
        borderColor={chip.isEntry ? "$primary" : "$borderColor"}
        backgroundColor={chip.isEntry ? "$primarySubtle" : "$surfaceCard"}
      >
        <XStack justifyContent="space-between" alignItems="baseline" gap="$2">
          <Paragraph
            fontFamily="$body"
            fontSize="$2"
            fontWeight="$6"
            color={chip.isEntry ? "$primary" : "$color"}
          >
            {chip.label}
          </Paragraph>
          <Paragraph fontFamily="$body" fontSize="$1" fontWeight="$5" color="$muted">
            {chip.sub}
          </Paragraph>
        </XStack>
        <AppMoneyText fontSize="$2" fontWeight="$6">
          {formatCurrency(chip.value)}
        </AppMoneyText>
      </YStack>
    </AppReveal>
  );
}

/**
 * Seção de parcelamento: segmented "À vista / Parcelado" e, quando parcelado, o
 * stepper de parcelas, o toggle "Dar uma entrada" (revela o campo de valor) e a
 * trilha de chips de distribuição nas faturas (entrada + parcelas, com stagger).
 *
 * Renderizada apenas quando o parcelamento está habilitado (flag) — o chamador
 * decide via `installmentsEnabled`.
 *
 * @param props Estado de parcelamento e handlers do controller.
 * @returns Bloco de parcelamento.
 */
const InstallmentSectionComponent = ({
  mode,
  installments,
  hasDownPayment,
  downPaymentText,
  plan,
  distribution,
  onChangeMode,
  onChangeInstallments,
  onToggleDownPayment,
  onChangeDownPayment,
}: InstallmentSectionProps): ReactElement => {
  const isParcelado = mode === "parcelado";
  return (
    <YStack gap="$3" testID="installment-section">
      <Paragraph
        fontFamily="$body"
        fontSize="$2"
        fontWeight="$6"
        color="$muted"
        textTransform="uppercase"
      >
        Parcelamento
      </Paragraph>
      <AppPeriodChips
        options={MODE_OPTIONS}
        value={mode}
        onChange={onChangeMode}
        testID="installment-mode-chips"
      />
      {isParcelado ? (
        <AppReveal testID="installment-parcelado-body">
          <YStack gap="$3">
            <InstallmentStepper
              installments={installments}
              perInstallment={plan.perInstallment}
              onChange={onChangeInstallments}
            />
            <AppToggleRow
              label="Dar uma entrada"
              description="Pague parte agora e parcele o restante"
              checked={hasDownPayment}
              testID="installment-down-payment-toggle"
              onCheckedChange={onToggleDownPayment}
            />
            {hasDownPayment ? (
              <AppReveal testID="installment-down-payment-field">
                <CurrencyInputField
                  id="expense-down-payment"
                  label="Valor da entrada"
                  value={downPaymentText}
                  onChangeAmount={onChangeDownPayment}
                />
              </AppReveal>
            ) : null}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
            >
              {distribution.slice(0, MAX_DISTRIBUTION_CHIPS).map((chip, index) => (
                <DistributionChipItem key={chip.key} chip={chip} index={index} />
              ))}
            </ScrollView>
          </YStack>
        </AppReveal>
      ) : null}
    </YStack>
  );
};

export const InstallmentSection = memo(InstallmentSectionComponent);
