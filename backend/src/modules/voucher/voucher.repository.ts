import { Knex } from 'knex';
import { db } from '../../config/db';
import { Voucher, VoucherEntry, StockVoucherEntry, VoucherType, VoucherStatus } from '@smarterp/shared';
import { DbVoucher, DbVoucherEntry, DbStockMovement, DbAuditLog } from './voucher.types';

export function mapRowToVoucher(row: any): Voucher {
  return {
    id: row.id,
    companyId: row.company_id,
    voucherNumber: row.voucher_number,
    voucherType: row.voucher_type as VoucherType,
    status: row.status as VoucherStatus,
    date: new Date(row.date).toISOString().split('T')[0],
    narration: row.narration ?? undefined,
    referenceNumber: row.reference_number ?? undefined,
    totalAmount: Number(row.total_amount || 0),
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function mapRowToEntry(row: any): VoucherEntry {
  return {
    id: row.id,
    voucherId: row.voucher_id,
    ledgerId: row.ledger_id,
    entryType: row.entry_type as 'DEBIT' | 'CREDIT',
    amount: Number(row.amount || 0),
    narration: row.narration ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function mapRowToStockMovement(row: any): StockVoucherEntry {
  return {
    id: row.id,
    voucherId: row.voucher_id,
    stockItemId: row.stock_item_id,
    movementType: row.movement_type as 'INWARD' | 'OUTWARD',
    qty: Number(row.qty || 0),
    rate: Number(row.rate || 0),
    amount: Number(row.amount || 0),
    cgstRate: Number(row.cgst_rate || 0),
    cgstAmount: Number(row.cgst_amount || 0),
    sgstRate: Number(row.sgst_rate || 0),
    sgstAmount: Number(row.sgst_amount || 0),
    igstRate: Number(row.igst_rate || 0),
    igstAmount: Number(row.igst_amount || 0),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export const voucherRepository = {
  // Read Vouchers list with filter and pagination
  async findAll(
    companyId: string,
    filters?: {
      status?: VoucherStatus;
      voucherType?: VoucherType;
      startDate?: string;
      endDate?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ vouchers: Voucher[]; totalCount: number }> {
    const builder = () => {
      let q = db('vouchers').where({ company_id: companyId });
      
      if (filters?.status) {
        q = q.andWhere('status', filters.status);
      }
      if (filters?.voucherType) {
        q = q.andWhere('voucher_type', filters.voucherType);
      }
      if (filters?.startDate) {
        q = q.andWhere('date', '>=', filters.startDate);
      }
      if (filters?.endDate) {
        q = q.andWhere('date', '<=', filters.endDate);
      }
      if (filters?.search) {
        q = q.andWhere((subQ) => {
          subQ.whereILike('voucher_number', `%${filters.search}%`)
              .orWhereILike('narration', `%${filters.search}%`)
              .orWhereILike('reference_number', `%${filters.search}%`);
        });
      }
      return q;
    };

    // Retrieve count
    const [{ count }] = await builder().count('id as count');
    const totalCount = Number(count || 0);

    // Retrieve rows
    let query = builder().orderBy('date', 'desc').orderBy('created_at', 'desc');
    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset);
    }

    const rows = await query;
    return {
      vouchers: rows.map(mapRowToVoucher),
      totalCount,
    };
  },

  // Read detailed single Voucher
  async findById(trx: Knex.Transaction | Knex, companyId: string, id: string): Promise<(Voucher & { entries: VoucherEntry[]; stockEntries?: StockVoucherEntry[] }) | null> {
    const row = await trx('vouchers')
      .where({ company_id: companyId, id })
      .first();

    if (!row) return null;

    const voucher = mapRowToVoucher(row);

    const entryRows = await trx('voucher_entries')
      .where('voucher_id', id)
      .orderBy('entry_type', 'desc'); // DEBIT then CREDIT (classic layout)

    const entries = entryRows.map(mapRowToEntry);

    const movementRows = await trx('stock_movements')
      .where('voucher_id', id)
      .orderBy('created_at', 'asc');

    const stockEntries = movementRows.map(mapRowToStockMovement);

    return {
      ...voucher,
      entries,
      stockEntries: stockEntries.length > 0 ? stockEntries : undefined,
    };
  },

  // Create Voucher Header
  async createHeader(trx: Knex.Transaction, data: Partial<DbVoucher>): Promise<DbVoucher> {
    const [row] = await trx('vouchers')
      .insert(data)
      .returning('*');
    return row;
  },

  // Create Voucher Ledger Entries
  async createEntries(trx: Knex.Transaction, entries: Array<Partial<DbVoucherEntry>>): Promise<DbVoucherEntry[]> {
    return trx('voucher_entries')
      .insert(entries)
      .returning('*');
  },

  // Create Stock Movements
  async createStockMovements(trx: Knex.Transaction, movements: Array<Partial<DbStockMovement>>): Promise<DbStockMovement[]> {
    return trx('stock_movements')
      .insert(movements)
      .returning('*');
  },

  // Update Voucher Status
  async updateStatus(
    trx: Knex.Transaction,
    companyId: string,
    id: string,
    status: VoucherStatus,
    userId: string
  ): Promise<boolean> {
    const count = await trx('vouchers')
      .where({ company_id: companyId, id })
      .update({
        status,
        updated_by: userId,
        updated_at: new Date(),
      });
    return count > 0;
  },

  // Audit Logs insert
  async insertAuditLog(trx: Knex.Transaction, data: Partial<DbAuditLog>): Promise<void> {
    await trx('audit_logs').insert(data);
  },

  // Event Outbox queue write
  async insertOutboxEvent(
    trx: Knex.Transaction,
    companyId: string,
    eventType: string,
    payload: any
  ): Promise<void> {
    await trx('event_outbox').insert({
      company_id: companyId,
      event_type: eventType,
      payload: JSON.stringify(payload),
      status: 'PENDING',
    });
  },

  // Atomic locked update of cached balances
  async updateLedgerBalanceCache(
    trx: Knex.Transaction,
    companyId: string,
    ledgerId: string,
    amountDelta: number, // positive to increase balance, negative to decrease
    balanceType: 'DEBIT' | 'CREDIT'
  ): Promise<void> {
    // 1. Lock/Fetch current balance cached row
    const existing = await trx('ledger_balances')
      .where({ company_id: companyId, ledger_id: ledgerId })
      .forUpdate()
      .first();

    if (!existing) {
      // Initialize first balance cache row
      await trx('ledger_balances').insert({
        company_id: companyId,
        ledger_id: ledgerId,
        balance: amountDelta,
        balance_type: balanceType,
      });
      return;
    }

    let currentBalance = Number(existing.balance || 0);
    const existingType = existing.balance_type;

    // Calculate updated net balance using signs:
    // For DEBIT ledger, adding a DEBIT increases it, adding a CREDIT decreases it.
    // For CREDIT ledger, adding a CREDIT increases it, adding a DEBIT decreases it.
    if (existingType === balanceType) {
      currentBalance += amountDelta;
    } else {
      currentBalance -= amountDelta;
    }

    let finalBalance = currentBalance;
    let finalType = existingType;

    // Handle crossover cases (e.g. balance crosses zero into the opposite type)
    if (currentBalance < 0) {
      finalBalance = Math.abs(currentBalance);
      finalType = existingType === 'DEBIT' ? 'CREDIT' : 'DEBIT';
    }

    await trx('ledger_balances')
      .where({ company_id: companyId, ledger_id: ledgerId })
      .update({
        balance: finalBalance,
        balance_type: finalType,
        updated_at: new Date(),
      });
  },

  // Delete Draft Voucher
  async deleteDraft(trx: Knex.Transaction, companyId: string, id: string): Promise<boolean> {
    const count = await trx('vouchers')
      .where({ company_id: companyId, id, status: 'DRAFT' })
      .delete();
    return count > 0;
  },
};
