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

const shortThousandsFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const wholeFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number): string => {
  return currencyFormatter.format(value);
};

/**
 * Formata um valor monetário de forma compacta para chrome/hero (ex.: "R$ 65,3k").
 * Valores com módulo >= 1000 são abreviados em milhares com uma casa decimal;
 * abaixo disso são exibidos como inteiro. Preserva o sinal negativo.
 *
 * @param value Valor numérico em reais.
 * @returns String monetária abreviada em pt-BR.
 */
export const formatCurrencyShort = (value: number): string => {
  if (Math.abs(value) >= 1000) {
    return `R$ ${shortThousandsFormatter.format(value / 1000)}k`;
  }
  return `R$ ${wholeFormatter.format(value)}`;
};

export const formatPercent = (value: number): string => {
  return `${percentFormatter.format(value)}%`;
};

export const formatShortDate = (value: string): string => {
  return dateFormatter.format(new Date(value));
};
