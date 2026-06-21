import type { TransactionType } from "@/features/transactions/contracts";

/** Tom do badge de status por estado da transação. */
export const STATUS_TONE: Record<string, "default" | "primary" | "danger"> = {
  paid: "primary",
  pending: "default",
  overdue: "danger",
  cancelled: "default",
  postponed: "default",
};

/**
 * Tom semântico do chip de status no FEED redesenhado. Mapeia para os tokens
 * de cor do tema (`$success`/`$warning`/`$danger`/`$muted`) — a resolução em
 * cor concreta fica no componente, mantendo o `.tsx` livre de hex.
 */
export type StatusVisualTone = "success" | "warning" | "danger" | "neutral";

interface StatusVisual {
  /** Tom semântico (token de cor do tema). */
  readonly tone: StatusVisualTone;
  /** Glifo do `MaterialCommunityIcons` que ilustra o status. */
  readonly icon: string;
}

/** Descritor visual (tom + ícone) por estado da transação. */
const STATUS_VISUAL: Record<string, StatusVisual> = {
  paid: { tone: "success", icon: "check-circle-outline" },
  pending: { tone: "warning", icon: "clock-outline" },
  overdue: { tone: "danger", icon: "alert-circle-outline" },
  cancelled: { tone: "neutral", icon: "close-circle-outline" },
  postponed: { tone: "neutral", icon: "calendar-clock-outline" },
};

/** Descritor visual padrão para estados desconhecidos. */
const FALLBACK_STATUS_VISUAL: StatusVisual = {
  tone: "neutral",
  icon: "circle-outline",
};

/**
 * Resolve o tom semântico + ícone do chip de status (feed redesenhado), com
 * fallback neutro seguro para estados não mapeados.
 *
 * @param status Estado cru da transação (inglês, vindo da API).
 * @returns Descritor visual (tom de tema + glifo MCI).
 */
export const statusVisual = (status: string): StatusVisual =>
  STATUS_VISUAL[status] ?? FALLBACK_STATUS_VISUAL;

/**
 * Rótulo do status sensível ao tipo: uma receita paga é exibida como
 * "Recebido" (em vez de "Pago"), espelhando o design. Demais casos delegam
 * para `formatStatusLabel`.
 *
 * @param status Estado cru da transação.
 * @param type Tipo da transação (receita/despesa).
 * @returns Rótulo pt-BR do status.
 */
export const formatStatusLabelForType = (
  status: string,
  type: TransactionType,
): string => {
  if (status === "paid" && type === "income") {
    return "Recebido";
  }
  return formatStatusLabel(status);
};

/** Rótulo pt-BR do status (o backend devolve em inglês). */
export const STATUS_LABEL_PT: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Vencido",
  cancelled: "Cancelado",
  postponed: "Adiado",
};

/** Resolve o tom do badge, com fallback seguro. */
export const statusTone = (status: string): "default" | "primary" | "danger" =>
  STATUS_TONE[status] ?? "default";

/** Resolve o rótulo pt-BR do status, com fallback para o valor cru. */
export const formatStatusLabel = (status: string): string =>
  STATUS_LABEL_PT[status] ?? status;

interface InstallmentInfo {
  readonly isInstallment: boolean;
  readonly installmentCount: number | null;
  readonly installmentNumber: number | null;
}

/**
 * Rótulo de parcelamento ("Parcela 2/12" ou "Parcelado em 12x") ou null
 * quando a transação não é parcelada.
 */
export const getInstallmentLabel = (tx: InstallmentInfo): string | null => {
  if (!tx.isInstallment || !tx.installmentCount) {
    return null;
  }
  if (tx.installmentNumber) {
    return `Parcela ${tx.installmentNumber}/${tx.installmentCount}`;
  }
  return `Parcelado em ${tx.installmentCount}x`;
};
