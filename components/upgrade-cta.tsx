import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { colorPalette, fontSizes, radii, spacing, typography } from "@/config/design-tokens";
import { PLANS_URL } from "@/lib/web-urls";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: spacing(3),
    gap: spacing(2),
    borderRadius: radii.md,
    backgroundColor: colorPalette.neutral900,
  },
  title: {
    fontFamily: typography.headingSemiBold,
    fontSize: fontSizes.xl,
    color: colorPalette.brand500,
    textAlign: "center",
  },
  message: {
    fontFamily: typography.body,
    fontSize: fontSizes.base,
    color: colorPalette.white,
    textAlign: "center",
  },
  button: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    backgroundColor: colorPalette.brand600,
  },
  buttonLabel: {
    fontFamily: typography.bodySemiBold,
    fontSize: fontSizes.base,
    color: colorPalette.neutral950,
  },
});

export const UpgradeCTA = () => {
  const handlePress = async () => {
    await Linking.openURL(PLANS_URL);
  };

  return (
    <View style={styles.container} testID="upgrade-cta">
      <Text style={styles.title}>Recurso Premium</Text>
      <Text style={styles.message}>Assine para acessar</Text>
      <Pressable style={styles.button} onPress={handlePress} testID="upgrade-cta-button">
        <Text style={styles.buttonLabel}>Ver planos</Text>
      </Pressable>
    </View>
  );
};
