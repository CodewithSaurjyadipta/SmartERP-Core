// ============================================================
// Company Types
// ============================================================

export interface Company {
  id: string;
  name: string;
  legalName: string | null;
  gstin: string | null;
  pan: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateCode: string | null;
  stateName: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  financialYearStart: string;
  booksFrom: string;
  baseCurrency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

import { CompanyRole } from './auth.types';

export interface FinancialYear {
  id: string;
  companyId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CompanyWithRole extends Company {
  role: CompanyRole;
}
