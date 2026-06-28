import { unitRepository } from './unit.repository';
import { Unit } from '@smarterp/shared';
import { ApiError } from '../../utils/api-error';
import { db } from '../../config/db';

// ============================================================
// Unit Service
// ============================================================

export const unitService = {
  async getUnits(companyId: string): Promise<Unit[]> {
    return unitRepository.findAll(companyId);
  },

  async getUnitById(companyId: string, id: string): Promise<Unit> {
    const unit = await unitRepository.findById(companyId, id);
    if (!unit) {
      throw ApiError.notFound('Unit of measurement not found');
    }
    return unit;
  },

  async createUnit(
    companyId: string,
    userId: string,
    data: { name: string; symbol: string; decimalPlaces?: number }
  ): Promise<Unit> {
    // Check duplicate symbol
    const existing = await unitRepository.findBySymbol(companyId, data.symbol);
    if (existing) {
      throw ApiError.conflict(`Unit symbol "${data.symbol}" already exists`);
    }

    return unitRepository.create(companyId, userId, data);
  },

  async updateUnit(
    companyId: string,
    userId: string,
    id: string,
    data: { name?: string; symbol?: string; decimalPlaces?: number; isActive?: boolean }
  ): Promise<Unit> {
    const unit = await unitRepository.findById(companyId, id);
    if (!unit) {
      throw ApiError.notFound('Unit of measurement not found');
    }

    if (data.symbol && data.symbol.toLowerCase().trim() !== unit.symbol.toLowerCase()) {
      const existing = await unitRepository.findBySymbol(companyId, data.symbol);
      if (existing) {
        throw ApiError.conflict(`Unit symbol "${data.symbol}" already exists`);
      }
    }

    const updated = await unitRepository.update(companyId, userId, id, data);
    if (!updated) {
      throw ApiError.notFound('Unit of measurement not found or cannot be updated');
    }

    return updated;
  },

  async deleteUnit(companyId: string, userId: string, id: string): Promise<void> {
    const unit = await unitRepository.findById(companyId, id);
    if (!unit) {
      throw ApiError.notFound('Unit of measurement not found');
    }

    // Check for stock items referencing this unit
    const hasItems = await db('stock_items')
      .where({ company_id: companyId, unit_id: id })
      .andWhere('deleted_at', null)
      .first();

    if (hasItems) {
      throw ApiError.badRequest('Cannot delete unit as it is linked to one or more stock items');
    }

    await unitRepository.delete(companyId, userId, id);
  },
};
