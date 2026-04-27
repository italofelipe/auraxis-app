import { useCallback, useMemo, useState, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Pressable } from "react-native";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { useCreateTransactionMutation } from "@/features/transactions/hooks/use-transaction-mutations";
import { createTransactionSchema } from "@/features/transactions/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { useT } from "@/shared/i18n";

const quickAddSchema = createTransactionSchema.pick({
  title: true,
  amount: true,
  type: true,
  dueDate: true,
});

type QuickAddValues = z.infer<typeof quickAddSchema>;

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const buildDefaults = (): QuickAddValues => ({
  title: "",
  amount: "",
  type: "expense",
  dueDate: todayIso(),
});

/**
 * Floating action button that opens a 4-field bottom sheet to create a
 * transaction without leaving the dashboard. Wires into the canonical
 * `useCreateTransactionMutation` so cache invalidation and haptic
 * feedback come for free.
 */
export function DashboardQuickAddFab(): ReactElement {
  const { t } = useT();
  const theme = useTheme();
  const [open, setOpen] = useState<boolean>(false);
  const createMutation = useCreateTransactionMutation();

  const form = useForm<QuickAddValues>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: buildDefaults(),
  });

  const handleOpen = useCallback((): void => {
    triggerHapticImpact("medium");
    form.reset(buildDefaults());
    createMutation.reset();
    setOpen(true);
  }, [createMutation, form]);

  const handleClose = useCallback((): void => {
    setOpen(false);
  }, []);

  const handleSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      title: values.title,
      amount: values.amount,
      type: values.type,
      dueDate: values.dueDate,
    });
    setOpen(false);
  });

  return (
    <>
      <Pressable
        onPress={handleOpen}
        accessibilityLabel={t("dashboard.quickAdd.fabLabel")}
        accessibilityRole="button"
        style={({ pressed }) => ({
          position: "absolute",
          right: 24,
          bottom: 32,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor:
            theme.primary?.val ?? theme.brandPrimary?.val ?? "#ff8a3d",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.32,
          shadowRadius: 8,
          elevation: 6,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
        testID="dashboard-quick-add-fab"
      >
        <MaterialCommunityIcons name="plus" size={28} color="#ffffff" />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <QuickAddSheet
          onClose={handleClose}
          onSubmit={() => {
            void handleSubmit();
          }}
          form={form}
          isSubmitting={createMutation.isPending}
          submitError={createMutation.error}
          dismissError={createMutation.reset}
          translate={t}
        />
      </Modal>
    </>
  );
}

interface QuickAddSheetProps {
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly form: ReturnType<typeof useForm<QuickAddValues>>;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly dismissError: () => void;
  readonly translate: (key: string) => string;
}

// eslint-disable-next-line max-lines-per-function
function QuickAddSheet({
  onClose,
  onSubmit,
  form,
  isSubmitting,
  submitError,
  dismissError,
  translate,
}: QuickAddSheetProps): ReactElement {
  const errors = form.formState.errors;
  const typeOptions = useMemo(
    () =>
      [
        { value: "expense" as const, label: translate("dashboard.quickAdd.types.expense") },
        { value: "income" as const, label: translate("dashboard.quickAdd.types.income") },
      ],
    [translate],
  );

  return (
    <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" justifyContent="flex-end">
      <YStack
        backgroundColor="$background"
        padding="$4"
        gap="$4"
        borderTopLeftRadius="$3"
        borderTopRightRadius="$3"
      >
        <AppSurfaceCard
          title={translate("dashboard.quickAdd.title")}
          description={translate("dashboard.quickAdd.description")}
        >
          <YStack gap="$3">
            <Controller
              control={form.control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInputField
                  id="quick-title"
                  label={translate("dashboard.quickAdd.fields.title")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  errorText={errors.title?.message}
                  autoFocus
                />
              )}
            />
            <Controller
              control={form.control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInputField
                  id="quick-amount"
                  label={translate("dashboard.quickAdd.fields.amount")}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  errorText={errors.amount?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="type"
              render={({ field: { onChange, value } }) => (
                <YStack gap="$2">
                  <Paragraph color="$color" fontFamily="$body" fontSize="$3">
                    {translate("dashboard.quickAdd.fields.type")}
                  </Paragraph>
                  <XStack gap="$2">
                    {typeOptions.map((option) => (
                      <AppButton
                        key={option.value}
                        flex={1}
                        tone={value === option.value ? "primary" : "secondary"}
                        onPress={() => onChange(option.value)}
                      >
                        {option.label}
                      </AppButton>
                    ))}
                  </XStack>
                </YStack>
              )}
            />
            <Controller
              control={form.control}
              name="dueDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInputField
                  id="quick-date"
                  label={translate("dashboard.quickAdd.fields.dueDate")}
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  errorText={errors.dueDate?.message}
                />
              )}
            />
            {submitError ? (
              <AppErrorNotice
                error={submitError}
                fallbackTitle="Nao foi possivel criar"
                fallbackDescription="Confira os dados e tente novamente."
                secondaryActionLabel="Fechar"
                onSecondaryAction={dismissError}
              />
            ) : null}
            <XStack gap="$2">
              <AppButton flex={1} tone="secondary" onPress={onClose}>
                {translate("dashboard.quickAdd.cancel")}
              </AppButton>
              <AppButton flex={1} onPress={onSubmit} disabled={isSubmitting}>
                {isSubmitting
                  ? translate("dashboard.quickAdd.submitting")
                  : translate("dashboard.quickAdd.submit")}
              </AppButton>
            </XStack>
          </YStack>
        </AppSurfaceCard>
      </YStack>
    </YStack>
  );
}
