/** Tom do badge de status por estado da transação. */
export const STATUS_TONE: Record<string, "default" | "primary" | "danger"> = {
  paid: "primary",
  pending: "default",
  overdue: "danger",
  cancelled: "default",
  postponed: "default",
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
