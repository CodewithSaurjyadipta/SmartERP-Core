import { z } from 'zod';

// ============================================================
// Invoice DTO Zod Validation Schema
// ============================================================

export const invoicePartySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  legalName: z.string().nullable().optional(),
  gstin: z.string().max(15).nullable().optional(),
  pan: z.string().max(10).nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  stateCode: z.string().length(2).nullable().optional(),
  stateName: z.string().nullable().optional(),
  pincode: z.string().max(6).nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
});

export const invoiceLineItemSchema = z.object({
  serialNumber: z.number().int().positive(),
  itemName: z.string().min(1, 'Item name is required'),
  hsnCode: z.string().nullable().optional(),
  qty: z.number().positive('Quantity must be greater than zero'),
  unitSymbol: z.string().nullable().optional(),
  rate: z.number().nonnegative('Rate cannot be negative'),
  taxableValue: z.number().nonnegative(),
  cgstRate: z.number().nonnegative(),
  cgstAmount: z.number().nonnegative(),
  sgstRate: z.number().nonnegative(),
  sgstAmount: z.number().nonnegative(),
  igstRate: z.number().nonnegative(),
  igstAmount: z.number().nonnegative(),
  netAmount: z.number().nonnegative(),
});

export const invoiceTaxSummarySchema = z.object({
  hsnCode: z.string(),
  taxableValue: z.number().nonnegative(),
  cgstRate: z.number().nonnegative(),
  cgstAmount: z.number().nonnegative(),
  sgstRate: z.number().nonnegative(),
  sgstAmount: z.number().nonnegative(),
  igstRate: z.number().nonnegative(),
  igstAmount: z.number().nonnegative(),
  totalTaxAmount: z.number().nonnegative(),
});

export const invoiceBankDetailsSchema = z.object({
  bankName: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  ifscCode: z.string().nullable().optional(),
  branchName: z.string().nullable().optional(),
});

export const invoiceDtoSchema = z.object({
  voucherId: z.string().uuid(),
  voucherNumber: z.string().min(1),
  voucherType: z.enum(['SALES', 'PURCHASE', 'RECEIPT', 'PAYMENT', 'JOURNAL', 'CONTRA']),
  status: z.enum(['DRAFT', 'POSTED', 'CANCELLED', 'REVERSED']),
  date: z.string(),
  referenceNumber: z.string().nullable().optional(),
  narration: z.string().nullable().optional(),
  
  supplier: invoicePartySchema,
  recipient: invoicePartySchema,
  
  lineItems: z.array(invoiceLineItemSchema),
  taxSummary: z.array(invoiceTaxSummarySchema),
  
  taxableSubtotal: z.number().nonnegative(),
  cgstTotal: z.number().nonnegative(),
  sgstTotal: z.number().nonnegative(),
  igstTotal: z.number().nonnegative(),
  taxTotal: z.number().nonnegative(),
  grandTotal: z.number().nonnegative(),
  amountInWords: z.string().min(1),
  
  bankDetails: invoiceBankDetailsSchema.nullable().optional(),
  
  qrCodeContent: z.string().nullable().optional(),
  digitalSignature: z.string().nullable().optional(),
});
