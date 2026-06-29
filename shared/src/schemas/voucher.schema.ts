import { z } from 'zod';

const voucherTypeSchema = z.enum(['CONTRA', 'PAYMENT', 'RECEIPT', 'JOURNAL', 'SALES', 'PURCHASE']);
const entryTypeSchema = z.enum(['DEBIT', 'CREDIT']);

export const voucherEntryInputSchema = z.object({
  ledgerId: z.string().uuid('Invalid ledger selection'),
  entryType: entryTypeSchema,
  amount: z.number().positive('Entry amount must be greater than zero'),
  narration: z.string().max(255).optional(),
});

export const stockMovementInputSchema = z.object({
  stockItemId: z.string().uuid('Invalid stock item selection'),
  qty: z.number().positive('Quantity must be greater than zero'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  amount: z.number().min(0, 'Amount cannot be negative'),
  cgstRate: z.number().min(0).max(100).optional().default(0),
  sgstRate: z.number().min(0).max(100).optional().default(0),
  igstRate: z.number().min(0).max(100).optional().default(0),
});

export const createVoucherSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  voucherType: voucherTypeSchema,
  narration: z.string().optional(),
  referenceNumber: z.string().optional(),
  entries: z.array(voucherEntryInputSchema).min(2, 'A voucher must contain at least 2 ledger entries (double-entry requirement)'),
  stockEntries: z.array(stockMovementInputSchema).optional(),
}).refine((data) => {
  // Validate double-entry balance: sum(debits) must equal sum(credits)
  let debitSum = 0;
  let creditSum = 0;

  data.entries.forEach(entry => {
    // Avoid floating-point arithmetic errors by converting to cents/fixed decimal format
    const amountCents = Math.round(entry.amount * 100);
    if (entry.entryType === 'DEBIT') {
      debitSum += amountCents;
    } else {
      creditSum += amountCents;
    }
  });

  return debitSum === creditSum;
}, {
  message: 'Double-entry transaction is unbalanced: total Debits must equal total Credits',
  path: ['entries'],
});

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
export type VoucherEntryInput = z.infer<typeof voucherEntryInputSchema>;
export type StockMovementInput = z.infer<typeof stockMovementInputSchema>;
