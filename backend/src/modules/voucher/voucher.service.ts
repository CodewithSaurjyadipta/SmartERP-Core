import { Knex } from 'knex';
import { db } from '../../config/db';
import { CreateVoucherInput, Voucher, VoucherStatus, VoucherType, VOUCHER_PREFIXES, createVoucherSchema } from '@smarterp/shared';
import { voucherRepository } from './voucher.repository';
import { VoucherStrategyRegistry } from './strategies/voucher.strategy';
import { ClientContext, DbVoucher, DbVoucherEntry, DbStockMovement } from './voucher.types';

// Helper to determine Indian Financial Year (April 1 to March 31)
export function getFinancialYearString(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (Jan is 0, Apr is 3)
  
  if (month >= 3) {
    // April to December
    return `${year}-${year + 1}`;
  } else {
    // January to March
    return `${year - 1}-${year}`;
  }
}

export const voucherService = {
  // Find Vouchers list
  async getVouchersList(
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
  ) {
    return voucherRepository.findAll(companyId, filters);
  },

  // Find Voucher detail
  async getVoucherById(companyId: string, id: string) {
    return voucherRepository.findById(db, companyId, id);
  },

  // Create (Post or save Draft) Voucher
  async createVoucher(
    companyId: string,
    context: ClientContext,
    input: CreateVoucherInput,
    status: VoucherStatus = 'POSTED'
  ): Promise<Voucher> {
    return db.transaction(async (trx) => {
      // 0. Zod Schema Validation & Coercion
      const validatedInput = createVoucherSchema.parse(input);
      input = validatedInput; // Overwrite input parameter with clean validated data

      // 1. Enforce Strategy Validation
      const strategy = VoucherStrategyRegistry.get(input.voucherType);
      await strategy.validate(trx, companyId, input);

      // 2. Determine Financial Year & Auto-lock/seed sequence
      const fy = getFinancialYearString(input.date);
      let seq = await trx('voucher_sequences')
        .where({ company_id: companyId, voucher_type: input.voucherType, financial_year: fy })
        .forUpdate()
        .first();

      if (!seq) {
        // Self-heal and initialize default sequence for new years
        const defaultPrefix = VOUCHER_PREFIXES[input.voucherType] || 'VCH';
        const prefixStr = `${defaultPrefix}-`; // Keep within 10 characters limit
        const [insertedSeq] = await trx('voucher_sequences')
          .insert({
            company_id: companyId,
            voucher_type: input.voucherType,
            financial_year: fy,
            prefix: prefixStr,
            last_number: 0,
            padding: 5,
          })
          .returning('*');
        seq = insertedSeq;
      }

      // Generate sequence number (atomic locked counter update)
      const nextNum = seq.last_number + 1;
      await trx('voucher_sequences')
        .where({ id: seq.id })
        .update({ last_number: nextNum });

      const voucherNumber = `${seq.prefix}${fy}-${String(nextNum).padStart(seq.padding, '0')}`;

      // Calculate total amount from entries
      let totalAmount = 0;
      input.entries.forEach(entry => {
        if (entry.entryType === 'DEBIT') {
          totalAmount += entry.amount;
        }
      });

      // 3. Create Voucher Header
      const headerPayload: Partial<DbVoucher> = {
        company_id: companyId,
        voucher_number: voucherNumber,
        voucher_type: input.voucherType,
        status,
        date: new Date(input.date),
        narration: input.narration || null,
        reference_number: input.referenceNumber || null,
        total_amount: totalAmount,
        created_by: context.userId,
        updated_by: context.userId,
      };
      
      const createdHeader = await voucherRepository.createHeader(trx, headerPayload);
      const voucherId = createdHeader.id;

      // 4. Create Entries & Update balances (if POSTED)
      const entryPayloads: Array<Partial<DbVoucherEntry>> = input.entries.map(e => ({
        voucher_id: voucherId,
        ledger_id: e.ledgerId,
        entry_type: e.entryType,
        amount: e.amount,
        narration: e.narration || null,
      }));
      await voucherRepository.createEntries(trx, entryPayloads);

      if (status === 'POSTED') {
        for (const e of input.entries) {
          // Debit increases debits, Credit increases credits
          await voucherRepository.updateLedgerBalanceCache(
            trx,
            companyId,
            e.ledgerId,
            e.amount,
            e.entryType
          );
        }
      }

      // 5. Create Stock Movements (if any)
      if (input.stockEntries && input.stockEntries.length > 0) {
        const movementPayloads: Array<Partial<DbStockMovement>> = input.stockEntries.map(s => {
          // Sales: OUTWARD, Purchase: INWARD
          const movementType = input.voucherType === 'SALES' ? 'OUTWARD' : 'INWARD';
          return {
            voucher_id: voucherId,
            stock_item_id: s.stockItemId,
            movement_type: movementType,
            qty: s.qty,
            rate: s.rate,
            amount: s.amount,
            cgst_rate: s.cgstRate || 0,
            cgst_amount: s.cgstRate ? Number(((s.amount * s.cgstRate) / 100).toFixed(2)) : 0,
            sgst_rate: s.sgstRate || 0,
            sgst_amount: s.sgstRate ? Number(((s.amount * s.sgstRate) / 100).toFixed(2)) : 0,
            igst_rate: s.igstRate || 0,
            igst_amount: s.igstRate ? Number(((s.amount * s.igstRate) / 100).toFixed(2)) : 0,
          };
        });
        await voucherRepository.createStockMovements(trx, movementPayloads);
      }

      // 6. Audit Trail Logging
      await voucherRepository.insertAuditLog(trx, {
        company_id: companyId,
        user_id: context.userId,
        action: 'VOUCHER_CREATE',
        entity_type: 'VOUCHER',
        entity_id: voucherId,
        new_values: { ...headerPayload, entries: input.entries, stockEntries: input.stockEntries },
        ip_address: context.ipAddress || null,
        user_agent: context.userAgent || null,
      });

      // 7. Event Outbox Queueing
      await voucherRepository.insertOutboxEvent(trx, companyId, 'voucher.created', {
        voucherId,
        voucherNumber,
        voucherType: input.voucherType,
        status,
        totalAmount,
      });

      // Retrieve full populated record
      const fullVoucher = await voucherRepository.findById(trx, companyId, voucherId);
      if (!fullVoucher) throw new Error('Voucher generation failed internally');
      return fullVoucher;
    });
  },

  // Promote Draft to Posted status
  async postDraftVoucher(companyId: string, context: ClientContext, id: string): Promise<Voucher> {
    return db.transaction(async (trx) => {
      const voucher = await voucherRepository.findById(trx, companyId, id);
      if (!voucher) throw new Error('Voucher draft not found');
      if (voucher.status !== 'DRAFT') throw new Error('Voucher is already posted');

      // Update status
      await voucherRepository.updateStatus(trx, companyId, id, 'POSTED', context.userId);

      // Apply ledger balance updates
      for (const e of voucher.entries) {
        await voucherRepository.updateLedgerBalanceCache(
          trx,
          companyId,
          e.ledgerId,
          e.amount,
          e.entryType
        );
      }

      // Audit Trail
      await voucherRepository.insertAuditLog(trx, {
        company_id: companyId,
        user_id: context.userId,
        action: 'VOUCHER_POST',
        entity_type: 'VOUCHER',
        entity_id: id,
        old_values: { status: 'DRAFT' },
        new_values: { status: 'POSTED' },
        ip_address: context.ipAddress || null,
        user_agent: context.userAgent || null,
      });

      // Outbox event
      await voucherRepository.insertOutboxEvent(trx, companyId, 'voucher.posted', { voucherId: id });

      const updated = await voucherRepository.findById(trx, companyId, id);
      if (!updated) throw new Error('Failed to retrieve updated voucher');
      return updated;
    });
  },

  // Cancel Voucher (Zero balances out but preserve invoice header number)
  async cancelVoucher(companyId: string, context: ClientContext, id: string, reason?: string): Promise<Voucher> {
    return db.transaction(async (trx) => {
      const voucher = await voucherRepository.findById(trx, companyId, id);
      if (!voucher) throw new Error('Voucher not found');
      if (voucher.status !== 'POSTED') throw new Error('Only posted vouchers can be cancelled');

      // Subtract balances cache
      for (const e of voucher.entries) {
        // Subtract original balance effect by updating cache with inverse entry type
        const inverseType = e.entryType === 'DEBIT' ? 'CREDIT' : 'DEBIT';
        await voucherRepository.updateLedgerBalanceCache(
          trx,
          companyId,
          e.ledgerId,
          e.amount,
          inverseType
        );
      }

      // Zero out entry amounts in DB for absolute accounting neutrality
      await trx('voucher_entries').where('voucher_id', id).update({ amount: 0 });
      await trx('stock_movements').where('voucher_id', id).update({ qty: 0, amount: 0 });
      await trx('vouchers').where('company_id', companyId).where('id', id).update({ total_amount: 0 });

      // Update status to CANCELLED
      await voucherRepository.updateStatus(trx, companyId, id, 'CANCELLED', context.userId);

      // Audit Trail
      await voucherRepository.insertAuditLog(trx, {
        company_id: companyId,
        user_id: context.userId,
        action: 'VOUCHER_CANCEL',
        entity_type: 'VOUCHER',
        entity_id: id,
        reason: reason || 'Manual cancellation',
        ip_address: context.ipAddress || null,
        user_agent: context.userAgent || null,
      });

      // Outbox Event
      await voucherRepository.insertOutboxEvent(trx, companyId, 'voucher.cancelled', { voucherId: id });

      const updated = await voucherRepository.findById(trx, companyId, id);
      if (!updated) throw new Error('Failed to retrieve updated voucher');
      return updated;
    });
  },

  // Reverse Voucher (Create opposite Journal offsetting ledger changes)
  async reverseVoucher(companyId: string, context: ClientContext, id: string, reason?: string): Promise<Voucher> {
    return db.transaction(async (trx) => {
      const voucher = await voucherRepository.findById(trx, companyId, id);
      if (!voucher) throw new Error('Voucher to reverse not found');
      if (voucher.status !== 'POSTED') throw new Error('Only posted vouchers can be reversed');

      // Create reversing entries (Invert Debits/Credits)
      const reversingEntries = voucher.entries.map(e => ({
        ledgerId: e.ledgerId,
        entryType: e.entryType === 'DEBIT' ? 'CREDIT' as const : 'DEBIT' as const,
        amount: e.amount,
        narration: `Reversal of ${voucher.voucherNumber}: ${reason || 'Correction'}`,
      }));

      // Post the reversing voucher
      const reversingVoucherInput: CreateVoucherInput = {
        date: new Date().toISOString().split('T')[0],
        voucherType: 'JOURNAL',
        narration: `Reversal entry offsetting voucher #${voucher.voucherNumber}. Reason: ${reason || 'N/A'}`,
        referenceNumber: voucher.voucherNumber,
        entries: reversingEntries,
      };

      const reversingVoucher = await this.createVoucher(
        companyId,
        context,
        reversingVoucherInput,
        'POSTED'
      );

      // Mark original voucher as REVERSED
      await voucherRepository.updateStatus(trx, companyId, id, 'REVERSED', context.userId);

      // Audit Trail
      await voucherRepository.insertAuditLog(trx, {
        company_id: companyId,
        user_id: context.userId,
        action: 'VOUCHER_REVERSE',
        entity_type: 'VOUCHER',
        entity_id: id,
        new_values: { status: 'REVERSED', linkedReversalVoucherId: reversingVoucher.id },
        reason: reason || 'Manual reversal entry',
        ip_address: context.ipAddress || null,
        user_agent: context.userAgent || null,
      });

      const updated = await voucherRepository.findById(trx, companyId, id);
      if (!updated) throw new Error('Failed to retrieve updated voucher');
      return updated;
    });
  },
};
