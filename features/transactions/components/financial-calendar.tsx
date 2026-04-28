import { useCallback, useMemo, useState, type ReactElement } from "react";

import { Calendar, LocaleConfig } from "react-native-calendars";
import { Modal } from "react-native";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";

import {
  buildCalendarMarkers,
  transactionsForDay,
  type CalendarMarker,
  type CalendarTheme,
} from "@/features/transactions/services/calendar-markers";
import type { TransactionViewModel } from "@/features/transactions/hooks/use-transactions-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";
import { formatShortDate } from "@/shared/utils/formatters";

LocaleConfig.locales["pt-br"] = {
  monthNames: [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ],
  monthNamesShort: [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ],
  dayNames: [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
    "Quinta-feira", "Sexta-feira", "Sábado",
  ],
  dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
};
LocaleConfig.defaultLocale = "pt-br";

const STATUS_TONE: Record<string, "default" | "primary" | "danger"> = {
  paid: "primary",
  pending: "default",
  overdue: "danger",
  cancelled: "default",
  postponed: "default",
};

export interface FinancialCalendarProps {
  readonly transactions: readonly TransactionViewModel[];
}

/**
 * Month-view financial calendar with multi-dot markers per day. Tap a
 * day to inspect its transactions in a bottom sheet. Built on top of
 * `react-native-calendars` with the Auraxis colour palette pushed in
 * via `theme`.
 */
// eslint-disable-next-line complexity
export function FinancialCalendar({
  transactions,
}: FinancialCalendarProps): ReactElement {
  const { t } = useT();
  const tamagui = useTheme();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const markerTheme = useMemo<CalendarTheme>(() => {
    return {
      income: tamagui.success?.val ?? "#1f9d55",
      expense: tamagui.danger?.val ?? "#c53030",
      planned: tamagui.muted?.val ?? "#8a8a8a",
    };
  }, [tamagui]);

  const markedDates = useMemo(() => {
    const markers = buildCalendarMarkers(transactions, markerTheme);
    const out: Record<string, CalendarMarker & { selected?: boolean }> = {};
    for (const [day, marker] of Object.entries(markers)) {
      out[day] = marker;
    }
    if (selectedDay) {
      out[selectedDay] = { ...(out[selectedDay] ?? { marked: false, count: 0, dots: [] }), selected: true };
    }
    return out;
  }, [markerTheme, selectedDay, transactions]);

  const dayTransactions = useMemo(() => {
    return selectedDay
      ? transactionsForDay(transactions, selectedDay)
      : [];
  }, [selectedDay, transactions]);

  const handleDayPress = useCallback((day: { dateString: string }): void => {
    setSelectedDay(day.dateString);
  }, []);

  const handleClose = useCallback((): void => {
    setSelectedDay(null);
  }, []);

  return (
    <YStack gap="$3" testID="financial-calendar">
      <Calendar
        current={new Date().toISOString().slice(0, 10)}
        markingType="multi-dot"
        markedDates={markedDates as never}
        onDayPress={handleDayPress}
        theme={{
          backgroundColor: "transparent",
          calendarBackground: "transparent",
          dayTextColor: tamagui.color?.val ?? "#1a1a1a",
          monthTextColor: tamagui.color?.val ?? "#1a1a1a",
          textSectionTitleColor: tamagui.muted?.val ?? "#8a8a8a",
          selectedDayBackgroundColor: tamagui.secondary?.val ?? "#5B5BD6",
          selectedDayTextColor: "#ffffff",
          todayTextColor: tamagui.primary?.val ?? "#ff8a3d",
          arrowColor: tamagui.secondary?.val ?? "#5B5BD6",
        }}
      />

      <Modal
        visible={selectedDay !== null}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <DayDetailSheet
          day={selectedDay}
          transactions={dayTransactions}
          onClose={handleClose}
          translate={t}
        />
      </Modal>
    </YStack>
  );
}

interface DayDetailSheetProps {
  readonly day: string | null;
  readonly transactions: readonly TransactionViewModel[];
  readonly onClose: () => void;
  readonly translate: (key: string) => string;
}

function DayDetailSheet({
  day,
  transactions,
  onClose,
  translate,
}: DayDetailSheetProps): ReactElement | null {
  if (!day) {
    return null;
  }
  return (
    <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" justifyContent="flex-end">
      <YStack
        backgroundColor="$background"
        padding="$4"
        gap="$3"
        borderTopLeftRadius="$3"
        borderTopRightRadius="$3"
        maxHeight="70%"
      >
        <AppSurfaceCard
          title={translate("transactions.calendar.dayTitle")}
          description={formatShortDate(day)}
        >
          {transactions.length === 0 ? (
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              {translate("transactions.calendar.empty")}
            </Paragraph>
          ) : (
            <YStack gap="$3">
              {transactions.map((tx) => (
                <DayRow key={tx.id} tx={tx} />
              ))}
            </YStack>
          )}
          <AppButton tone="secondary" onPress={onClose} marginTop="$3">
            {translate("transactions.calendar.close")}
          </AppButton>
        </AppSurfaceCard>
      </YStack>
    </YStack>
  );
}

interface DayRowProps {
  readonly tx: TransactionViewModel;
}

function DayRow({ tx }: DayRowProps): ReactElement {
  return (
    <AppKeyValueRow
      label={tx.title}
      value={
        <XStack alignItems="center" gap="$2">
          <YStack alignItems="flex-end" gap="$1">
            <Paragraph
              color={tx.type === "income" ? "$success" : "$danger"}
              fontFamily="$body"
              fontSize="$4"
            >
              {tx.type === "income" ? "+" : "-"}
              {tx.amount}
            </Paragraph>
          </YStack>
          <AppBadge tone={STATUS_TONE[tx.status] ?? "default"}>{tx.status}</AppBadge>
        </XStack>
      }
    />
  );
}
