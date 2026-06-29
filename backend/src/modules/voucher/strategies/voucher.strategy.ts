import { CreateVoucherInput, VoucherEntryInput } from '@smarterp/shared';
import { Knex } from 'knex';

export interface VoucherStrategy {
  validate(trx: Knex.Transaction, companyId: string, data: CreateVoucherInput): Promise<void>;
}

// Helper to load ledger details with their group natures and names
async function getLedgerDetails(
  trx: Knex.Transaction,
  companyId: string,
  ledgerIds: string[]
): Promise<Array<{ id: string; name: string; groupName: string; nature: string }>> {
  return trx('ledgers')
    .join('ledger_groups', 'ledgers.ledger_group_id', 'ledger_groups.id')
    .where('ledgers.company_id', companyId)
    .whereIn('ledgers.id', ledgerIds)
    .select(
      'ledgers.id',
      'ledgers.name',
      'ledger_groups.name as groupName',
      'ledger_groups.nature'
    );
}

// 1. Contra Voucher Strategy (F4)
// Rules: Only cash-in-hand or bank accounts allowed on both debit and credit sides.
export class ContraVoucherStrategy implements VoucherStrategy {
  async validate(trx: Knex.Transaction, companyId: string, data: CreateVoucherInput): Promise<void> {
    const ledgerIds = data.entries.map(e => e.ledgerId);
    const ledgers = await getLedgerDetails(trx, companyId, ledgerIds);
    
    for (const l of ledgers) {
      const allowed = ['Cash-in-Hand', 'Bank Accounts', 'Bank OD A/c'].includes(l.groupName);
      if (!allowed) {
        throw new Error(`Contra voucher only allows Cash or Bank ledgers. Invalid ledger: "${l.name}" (Group: ${l.groupName})`);
      }
    }
    
    if (data.stockEntries && data.stockEntries.length > 0) {
      throw new Error('Contra vouchers cannot contain stock movement entries.');
    }
  }
}

// 2. Payment Voucher Strategy (F5)
// Rules: At least one of the credit entries must be a Cash or Bank account.
export class PaymentVoucherStrategy implements VoucherStrategy {
  async validate(trx: Knex.Transaction, companyId: string, data: CreateVoucherInput): Promise<void> {
    const creditEntries = data.entries.filter(e => e.entryType === 'CREDIT');
    const creditLedgerIds = creditEntries.map(e => e.ledgerId);
    
    const ledgers = await getLedgerDetails(trx, companyId, creditLedgerIds);
    const hasCashOrBankSource = ledgers.some(l => 
      ['Cash-in-Hand', 'Bank Accounts', 'Bank OD A/c'].includes(l.groupName)
    );
    
    if (!hasCashOrBankSource) {
      throw new Error('Payment voucher requires a Cash or Bank ledger as the source (Credit side).');
    }
  }
}

// 3. Receipt Voucher Strategy (F6)
// Rules: At least one of the debit entries must be a Cash or Bank account.
export class ReceiptVoucherStrategy implements VoucherStrategy {
  async validate(trx: Knex.Transaction, companyId: string, data: CreateVoucherInput): Promise<void> {
    const debitEntries = data.entries.filter(e => e.entryType === 'DEBIT');
    const debitLedgerIds = debitEntries.map(e => e.ledgerId);
    
    const ledgers = await getLedgerDetails(trx, companyId, debitLedgerIds);
    const hasCashOrBankDest = ledgers.some(l => 
      ['Cash-in-Hand', 'Bank Accounts', 'Bank OD A/c'].includes(l.groupName)
    );
    
    if (!hasCashOrBankDest) {
      throw new Error('Receipt voucher requires a Cash or Bank ledger as the destination (Debit side).');
    }
  }
}

// 4. Journal Voucher Strategy (F7)
// Rules: Standard adjustments. Prohibits stock movements.
export class JournalVoucherStrategy implements VoucherStrategy {
  async validate(trx: Knex.Transaction, companyId: string, data: CreateVoucherInput): Promise<void> {
    if (data.stockEntries && data.stockEntries.length > 0) {
      throw new Error('Journal vouchers cannot contain stock movement entries.');
    }
  }
}

// 5. Sales Voucher Strategy (F8)
// Rules: Requires stock movements (if inventory items are linked), and a sales ledger credit / debtor debit.
export class SalesVoucherStrategy implements VoucherStrategy {
  async validate(trx: Knex.Transaction, companyId: string, data: CreateVoucherInput): Promise<void> {
    // Validate that stock items exist if stock entries are defined
    if (data.stockEntries && data.stockEntries.length > 0) {
      const stockItemIds = data.stockEntries.map(s => s.stockItemId);
      const itemsCount = await trx('stock_items')
        .where('company_id', companyId)
        .whereIn('id', stockItemIds)
        .count('id as cnt')
        .first();
        
      if (Number(itemsCount?.cnt || 0) !== stockItemIds.length) {
        throw new Error('One or more selected stock items are invalid or do not exist.');
      }
    }
    
    // Check that at least one sales ledger is credited
    const creditEntries = data.entries.filter(e => e.entryType === 'CREDIT');
    const creditLedgerIds = creditEntries.map(e => e.ledgerId);
    const creditLedgers = await getLedgerDetails(trx, companyId, creditLedgerIds);
    
    const hasSalesLedgerCredit = creditLedgers.some(l => 
      l.groupName.includes('Sales') || l.nature === 'INCOME'
    );
    
    if (!hasSalesLedgerCredit) {
      throw new Error('Sales voucher requires at least one Sales or Income account on the Credit side.');
    }
  }
}

// 6. Purchase Voucher Strategy (F9)
// Rules: Requires stock movements (if inventory items are linked), and a purchase ledger debit / creditor credit.
export class PurchaseVoucherStrategy implements VoucherStrategy {
  async validate(trx: Knex.Transaction, companyId: string, data: CreateVoucherInput): Promise<void> {
    // Validate stock items
    if (data.stockEntries && data.stockEntries.length > 0) {
      const stockItemIds = data.stockEntries.map(s => s.stockItemId);
      const itemsCount = await trx('stock_items')
        .where('company_id', companyId)
        .whereIn('id', stockItemIds)
        .count('id as cnt')
        .first();
        
      if (Number(itemsCount?.cnt || 0) !== stockItemIds.length) {
        throw new Error('One or more selected stock items are invalid or do not exist.');
      }
    }
    
    // Check that at least one purchase ledger is debited
    const debitEntries = data.entries.filter(e => e.entryType === 'DEBIT');
    const debitLedgerIds = debitEntries.map(e => e.ledgerId);
    const debitLedgers = await getLedgerDetails(trx, companyId, debitLedgerIds);
    
    const hasPurchaseLedgerDebit = debitLedgers.some(l => 
      l.groupName.includes('Purchase') || l.nature === 'EXPENSE'
    );
    
    if (!hasPurchaseLedgerDebit) {
      throw new Error('Purchase voucher requires at least one Purchase or Expense account on the Debit side.');
    }
  }
}

// Strategy Registry
export class VoucherStrategyRegistry {
  private static strategies: Record<string, VoucherStrategy> = {
    CONTRA: new ContraVoucherStrategy(),
    PAYMENT: new PaymentVoucherStrategy(),
    RECEIPT: new ReceiptVoucherStrategy(),
    JOURNAL: new JournalVoucherStrategy(),
    SALES: new SalesVoucherStrategy(),
    PURCHASE: new PurchaseVoucherStrategy(),
  };

  static get(type: string): VoucherStrategy {
    const strategy = this.strategies[type];
    if (!strategy) {
      throw new Error(`Unsupported voucher type strategy: "${type}"`);
    }
    return strategy;
  }
}
