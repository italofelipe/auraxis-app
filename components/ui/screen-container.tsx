import type { PropsWithChildren } from "react";

import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { spacing } from "@/config/design-tokens";

interface ScreenContainerProps extends PropsWithChildren {
  readonly scrollable?: boolean;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(2),
    gap: spacing(2),
  },
});

export const ScreenContainer = ({
  children,
  scrollable = true,
}: ScreenContainerProps) => {
  if (!scrollable) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
};
