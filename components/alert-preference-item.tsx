import { StyleSheet, Switch, Text, View } from "react-native";

import { colorPalette, fontSizes, spacing, typography } from "@/config/design-tokens";
import { useUpdatePreferenceMutation } from "@/hooks/mutations/use-update-preference-mutation";
import type { AlertPreference } from "@/types/contracts";

interface AlertPreferenceItemProps {
  readonly preference: AlertPreference;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing(1),
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: fontSizes.base,
    color: colorPalette.neutral950,
    flex: 1,
  },
});

export const AlertPreferenceItem = ({ preference }: AlertPreferenceItemProps) => {
  const updatePreference = useUpdatePreferenceMutation();

  const handleToggle = (value: boolean) => {
    updatePreference.mutate({
      category: preference.category,
      payload: { enabled: value, channels: preference.channels },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{preference.category}</Text>
      <Switch
        value={preference.enabled}
        onValueChange={handleToggle}
        thumbColor={colorPalette.white}
        trackColor={{
          false: colorPalette.neutral700,
          true: colorPalette.brand600,
        }}
      />
    </View>
  );
};
