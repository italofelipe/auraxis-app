import { useCallback, useMemo, useState, type ReactElement } from "react";

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
  stepMonth,
  type CalendarCell,
} from "@/features/transactions/services/calendar-grid";
import type { TransactionViewModel } from "@/features/transactions/hooks/use-transactions-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";
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

const MONTH_LABELS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

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
}: FinancialCalendarProps): ReactElement {
  const tamagui = useTheme();
  const start = useMemo(() => today(), []);
  const [page, setPage] = useState({ year: start.year, month: start.month });
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

  const month = useMemo(() => buildCalendarMonth(page.year, page.month), [page]);

  const dayTransactions = useMemo(() => {
    return selectedDay ? transactionsForDay(transactions, selectedDay) : [];
  }, [selectedDay, transactions]);

  const handlePrev = useCallback(() => {
    setPage((current) => stepMonth(current.year, current.month, -1));
  }, []);
  const handleNext = useCallback(() => {
    setPage((current) => stepMonth(current.year, current.month, +1));
  }, []);

  const handleSelect = useCallback((day: string): void => {
    setSelectedDay(day);
  }, []);
  const handleClose = useCallback((): void => {
    setSelectedDay(null);
  }, []);

  return (
    <YStack gap="$3" testID="financial-calendar">
      <CalendarHeader
        title={`${MONTH_LABELS_PT[page.month - 1]} ${page.year}`}
        onPrev={handlePrev}
        onNext={handleNext}
      />
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

interface CalendarHeaderProps {
  readonly title: string;
  readonly onPrev: () => void;
  readonly onNext: () => void;
}

function CalendarHeader({ title, onPrev, onNext }: CalendarHeaderProps): ReactElement {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$2">
      <AppButton tone="secondary" onPress={onPrev} accessibilityLabel="Mês anterior">
        ←
      </AppButton>
      <Paragraph color="$color" fontFamily="$heading" fontSize="$5">
        {title}
      </Paragraph>
      <AppButton tone="secondary" onPress={onNext} accessibilityLabel="Próximo mês">
        →
      </AppButton>
    </XStack>
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
          title={t("transactions.calendar.dayTitle")}
          description={formatShortDate(day)}
        >
          {transactions.length === 0 ? (
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              {t("transactions.calendar.empty")}
            </Paragraph>
          ) : (
            <YStack gap="$3">
              {transactions.map((tx) => (
                <DayRow key={tx.id} tx={tx} />
              ))}
            </YStack>
          )}
          <AppButton tone="secondary" onPress={onClose} marginTop="$3">
            {t("transactions.calendar.close")}
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
