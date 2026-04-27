import { useCallback, type ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import { type AppLocale, useAppShellStore } from "@/core/shell/app-shell-store";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { switchLocale, useT } from "@/shared/i18n";

const OPTIONS: readonly { readonly value: AppLocale; readonly key: string }[] = [
  { value: "pt", key: "common.language.pt" },
  { value: "en", key: "common.language.en" },
] as const;

interface LanguageOptionProps {
  readonly option: AppLocale;
  readonly label: string;
  readonly isActive: boolean;
  readonly onSelect: (option: AppLocale) => void;
}

const LanguageOption = ({
  option,
  label,
  isActive,
  onSelect,
}: LanguageOptionProps): ReactElement => {
  const handlePress = useCallback(() => onSelect(option), [onSelect, option]);
  return (
    <AppButton
      flex={1}
      tone={isActive ? "primary" : "secondary"}
      onPress={handlePress}
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ selected: isActive }}
    >
      {label}
    </AppButton>
  );
};

/**
 * Profile section that switches the active locale. Persists the choice
 * in `AppShellStore` and tells i18next to swap the active language so
 * the rest of the app re-renders with the new strings on the next tick.
 */
export function LanguageSection(): ReactElement {
  const { t } = useT();
  const locale = useAppShellStore((state) => state.locale);
  const setLocale = useAppShellStore((state) => state.setLocale);

  const handleSelect = useCallback(
    (next: AppLocale) => {
      void switchLocale(next).then((resolved) => {
        setLocale(resolved);
      });
    },
    [setLocale],
  );

  return (
    <AppSurfaceCard
      title={t("common.language.title")}
      description={t("common.language.description")}
    >
      <YStack gap="$3" accessibilityRole="radiogroup">
        <XStack gap="$2" flexWrap="wrap">
          {OPTIONS.map((option) => (
            <LanguageOption
              key={option.value}
              option={option.value}
              label={t(option.key)}
              isActive={locale === option.value}
              onSelect={handleSelect}
            />
          ))}
        </XStack>
      </YStack>
    </AppSurfaceCard>
  );
}
