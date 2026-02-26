import { StyleSheet, View } from "react-native";

import { colorPalette, spacing } from "@/config/design-tokens";

interface LoadingSkeletonProps {
  readonly height?: number;
}

const styles = StyleSheet.create({
  skeleton: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: colorPalette.brand300,
    opacity: 0.6,
  },
});

export const LoadingSkeleton = ({ height = spacing(3) }: LoadingSkeletonProps) => {
  return <View style={[styles.skeleton, { height }]} />;
};
