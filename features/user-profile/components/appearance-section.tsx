import { useCallback, type ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import {
  type ThemePreference,
  useAppShellStore,
} from "@/core/shell/app-shell-store";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";

const OPTIONS: readonly { readonly value: ThemePreference; readonly key: string }[] = [
  { value: "system", key: "common.appearance.system" },
  { value: "light", key: "common.appearance.light" },
  { value: "dark", key: "common.appearance.dark" },
] as const;

interface AppearanceOptionProps {
  readonly option: ThemePreference;
  readonly label: string;
  readonly isActive: boolean;
  readonly onSelect: (option: ThemePreference) => void;
}

const AppearanceOption = ({
  option,
  label,
  isActive,
  onSelect,
}: AppearanceOptionProps): ReactElement => {
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
 * Profile section that lets the user pick a colour scheme preference.
 * Persists in `AppShellStore` so {@link useResolvedTheme} reacts on
 * the next render across the app.
 */
export function AppearanceSection(): ReactElement {
  const { t } = useT();
  const themePreference = useAppShellStore((state) => state.themePreference);
  const setThemePreference = useAppShellStore(
    (state) => state.setThemePreference,
  );

  return (
    <AppSurfaceCard
      title={t("common.appearance.title")}
      description={t("common.appearance.description")}
    >
      <YStack gap="$3" accessibilityRole="radiogroup">
        <XStack gap="$2" flexWrap="wrap">
          {OPTIONS.map((option) => (
            <AppearanceOption
              key={option.value}
              option={option.value}
              label={t(option.key)}
              isActive={themePreference === option.value}
              onSelect={setThemePreference}
            />
          ))}
        </XStack>
      </YStack>
    </AppSurfaceCard>
  );
}

interface AppearanceLabelArg {
  readonly label: string;
  readonly description: string;
}

export type { AppearanceLabelArg };

/**
 * Internal helper exposed for tests — verifies the option list is in
 * sync with the i18n catalogue.
 */
export const __APPEARANCE_OPTION_KEYS_FOR_TESTS = OPTIONS.map((o) => o.key);
