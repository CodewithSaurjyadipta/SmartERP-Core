// ============================================================
// Voucher Type Constants
// ============================================================

export const VOUCHER_TYPES = {
  SALES: 'SALES',
  PURCHASE: 'PURCHASE',
  RECEIPT: 'RECEIPT',
  PAYMENT: 'PAYMENT',
  JOURNAL: 'JOURNAL',
  CREDIT_NOTE: 'CREDIT_NOTE',
  DEBIT_NOTE: 'DEBIT_NOTE',
  CONTRA: 'CONTRA',
} as const;

export type VoucherType = (typeof VOUCHER_TYPES)[keyof typeof VOUCHER_TYPES];

export const VOUCHER_PREFIXES: Record<VoucherType, string> = {
  SALES: 'SV',
  PURCHASE: 'PV',
  RECEIPT: 'RV',
  PAYMENT: 'PMT',
  JOURNAL: 'JV',
  CREDIT_NOTE: 'CN',
  DEBIT_NOTE: 'DN',
  CONTRA: 'CTR',
};
