import { Voucher, VoucherEntry, StockVoucherEntry } from '@smarterp/shared';

export interface DbVoucher {
  id: string;
  company_id: string;
  voucher_number: string;
  voucher_type: string;
  status: string;
  date: Date;
  narration?: string | null;
  reference_number?: string | null;
  total_amount: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbVoucherEntry {
  id: string;
  voucher_id: string;
  ledger_id: string;
  entry_type: string;
  amount: number;
  narration?: string | null;
  created_at: Date;
}

export interface DbStockMovement {
  id: string;
  voucher_id: string;
  stock_item_id: string;
  movement_type: string;
  qty: number;
  rate: number;
  amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  created_at: Date;
}

export interface DbAuditLog {
  id: string;
  company_id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: any;
  new_values?: any;
  reason?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: Date;
}

export interface ClientContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}
