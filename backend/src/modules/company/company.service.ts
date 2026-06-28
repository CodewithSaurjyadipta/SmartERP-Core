import { db } from '../../config/db';
import { ApiError } from '../../utils/api-error';
import { companyRepository } from './company.repository';
import type { CompanyRow } from './company.types';
import { 
  DEFAULT_LEDGER_GROUPS, 
  GST_SLABS, 
  CreateCompanyInput, 
  UpdateCompanyInput, 
  Company, 
  CompanyWithRole 
} from '@smarterp/shared';

// ============================================================
// Company Service — Business Logic
// ============================================================

function toCompanyResponse(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    gstin: row.gstin,
    pan: row.pan,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    stateCode: row.state_code,
    stateName: row.state_name,
    pincode: row.pincode,
    phone: row.phone,
    email: row.email,
    website: row.website,
    financialYearStart: row.financial_year_start instanceof Date 
      ? row.financial_year_start.toISOString().split('T')[0]
      : String(row.financial_year_start),
    booksFrom: row.books_from instanceof Date
      ? row.books_from.toISOString().split('T')[0]
      : String(row.books_from),
    baseCurrency: row.base_currency,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const companyService = {
  async getCompaniesForUser(userId: string): Promise<CompanyWithRole[]> {
    const rows = await companyRepository.findUserCompanies(userId);
    return rows.map((row) => ({
      ...toCompanyResponse(row),
      role: row.role as any,
    }));
  },

  async getCompanyById(id: string): Promise<Company> {
    const company = await companyRepository.findCompanyById(id);
    if (!company) {
      throw ApiError.notFound('Company not found');
    }
    return toCompanyResponse(company);
  },

  async createCompany(userId: string, input: CreateCompanyInput): Promise<Company> {
    // 1. Start a database transaction for atomic seeding
    const company = await db.transaction(async (trx) => {
      // Create company record
      const start = new Date(input.financialYearStart);
      const books = new Date(input.booksFrom);

      const createdComp = await companyRepository.createCompany(trx, {
        name: input.name,
        legal_name: input.legalName,
        gstin: input.gstin,
        pan: input.pan,
        address_line1: input.addressLine1,
        address_line2: input.addressLine2,
        city: input.city,
        state_code: input.stateCode,
        state_name: input.stateName,
        pincode: input.pincode,
        phone: input.phone,
        email: input.email,
        website: input.website,
        financial_year_start: start,
        books_from: books,
        base_currency: input.baseCurrency || 'INR',
      });

      const companyId = createdComp.id;

      // Create owner association
      await companyRepository.createUserCompany(trx, {
        user_id: userId,
        company_id: companyId,
        role: 'OWNER',
      });

      // ── Seed 1: Financial Year ───────────────────────────
      const startYear = start.getFullYear();
      const endYear = startYear + 1;
      const fyName = `${startYear}-${endYear}`;
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      end.setDate(end.getDate() - 1); // e.g. April 1 to March 31

      await companyRepository.createFinancialYear(trx, {
        company_id: companyId,
        name: fyName,
        start_date: start,
        end_date: end,
      });

      // ── Seed 2: Ledger Groups (2-pass hierarchy) ─────────
      const nameToIdMap: Record<string, string> = {};

      // Pass 1: Insert root groups (parentName is null)
      const rootGroups = DEFAULT_LEDGER_GROUPS.filter((g) => g.parentName === null);
      const rootPayloads = rootGroups.map((g) => ({
        company_id: companyId,
        name: g.name,
        parent_id: null,
        nature: g.nature,
        is_system: true,
        affects_gp: g.affectsGp,
        sequence_order: g.sequenceOrder,
      }));

      const rootInserted = await companyRepository.bulkInsertLedgerGroups(trx, rootPayloads);
      rootInserted.forEach((item) => {
        nameToIdMap[item.name] = item.id;
      });

      // Pass 2: Insert child groups (parentName is not null)
      const childGroups = DEFAULT_LEDGER_GROUPS.filter((g) => g.parentName !== null);
      const childPayloads = childGroups.map((g) => {
        const parentId = nameToIdMap[g.parentName!];
        if (!parentId) {
          throw ApiError.internal(`Failed to find parent group "${g.parentName}" during seeding`);
        }
        return {
          company_id: companyId,
          name: g.name,
          parent_id: parentId,
          nature: g.nature,
          is_system: true,
          affects_gp: g.affectsGp,
          sequence_order: g.sequenceOrder,
        };
      });

      const childInserted = await companyRepository.bulkInsertLedgerGroups(trx, childPayloads);
      childInserted.forEach((item) => {
        nameToIdMap[item.name] = item.id;
      });

      // ── Seed 3: Default Ledgers ──────────────────────────
      // Tally default ledgers: Cash (under Cash-in-Hand) and P&L (under Reserves & Surplus)
      const cashGroupId = nameToIdMap['Cash-in-Hand'];
      const pnlGroupId = nameToIdMap['Reserves & Surplus'];

      if (cashGroupId) {
        await companyRepository.createLedger(trx, {
          company_id: companyId,
          name: 'Cash',
          ledger_group_id: cashGroupId,
          opening_balance: 0,
          opening_balance_type: 'DEBIT',
        });
      }

      if (pnlGroupId) {
        await companyRepository.createLedger(trx, {
          company_id: companyId,
          name: 'Profit & Loss A/c',
          ledger_group_id: pnlGroupId,
          opening_balance: 0,
          opening_balance_type: null,
        });
      }

      // ── Seed 4: Default Tax Rates (GST Slabs) ─────────────
      const taxRatesPayload = GST_SLABS.map((slab) => ({
        company_id: companyId,
        name: slab.name,
        tax_type: slab.rate === 0 ? 'EXEMPT' as const : 'GST' as const,
        cgst_rate: slab.cgst,
        sgst_rate: slab.sgst,
        igst_rate: slab.igst,
        cess_rate: 0,
      }));
      await companyRepository.bulkInsertTaxRates(trx, taxRatesPayload);

      // ── Seed 5: Default Units ────────────────────────────
      const defaultUnits = [
        { name: 'Pieces', symbol: 'PCS', decimal_places: 0 },
        { name: 'Kilograms', symbol: 'KG', decimal_places: 3 },
        { name: 'Litres', symbol: 'LTR', decimal_places: 3 },
        { name: 'Metres', symbol: 'MTR', decimal_places: 2 },
        { name: 'Boxes', symbol: 'BOX', decimal_places: 0 },
        { name: 'Numbers', symbol: 'NOS', decimal_places: 0 },
      ];
      const unitsPayload = defaultUnits.map((u) => ({
        company_id: companyId,
        name: u.name,
        symbol: u.symbol,
        decimal_places: u.decimal_places,
      }));
      await companyRepository.bulkInsertUnits(trx, unitsPayload);

      // ── Seed 6: Default Voucher Sequences ──────────────────
      const voucherTypes = [
        { type: 'SALES', prefix: 'SV-' },
        { type: 'PURCHASE', prefix: 'PV-' },
        { type: 'RECEIPT', prefix: 'RC-' },
        { type: 'PAYMENT', prefix: 'PM-' },
        { type: 'JOURNAL', prefix: 'JV-' },
        { type: 'CONTRA', prefix: 'CN-' },
        { type: 'CREDIT_NOTE', prefix: 'CR-' },
        { type: 'DEBIT_NOTE', prefix: 'DN-' },
      ];
      const sequencesPayload = voucherTypes.map((v) => ({
        company_id: companyId,
        voucher_type: v.type,
        financial_year: fyName,
        prefix: v.prefix,
        last_number: 0,
        padding: 5,
      }));
      await companyRepository.bulkInsertVoucherSequences(trx, sequencesPayload);

      return createdComp;
    });

    return toCompanyResponse(company);
  },

  async updateCompany(id: string, input: UpdateCompanyInput): Promise<Company> {
    const existing = await companyRepository.findCompanyById(id);
    if (!existing) {
      throw ApiError.notFound('Company not found');
    }

    const updated = await companyRepository.updateCompany(id, {
      name: input.name,
      legal_name: input.legalName,
      gstin: input.gstin,
      pan: input.pan,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2,
      city: input.city,
      state_code: input.stateCode,
      state_name: input.stateName,
      pincode: input.pincode,
      phone: input.phone,
      email: input.email,
      website: input.website,
    });

    return toCompanyResponse(updated);
  },
};
