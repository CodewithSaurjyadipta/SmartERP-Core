import { Knex } from 'knex';
import { db } from '../../config/db';
import type { CompanyRow, UserCompanyRow, FinancialYearRow } from './company.types';

// ============================================================
// Company Repository — Database Access
// ============================================================

export const companyRepository = {
  // ── Find / Read ──────────────────────────────────────────

  async findUserCompanies(
    userId: string
  ): Promise<Array<CompanyRow & { role: string }>> {
    // Joins user_companies with companies to return user's companies with their role
    const results = await db('companies')
      .join('user_companies', 'companies.id', 'user_companies.company_id')
      .where('user_companies.user_id', userId)
      .andWhere('companies.is_active', true)
      .select('companies.*', 'user_companies.role');
    
    return results;
  },

  async findCompanyById(id: string): Promise<CompanyRow | null> {
    const result = await db<CompanyRow>('companies')
      .where({ id })
      .first();
    return result ?? null;
  },

  async findUserCompany(
    userId: string,
    companyId: string
  ): Promise<UserCompanyRow | null> {
    const result = await db<UserCompanyRow>('user_companies')
      .where({ user_id: userId, company_id: companyId })
      .first();
    return result ?? null;
  },

  // ── Create (Inside Transactions) ─────────────────────────

  async createCompany(
    trx: Knex,
    data: {
      name: string;
      legal_name?: string | null;
      gstin?: string | null;
      pan?: string | null;
      address_line1?: string | null;
      address_line2?: string | null;
      city?: string | null;
      state_code?: string | null;
      state_name?: string | null;
      pincode?: string | null;
      phone?: string | null;
      email?: string | null;
      website?: string | null;
      financial_year_start: Date;
      books_from: Date;
      base_currency?: string;
    }
  ): Promise<CompanyRow> {
    const [company] = await trx<CompanyRow>('companies')
      .insert({
        name: data.name,
        legal_name: data.legal_name ?? null,
        gstin: data.gstin ?? null,
        pan: data.pan ?? null,
        address_line1: data.address_line1 ?? null,
        address_line2: data.address_line2 ?? null,
        city: data.city ?? null,
        state_code: data.state_code ?? null,
        state_name: data.state_name ?? null,
        pincode: data.pincode ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        website: data.website ?? null,
        financial_year_start: data.financial_year_start,
        books_from: data.books_from,
        base_currency: data.base_currency ?? 'INR',
      })
      .returning('*');
    return company;
  },

  async createUserCompany(
    trx: Knex,
    data: {
      user_id: string;
      company_id: string;
      role: 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
    }
  ): Promise<UserCompanyRow> {
    const [userCompany] = await trx<UserCompanyRow>('user_companies')
      .insert({
        user_id: data.user_id,
        company_id: data.company_id,
        role: data.role,
      })
      .returning('*');
    return userCompany;
  },

  async createFinancialYear(
    trx: Knex,
    data: {
      company_id: string;
      name: string;
      start_date: Date;
      end_date: Date;
    }
  ): Promise<FinancialYearRow> {
    const [financialYear] = await trx<FinancialYearRow>('financial_years')
      .insert({
        company_id: data.company_id,
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        is_active: true,
      })
      .returning('*');
    return financialYear;
  },

  // ── Update ───────────────────────────────────────────────

  async updateCompany(
    id: string,
    data: {
      name?: string;
      legal_name?: string | null;
      gstin?: string | null;
      pan?: string | null;
      address_line1?: string | null;
      address_line2?: string | null;
      city?: string | null;
      state_code?: string | null;
      state_name?: string | null;
      pincode?: string | null;
      phone?: string | null;
      email?: string | null;
      website?: string | null;
      is_active?: boolean;
    }
  ): Promise<CompanyRow> {
    const [company] = await db<CompanyRow>('companies')
      .where({ id })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');
    return company;
  },

  // ── Seeding Helpers (Inside Transactions) ──────────────────

  async bulkInsertLedgerGroups(
    trx: Knex,
    groups: Array<{
      company_id: string;
      name: string;
      parent_id: string | null;
      nature: 'ASSETS' | 'LIABILITIES' | 'INCOME' | 'EXPENSE';
      is_system: boolean;
      affects_gp: boolean;
      sequence_order: number;
    }>
  ): Promise<Array<{ id: string; name: string }>> {
    const inserted = await trx('ledger_groups')
      .insert(groups)
      .returning(['id', 'name']);
    return inserted;
  },

  async createLedger(
    trx: Knex,
    data: {
      company_id: string;
      name: string;
      ledger_group_id: string;
      opening_balance?: number;
      opening_balance_type?: 'DEBIT' | 'CREDIT' | null;
    }
  ): Promise<void> {
    await trx('ledgers').insert({
      company_id: data.company_id,
      name: data.name,
      ledger_group_id: data.ledger_group_id,
      opening_balance: data.opening_balance ?? 0,
      opening_balance_type: data.opening_balance_type ?? null,
      is_active: true,
    });
  },

  async bulkInsertTaxRates(
    trx: Knex,
    taxRates: Array<{
      company_id: string;
      name: string;
      tax_type: 'GST' | 'EXEMPT' | 'NIL';
      cgst_rate: number;
      sgst_rate: number;
      igst_rate: number;
      cess_rate: number;
    }>
  ): Promise<void> {
    await trx('tax_rates').insert(taxRates);
  },

  async bulkInsertUnits(
    trx: Knex,
    units: Array<{
      company_id: string;
      name: string;
      symbol: string;
      decimal_places: number;
    }>
  ): Promise<void> {
    await trx('units').insert(units);
  },

  async bulkInsertVoucherSequences(
    trx: Knex,
    sequences: Array<{
      company_id: string;
      voucher_type: string;
      financial_year: string;
      prefix: string;
      last_number: number;
      padding: number;
    }>
  ): Promise<void> {
    await trx('voucher_sequences').insert(sequences);
  },
};
