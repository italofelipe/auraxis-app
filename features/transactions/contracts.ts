export type TransactionType = "income" | "expense";

export type TransactionStatus =
  | "paid"
  | "pending"
  | "cancelled"
  | "postponed"
  | "overdue";

export interface TransactionRecord {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
  readonly type: TransactionType;
  readonly dueDate: string;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly description: string | null;
  readonly observation: string | null;
  readonly isRecurring: boolean;
  readonly isInstallment: boolean;
  readonly installmentCount: number | null;
  readonly tagId: string | null;
  readonly accountId: string | null;
  readonly creditCardId: string | null;
  readonly status: TransactionStatus;
  readonly currency: string;
  readonly source: string;
  readonly externalId: string | null;
  readonly bankName: string | null;
  readonly installmentGroupId: string | null;
  readonly paidAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface TransactionPagination {
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
  readonly pages: number | null;
  readonly hasNextPage: boolean | null;
}

export interface TransactionCollection {
  readonly transactions: TransactionRecord[];
  readonly pagination: TransactionPagination;
}

export interface TransactionListQuery {
  readonly page?: number;
  readonly perPage?: number;
  readonly type?: TransactionType;
  readonly status?: TransactionStatus;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly tagId?: string;
  readonly accountId?: string;
  readonly creditCardId?: string;
}

export interface TransactionSummaryQuery {
  readonly month: string;
  readonly page?: number;
  readonly perPage?: number;
}

export interface TransactionSummary {
  readonly month: string;
  readonly incomeTotal: string;
  readonly expenseTotal: string;
  readonly items: TransactionRecord[];
  readonly pagination: TransactionPagination;
}

export interface UpsertTransactionCommand {
  readonly title: string;
  readonly amount: string;
  readonly type: TransactionType;
  readonly dueDate: string;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly description?: string | null;
  readonly observation?: string | null;
  readonly isRecurring?: boolean;
  readonly isInstallment?: boolean;
  readonly installmentCount?: number | null;
  readonly tagId?: string | null;
  readonly accountId?: string | null;
  readonly creditCardId?: string | null;
  readonly status?: TransactionStatus;
  readonly currency?: string;
  readonly source?: string;
  readonly externalId?: string | null;
  readonly bankName?: string | null;
  readonly paidAt?: string | null;
}

export type CreateTransactionCommand = UpsertTransactionCommand;
export type UpdateTransactionCommand = Partial<UpsertTransactionCommand>;

export interface DeletedTransactionRecord extends TransactionRecord {
  readonly deletedAt: string | null;
}

export interface DeletedTransactionListResponse {
  readonly transactions: readonly DeletedTransactionRecord[];
}

/** Single item returned by GET /transactions/due-range. */
export interface DueTransactionRecord {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
  readonly type: "income" | "expense";
  readonly dueDate: string;
  readonly status: "pending" | "paid" | "overdue" | "postponed" | "cancelled";
  readonly tagId: string | null;
  readonly accountId: string | null;
  readonly creditCardId: string | null;
  readonly isRecurring: boolean;
}

export interface DueRangeCounts {
  readonly total: number;
  readonly overdue: number;
  readonly pending: number;
}

export interface DueRangeResponse {
  readonly transactions: DueTransactionRecord[];
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
  readonly counts: DueRangeCounts;
}

export interface DueRangeFilters {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly orderBy?: "overdue_first" | "date" | "title";
  readonly page?: number;
  readonly perPage?: number;
}

export type TransactionExportFormat = "csv" | "pdf";

export interface TransactionExportFilters {
  readonly format: TransactionExportFormat;
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface TransactionExportBlob {
  /** Base64-encoded payload, ready to write to disk on RN. */
  readonly base64: string;
  readonly filename: string;
  readonly contentType: string;
}
