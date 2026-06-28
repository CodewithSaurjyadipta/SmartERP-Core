// ============================================================
// Company Module Types
// ============================================================

export interface CompanyRow {
  id: string;
  name: string;
  legal_name: string | null;
  gstin: string | null;
  pan: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_code: string | null;
  state_name: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  financial_year_start: Date;
  books_from: Date;
  base_currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserCompanyRow {
  id: string;
  user_id: string;
  company_id: string;
  role: 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
  created_at: Date;
}

export interface FinancialYearRow {
  id: string;
  company_id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  created_at: Date;
}
