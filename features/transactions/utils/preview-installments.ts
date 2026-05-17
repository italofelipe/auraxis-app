export interface InstallmentPreviewInput {
  readonly amount: string;
  readonly installmentCount: number;
  readonly firstDueDate: Date;
}

export interface InstallmentPreviewItem {
  readonly installmentNumber: number;
  readonly dueDate: string;
  readonly amount: string;
}

export interface InstallmentPreview {
  readonly totalAmount: string;
  readonly perInstallmentAmount: string;
  readonly installments: readonly InstallmentPreviewItem[];
}

const formatCents = (cents: number): string => {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const units = Math.trunc(absolute / 100);
  const decimals = String(absolute % 100).padStart(2, "0");
  return `${sign}${units}.${decimals}`;
};

const parseAmountToCents = (amount: string): number => {
  const trimmed = amount.trim();
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const [unitsRaw = "0", decimalsRaw = ""] = normalized.split(".");
  const units = Number.parseInt(unitsRaw, 10);
  const decimals = Number.parseInt(decimalsRaw.padEnd(2, "0").slice(0, 2), 10);

  if (!Number.isFinite(units) || !Number.isFinite(decimals)) {
    throw new Error("Invalid amount for installment preview.");
  }

  return units * 100 + decimals;
};

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const getLastDayOfUtcMonth = (year: number, monthIndex: number): number => {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
};

const addUtcMonthsClamped = (date: Date, monthsToAdd: number): Date => {
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();
  const day = date.getUTCDate();
  const targetMonthStart = new Date(Date.UTC(year, monthIndex + monthsToAdd, 1));
  const targetYear = targetMonthStart.getUTCFullYear();
  const targetMonthIndex = targetMonthStart.getUTCMonth();
  const clampedDay = Math.min(
    day,
    getLastDayOfUtcMonth(targetYear, targetMonthIndex),
  );

  return new Date(Date.UTC(targetYear, targetMonthIndex, clampedDay));
};

export const previewInstallments = ({
  amount,
  installmentCount,
  firstDueDate,
}: InstallmentPreviewInput): InstallmentPreview => {
  if (!Number.isInteger(installmentCount) || installmentCount < 1) {
    throw new Error("Invalid installment count.");
  }
  if (Number.isNaN(firstDueDate.getTime())) {
    throw new Error("Invalid first due date.");
  }

  const totalCents = parseAmountToCents(amount);
  const baseCents = Math.trunc(totalCents / installmentCount);
  const remainderCents = totalCents % installmentCount;
  const installments = Array.from({ length: installmentCount }, (_, index) => {
    const amountCents = baseCents + (index < remainderCents ? 1 : 0);
    return {
      installmentNumber: index + 1,
      dueDate: toIsoDate(addUtcMonthsClamped(firstDueDate, index)),
      amount: formatCents(amountCents),
    };
  });

  return {
    totalAmount: formatCents(totalCents),
    perInstallmentAmount: installments[0]?.amount ?? "0.00",
    installments,
  };
};
