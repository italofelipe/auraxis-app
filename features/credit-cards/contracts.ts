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
}

export interface CreditCardListResponse {
  readonly creditCards: readonly CreditCard[];
}

export interface CreateCreditCardCommand {
  readonly name: string;
  readonly brand?: CreditCardBrand | null;
  readonly limitAmount?: number | null;
  readonly closingDay?: number | null;
  readonly dueDay?: number | null;
  readonly lastFourDigits?: string | null;
}

export interface UpdateCreditCardCommand {
  readonly creditCardId: string;
  readonly name: string;
  readonly brand?: CreditCardBrand | null;
  readonly limitAmount?: number | null;
  readonly closingDay?: number | null;
  readonly dueDay?: number | null;
  readonly lastFourDigits?: string | null;
}
