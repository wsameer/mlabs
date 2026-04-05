export interface AccountFormValues {
  name: string;
  balance: number;
  currency: string;
  // credit-only
  creditLimit?: number;
  // investment-only
  broker?: string;
}
