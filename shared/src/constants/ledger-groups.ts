// ============================================================
// Default Tally-style Ledger Group Hierarchy
// ============================================================
// Seeded automatically when a new company is created.
// is_system groups cannot be deleted or renamed by users.
// ============================================================

export interface DefaultLedgerGroup {
  name: string;
  nature: 'ASSETS' | 'LIABILITIES' | 'INCOME' | 'EXPENSE';
  parentName: string | null; // null = root group
  affectsGp: boolean; // Affects Gross Profit
  sequenceOrder: number;
}

export const DEFAULT_LEDGER_GROUPS: DefaultLedgerGroup[] = [
  // ── Balance Sheet: Assets ──────────────────────────────
  { name: 'Current Assets', nature: 'ASSETS', parentName: null, affectsGp: false, sequenceOrder: 1 },
  { name: 'Bank Accounts', nature: 'ASSETS', parentName: 'Current Assets', affectsGp: false, sequenceOrder: 2 },
  { name: 'Cash-in-Hand', nature: 'ASSETS', parentName: 'Current Assets', affectsGp: false, sequenceOrder: 3 },
  { name: 'Deposits (Asset)', nature: 'ASSETS', parentName: 'Current Assets', affectsGp: false, sequenceOrder: 4 },
  { name: 'Loans & Advances (Asset)', nature: 'ASSETS', parentName: 'Current Assets', affectsGp: false, sequenceOrder: 5 },
  { name: 'Stock-in-Hand', nature: 'ASSETS', parentName: 'Current Assets', affectsGp: false, sequenceOrder: 6 },
  { name: 'Sundry Debtors', nature: 'ASSETS', parentName: 'Current Assets', affectsGp: false, sequenceOrder: 7 },
  { name: 'Fixed Assets', nature: 'ASSETS', parentName: null, affectsGp: false, sequenceOrder: 8 },
  { name: 'Investments', nature: 'ASSETS', parentName: null, affectsGp: false, sequenceOrder: 9 },
  { name: 'Misc. Expenses (Asset)', nature: 'ASSETS', parentName: null, affectsGp: false, sequenceOrder: 10 },

  // ── Balance Sheet: Liabilities ──────────────────────────
  { name: 'Capital Account', nature: 'LIABILITIES', parentName: null, affectsGp: false, sequenceOrder: 11 },
  { name: 'Reserves & Surplus', nature: 'LIABILITIES', parentName: 'Capital Account', affectsGp: false, sequenceOrder: 12 },
  { name: 'Current Liabilities', nature: 'LIABILITIES', parentName: null, affectsGp: false, sequenceOrder: 13 },
  { name: 'Duties & Taxes', nature: 'LIABILITIES', parentName: 'Current Liabilities', affectsGp: false, sequenceOrder: 14 },
  { name: 'Provisions', nature: 'LIABILITIES', parentName: 'Current Liabilities', affectsGp: false, sequenceOrder: 15 },
  { name: 'Sundry Creditors', nature: 'LIABILITIES', parentName: 'Current Liabilities', affectsGp: false, sequenceOrder: 16 },
  { name: 'Loans (Liability)', nature: 'LIABILITIES', parentName: null, affectsGp: false, sequenceOrder: 17 },
  { name: 'Bank OD A/c', nature: 'LIABILITIES', parentName: 'Loans (Liability)', affectsGp: false, sequenceOrder: 18 },
  { name: 'Secured Loans', nature: 'LIABILITIES', parentName: 'Loans (Liability)', affectsGp: false, sequenceOrder: 19 },
  { name: 'Unsecured Loans', nature: 'LIABILITIES', parentName: 'Loans (Liability)', affectsGp: false, sequenceOrder: 20 },

  // ── P&L: Income ──────────────────────────────────────────
  { name: 'Sales Accounts', nature: 'INCOME', parentName: null, affectsGp: true, sequenceOrder: 21 },
  { name: 'Direct Incomes', nature: 'INCOME', parentName: null, affectsGp: true, sequenceOrder: 22 },
  { name: 'Indirect Incomes', nature: 'INCOME', parentName: null, affectsGp: false, sequenceOrder: 23 },

  // ── P&L: Expenses ────────────────────────────────────────
  { name: 'Purchase Accounts', nature: 'EXPENSE', parentName: null, affectsGp: true, sequenceOrder: 24 },
  { name: 'Direct Expenses', nature: 'EXPENSE', parentName: null, affectsGp: true, sequenceOrder: 25 },
  { name: 'Indirect Expenses', nature: 'EXPENSE', parentName: null, affectsGp: false, sequenceOrder: 26 },

  // ── Special ───────────────────────────────────────────────
  { name: 'Suspense Account', nature: 'LIABILITIES', parentName: null, affectsGp: false, sequenceOrder: 27 },
  { name: 'Branch / Divisions', nature: 'LIABILITIES', parentName: null, affectsGp: false, sequenceOrder: 28 },
];
