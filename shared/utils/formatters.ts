const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const formatCurrency = (value: number): string => {
  return currencyFormatter.format(value);
};

export const formatPercent = (value: number): string => {
  return `${percentFormatter.format(value)}%`;
};

export const formatShortDate = (value: string): string => {
  return dateFormatter.format(new Date(value));
};
