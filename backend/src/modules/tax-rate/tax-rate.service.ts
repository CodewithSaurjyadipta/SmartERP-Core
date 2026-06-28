import { taxRateRepository } from './tax-rate.repository';
import { TaxRate } from '@smarterp/shared';
import { ApiError } from '../../utils/api-error';
import { db } from '../../config/db';

// ============================================================
// Tax Rate Service
// ============================================================

export const taxRateService = {
  async getTaxRates(companyId: string): Promise<TaxRate[]> {
    return taxRateRepository.findAll(companyId);
  },

  async getTaxRateById(companyId: string, id: string): Promise<TaxRate> {
    const taxRate = await taxRateRepository.findById(companyId, id);
    if (!taxRate) {
      throw ApiError.notFound('Tax rate not found');
    }
    return taxRate;
  },

  async createTaxRate(
    companyId: string,
    userId: string,
    data: {
      name: string;
      hsnSacCode?: string | null;
      taxType: 'GST' | 'EXEMPT' | 'NIL';
      cgstRate?: number;
      sgstRate?: number;
      igstRate?: number;
      cessRate?: number;
    }
  ): Promise<TaxRate> {
    // 1. Check duplicate name
    const existing = await taxRateRepository.findByName(companyId, data.name);
    if (existing) {
      throw ApiError.conflict(`Tax rate with name "${data.name}" already exists`);
    }

    return taxRateRepository.create(companyId, userId, data);
  },

  async updateTaxRate(
    companyId: string,
    userId: string,
    id: string,
    data: {
      name?: string;
      hsnSacCode?: string | null;
      taxType?: 'GST' | 'EXEMPT' | 'NIL';
      cgstRate?: number;
      sgstRate?: number;
      igstRate?: number;
      cessRate?: number;
      isActive?: boolean;
    }
  ): Promise<TaxRate> {
    const taxRate = await taxRateRepository.findById(companyId, id);
    if (!taxRate) {
      throw ApiError.notFound('Tax rate not found');
    }

    if (data.name && data.name.toLowerCase().trim() !== taxRate.name.toLowerCase()) {
      const existing = await taxRateRepository.findByName(companyId, data.name);
      if (existing) {
        throw ApiError.conflict(`Tax rate with name "${data.name}" already exists`);
      }
    }

    const updated = await taxRateRepository.update(companyId, userId, id, data);
    if (!updated) {
      throw ApiError.notFound('Tax rate not found or cannot be updated');
    }

    return updated;
  },

  async deleteTaxRate(companyId: string, userId: string, id: string): Promise<void> {
    const taxRate = await taxRateRepository.findById(companyId, id);
    if (!taxRate) {
      throw ApiError.notFound('Tax rate not found');
    }

    // Check for stock items referencing this tax rate
    const hasItems = await db('stock_items')
      .where({ company_id: companyId, tax_rate_id: id })
      .andWhere('deleted_at', null)
      .first();

    if (hasItems) {
      throw ApiError.badRequest('Cannot delete tax rate as it is linked to one or more stock items');
    }

    await taxRateRepository.delete(companyId, userId, id);
  },
};
