import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  borderWidths,
  colorPalette,
  fontSizes,
  radii,
  spacing,
  typography,
} from "@/config/design-tokens";
import { useDeleteAlertMutation } from "@/hooks/mutations/use-delete-alert-mutation";
import { useMarkReadMutation } from "@/hooks/mutations/use-mark-read-mutation";
import type { Alert, AlertSeverity } from "@/types/contracts";

interface AlertItemProps {
  readonly alert: Alert;
}

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: colorPalette.neutral700,
  warning: colorPalette.brand600,
  critical: colorPalette.danger500,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colorPalette.white,
    borderRadius: radii.md,
    padding: spacing(2),
    borderWidth: borderWidths.hairline,
    borderColor: colorPalette.neutral700,
    gap: spacing(1),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
  },
  severityDot: {
    width: spacing(1),
    height: spacing(1),
    borderRadius: radii.sm,
  },
  title: {
    fontFamily: typography.bodySemiBold,
    fontSize: fontSizes.base,
    color: colorPalette.neutral950,
    flex: 1,
  },
  body: {
    fontFamily: typography.body,
    fontSize: fontSizes.sm,
    color: colorPalette.neutral900,
  },
  actions: {
    flexDirection: "row",
    gap: spacing(1),
  },
  actionButton: {
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.sm,
    borderWidth: borderWidths.hairline,
    borderColor: colorPalette.brand500,
  },
  actionButtonText: {
    fontFamily: typography.body,
    fontSize: fontSizes.xs,
    color: colorPalette.neutral950,
  },
});

export const AlertItem = ({ alert }: AlertItemProps) => {
  const markRead = useMarkReadMutation();
  const deleteAlert = useDeleteAlertMutation();

  const severityColor = SEVERITY_COLORS[alert.severity];
  const isRead = alert.read_at !== null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[styles.severityDot, { backgroundColor: severityColor }]}
          testID={`severity-dot-${alert.severity}`}
        />
        <Text style={styles.title}>{alert.title}</Text>
      </View>
      <Text style={styles.body}>{alert.body}</Text>
      <View style={styles.actions}>
        {!isRead && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => markRead.mutate(alert.id)}>
            <Text style={styles.actionButtonText}>Marcar lido</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteAlert.mutate(alert.id)}>
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
