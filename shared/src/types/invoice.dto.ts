// ============================================================
// Invoice DTO Type Definitions
// ============================================================

export interface InvoiceParty {
  name: string;
  legalName?: string | null;
  gstin?: string | null;
  pan?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateCode?: string | null;
  stateName?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface InvoiceLineItem {
  serialNumber: number;
  itemName: string;
  hsnCode?: string | null;
  qty: number;
  unitSymbol?: string | null;
  rate: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  netAmount: number;
}

export interface InvoiceTaxSummary {
  hsnCode: string;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTaxAmount: number;
}

export interface InvoiceBankDetails {
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  branchName?: string | null;
}

export interface InvoiceDto {
  voucherId: string;
  voucherNumber: string;
  voucherType: 'SALES' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT' | 'JOURNAL' | 'CONTRA';
  status: 'DRAFT' | 'POSTED' | 'CANCELLED' | 'REVERSED';
  date: string;
  referenceNumber?: string | null;
  narration?: string | null;
  
  supplier: InvoiceParty;
  recipient: InvoiceParty;
  
  lineItems: InvoiceLineItem[];
  taxSummary: InvoiceTaxSummary[];
  
  taxableSubtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  grandTotal: number;
  amountInWords: string;
  
  bankDetails?: InvoiceBankDetails | null;
  
  // Security Placeholders
  qrCodeContent?: string | null;
  digitalSignature?: string | null;
}
