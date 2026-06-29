import { VoucherType } from '../constants/voucher-types';
export type VoucherStatus = 'DRAFT' | 'POSTED' | 'CANCELLED' | 'REVERSED';
export type EntryType = 'DEBIT' | 'CREDIT';

export interface Voucher {
  id: string;
  companyId: string;
  voucherNumber: string;
  voucherType: VoucherType;
  status: VoucherStatus;
  date: string; // YYYY-MM-DD
  narration?: string;
  referenceNumber?: string;
  totalAmount: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  entries?: VoucherEntry[];
}

export interface VoucherEntry {
  id: string;
  voucherId: string;
  ledgerId: string;
  entryType: EntryType;
  amount: number;
  narration?: string;
  createdAt: string;
}

export interface StockVoucherEntry {
  id: string;
  voucherId: string;
  stockItemId: string;
  movementType: 'INWARD' | 'OUTWARD';
  qty: number;
  rate: number;
  amount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  companyId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
