// ============================================================
// Ledger & Party Type Definitions
// ============================================================

export interface LedgerGroup {
  id: string;
  companyId: string;
  name: string;
  parentId: string | null;
  nature: 'ASSETS' | 'LIABILITIES' | 'INCOME' | 'EXPENSE';
  isSystem: boolean;
  affectsGp: boolean;
  sequenceOrder: number;
  isActive: boolean;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Recursive tree node for representing ledger chart of accounts */
export interface LedgerGroupNode extends LedgerGroup {
  children: LedgerGroupNode[];
}

export interface Ledger {
  id: string;
  companyId: string;
  name: string;
  ledgerGroupId: string;
  openingBalance: number;
  openingBalanceType: 'DEBIT' | 'CREDIT' | null;
  
  // Contact / Party profile details
  contactName: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  pan: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateCode: string | null;
  stateName: string | null;
  pincode: string | null;
  gstRegistrationType: 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED' | 'CONSUMER' | null;
  
  // Audit & Soft Delete
  isActive: boolean;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Customers & Suppliers map exactly to Ledgers in Tally
export type Customer = Ledger;
export type Supplier = Ledger;
