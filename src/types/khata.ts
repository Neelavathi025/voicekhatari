export type TransactionType = 'credit' | 'payment';

export type TransactionSource = 'voice' | 'manual';

export type LanguageCode = 'kn' | 'hi' | 'en';

export type ScreenId =
  | 'dashboard'
  | 'voice'
  | 'customers'
  | 'transactions'
  | 'insights';

export interface Customer {
  id?: number;
  name: string;
  phone?: string;
  area?: string;
  createdAt: number;
}

export interface Transaction {
  id?: number;
  customerId: number;
  customerNameSnapshot: string;
  type: TransactionType;
  amount: number;
  note: string;
  source: TransactionSource;
  createdAt: number;
}

export type ParsedIntent =
  | 'transaction'
  | 'balance_query'
  | 'correction'
  | 'cancel'
  | 'invalid';

export interface ParsedCommandResult {
  intent: ParsedIntent;
  rawText: string;
  transactionType?: TransactionType;
  amount?: number;
  previousAmount?: number;
  customerQuery?: string;
  matchedCustomers: Customer[];
  validationError?: string;
  spokenPrompt: string;
}
