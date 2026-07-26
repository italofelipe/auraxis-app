import { useCallback, useMemo, useState, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Pressable } from "react-native";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";

import {
  buildCalendarMarkers,
  transactionsForDay,
  type CalendarMarker,
  type CalendarTheme,
} from "@/features/transactions/services/calendar-markers";
import {
  buildCalendarMonth,
  type CalendarCell,
} from "@/features/transactions/services/calendar-grid";
import type { TransactionViewModel } from "@/features/transactions/hooks/use-transactions-screen-controller";
import { formatStatusLabelForType } from "@/features/transactions/utils/transaction-presentation";
import { AppBadge } from "@/shared/components/app-badge";
import { useT } from "@/shared/i18n";
import { iconSizes } from "@/shared/theme";
import { formatShortDate } from "@/shared/utils/formatters";

const STATUS_TONE: Record<string, "default" | "primary" | "danger"> = {
  paid: "primary",
  pending: "default",
  overdue: "danger",
  cancelled: "default",
  postponed: "default",
};

const WEEKDAY_KEYS_PT = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;
const WEEKDAY_LABELS_PT: Record<(typeof WEEKDAY_KEYS_PT)[number], string> = {
  dom: "Dom",
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sáb",
};

const today = (): { readonly year: number; readonly month: number; readonly iso: string } => {
  const d = new Date();
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    iso: d.toISOString().slice(0, 10),
  };
};

export interface FinancialCalendarProps {
  readonly transactions: readonly TransactionViewModel[];
  /** Ano controlado pelo controller da tela. */
  readonly year: number;
  /** Mês controlado pelo controller da tela, no formato 0–11. */
  readonly month: number;
}

/**
 * Month-view financial calendar with up to three coloured dots per day
 * (income / expense / planned). Built in-house to avoid pulling
 * `react-native-calendars` (GPL/MIT-dual `xdate` transitive dep) and
 * to keep the bundle lean — no external chart or calendar libraries.
 *
 * Tap a day to inspect the transactions that land on it via a sheet.
 */
 
export function FinancialCalendar({
  transactions,
  year,
  month: controlledMonth,
}: FinancialCalendarProps): ReactElement {
  const tamagui = useTheme();
  const start = useMemo(() => today(), []);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const markerTheme = useMemo<CalendarTheme>(() => {
    return {
      income: tamagui.success?.val ?? "#1f9d55",
      expense: tamagui.danger?.val ?? "#c53030",
      planned: tamagui.muted?.val ?? "#8a8a8a",
    };
  }, [tamagui]);

  const markers = useMemo(() => {
    return buildCalendarMarkers(transactions, markerTheme);
  }, [markerTheme, transactions]);

  const month = useMemo(
    () => buildCalendarMonth(year, controlledMonth + 1),
    [controlledMonth, year],
  );

  const dayTransactions = useMemo(() => {
    return selectedDay ? transactionsForDay(transactions, selectedDay) : [];
  }, [selectedDay, transactions]);

  const handleSelect = useCallback((day: string): void => {
    setSelectedDay(day);
  }, []);
  const handleClose = useCallback((): void => {
    setSelectedDay(null);
  }, []);

  return (
    <YStack gap="$3" testID="financial-calendar">
      <WeekdayHeader />
      <YStack gap="$1">
        {month.weeks.map((week, rowIndex) => (
          <XStack key={`row-${rowIndex}`} gap="$1">
            {week.map((cell) => (
              <DayCell
                key={cell.day}
                cell={cell}
                marker={markers[cell.day]}
                isToday={cell.day === start.iso}
                isSelected={cell.day === selectedDay}
                onSelect={handleSelect}
              />
            ))}
          </XStack>
        ))}
      </YStack>

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
        />
      </Modal>
    </YStack>
  );
}

function WeekdayHeader(): ReactElement {
  return (
    <XStack gap="$1">
      {WEEKDAY_KEYS_PT.map((key) => (
        <YStack key={key} flex={1} alignItems="center">
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            {WEEKDAY_LABELS_PT[key]}
          </Paragraph>
        </YStack>
      ))}
    </XStack>
  );
}

interface DayCellProps {
  readonly cell: CalendarCell;
  readonly marker: CalendarMarker | undefined;
  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly onSelect: (day: string) => void;
}

function DayCell({
  cell,
  marker,
  isToday,
  isSelected,
  onSelect,
}: DayCellProps): ReactElement {
  const tamagui = useTheme();
  const handlePress = useCallback(() => {
    onSelect(cell.day);
  }, [cell.day, onSelect]);

  const baseColor = cell.inMonth
    ? tamagui.color?.val ?? "#1a1a1a"
    : tamagui.muted?.val ?? "#bbbbbb";

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={cell.day}
      accessibilityState={{ selected: isSelected }}
      testID={`calendar-day-${marker ? "with-transactions-" : ""}${cell.day}`}
      style={{ flex: 1 }}
    >
      <YStack
        alignItems="center"
        justifyContent="center"
        gap={2}
        paddingVertical="$2"
        backgroundColor={
          isSelected
            ? tamagui.secondary?.val ?? "#5B5BD6"
            : "transparent"
        }
        borderRadius="$1"
        minHeight={44}
      >
        <Paragraph
          color={isSelected ? "#ffffff" : baseColor}
          fontFamily="$body"
          fontSize="$3"
          fontWeight={isToday ? "700" : "400"}
        >
          {cell.dayOfMonth}
        </Paragraph>
        {marker ? (
          <XStack gap={2} height={6} alignItems="center">
            {marker.dots.slice(0, 3).map((dot) => (
              <YStack
                key={dot.key}
                width={6}
                height={6}
                borderRadius={3}
                backgroundColor={dot.color}
              />
            ))}
          </XStack>
        ) : null}
      </YStack>
    </Pressable>
  );
}

interface DayDetailSheetProps {
  readonly day: string | null;
  readonly transactions: readonly TransactionViewModel[];
  readonly onClose: () => void;
}

function DayDetailSheet({
  day,
  transactions,
  onClose,
}: DayDetailSheetProps): ReactElement | null {
  const { t } = useT();
  const theme = useTheme();
  const iconColor = theme.color?.val ?? "#000000";
  if (!day) {
    return null;
  }
  return (
    <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" justifyContent="flex-end">
      <YStack
        backgroundColor="$background"
        padding="$5"
        gap="$4"
        borderTopLeftRadius={24}
        borderTopRightRadius={24}
        maxHeight="70%"
        testID="calendar-day-sheet"
      >
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
          <YStack flex={1} gap="$1">
            <Paragraph color="$color" fontFamily="$heading" fontSize="$6" fontWeight="$7">
              {t("transactions.calendar.dayTitle")}
            </Paragraph>
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              {formatShortDate(day)}
            </Paragraph>
          </YStack>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("transactions.calendar.close")}
            onPress={onClose}
            testID="calendar-day-sheet-close"
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              name="close"
              size={iconSizes.lg}
              color={iconColor}
            />
          </Pressable>
        </XStack>
        {transactions.length === 0 ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {t("transactions.calendar.empty")}
          </Paragraph>
        ) : (
          <YStack>
            {transactions.map((tx, index) => (
              <DayRow
                key={tx.id}
                tx={tx}
                showDivider={index < transactions.length - 1}
              />
            ))}
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}

interface DayRowProps {
  readonly tx: TransactionViewModel;
  readonly showDivider: boolean;
}

function DayRow({ tx, showDivider }: DayRowProps): ReactElement {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      gap="$3"
      paddingVertical="$3"
      borderBottomWidth={showDivider ? 1 : 0}
      borderBottomColor="$borderColor"
    >
      <Paragraph flex={1} color="$color" fontFamily="$body" fontSize="$3">
        {tx.title}
      </Paragraph>
      <Paragraph
        color={tx.type === "income" ? "$success" : "$danger"}
        fontFamily="$body"
        fontSize="$4"
      >
        {tx.type === "income" ? "+" : "-"}
        {tx.amount}
      </Paragraph>
      <AppBadge tone={STATUS_TONE[tx.status] ?? "default"}>
        {formatStatusLabelForType(tx.status, tx.type)}
      </AppBadge>
    </XStack>
  );
}
