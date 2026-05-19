export type CreditCardBrand =
  | "visa"
  | "mastercard"
  | "elo"
  | "hipercard"
  | "amex"
  | "other";

export interface CreditCard {
  readonly id: string;
  readonly name: string;
  readonly brand: CreditCardBrand | null;
  readonly limitAmount: number | null;
  readonly closingDay: number | null;
  readonly dueDay: number | null;
  readonly lastFourDigits: string | null;
  readonly bank: string | null;
  readonly description: string | null;
  readonly benefits: readonly string[];
  readonly validityDate: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface CreditCardListResponse {
  readonly creditCards: readonly CreditCard[];
}

export interface CreditCardBillCycle {
  readonly startDate: string;
  readonly endDate: string;
  readonly dueDate: string;
  readonly status: "open" | "closed" | "paid" | string;
}

export interface CreditCardBillTransaction {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  readonly dueDate: string | null;
  readonly status: string;
  readonly type: string;
}

export interface CreditCardBillRecord {
  readonly cycle: CreditCardBillCycle;
  readonly transactions: readonly CreditCardBillTransaction[];
  readonly totalAmount: number;
  readonly paidAmount: number;
  readonly pendingAmount: number;
}

export interface CreditCardUtilizationRecord {
  readonly cycle: CreditCardBillCycle;
  readonly committedAmount: number;
  readonly availableAmount: number | null;
  readonly limitAmount: number | null;
  readonly utilizationPct: number | null;
}

export interface CreditCardBillQuery {
  readonly month?: string;
}

export interface CreateCreditCardCommand {
  readonly name: string;
  readonly brand?: CreditCardBrand | null;
  readonly limitAmount?: number | null;
  readonly closingDay?: number | null;
  readonly dueDay?: number | null;
  readonly lastFourDigits?: string | null;
  readonly bank?: string | null;
  readonly description?: string | null;
  readonly benefits?: readonly string[] | null;
  readonly validityDate?: string | null;
}

export interface UpdateCreditCardCommand {
  readonly creditCardId: string;
  readonly name: string;
  readonly brand?: CreditCardBrand | null;
  readonly limitAmount?: number | null;
  readonly closingDay?: number | null;
  readonly dueDay?: number | null;
  readonly lastFourDigits?: string | null;
  readonly bank?: string | null;
  readonly description?: string | null;
  readonly benefits?: readonly string[] | null;
  readonly validityDate?: string | null;
}
