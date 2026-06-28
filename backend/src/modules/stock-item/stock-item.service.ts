import { stockItemRepository } from './stock-item.repository';
import { stockGroupRepository } from '../stock-group/stock-group.repository';
import { unitRepository } from '../unit/unit.repository';
import { taxRateRepository } from '../tax-rate/tax-rate.repository';
import { StockItem } from '@smarterp/shared';
import { ApiError } from '../../utils/api-error';
import { db } from '../../config/db';

// ============================================================
// Stock Item Service
// ============================================================

export const stockItemService = {
  async getStockItems(companyId: string): Promise<any[]> {
    return stockItemRepository.findAll(companyId);
  },

  async getStockItemById(companyId: string, id: string): Promise<StockItem> {
    const item = await stockItemRepository.findById(companyId, id);
    if (!item) {
      throw ApiError.notFound('Stock item not found');
    }
    return item;
  },

  async createStockItem(
    companyId: string,
    userId: string,
    data: any
  ): Promise<StockItem> {
    // 1. Check duplicate name
    const existing = await stockItemRepository.findByName(companyId, data.name);
    if (existing) {
      throw ApiError.conflict(`Stock item "${data.name}" already exists`);
    }

    // 2. Validate group ID if provided
    if (data.stockGroupId) {
      const group = await stockGroupRepository.findById(companyId, data.stockGroupId);
      if (!group) {
        throw ApiError.badRequest('Selected stock category group does not exist');
      }
    }

    // 3. Validate unit ID if provided
    if (data.unitId) {
      const unit = await unitRepository.findById(companyId, data.unitId);
      if (!unit) {
        throw ApiError.badRequest('Selected unit of measurement does not exist');
      }
    }

    // 4. Validate tax rate ID if provided
    if (data.taxRateId) {
      const tax = await taxRateRepository.findById(companyId, data.taxRateId);
      if (!tax) {
        throw ApiError.badRequest('Selected GST tax rate slab does not exist');
      }
    }

    return stockItemRepository.create(companyId, userId, data);
  },

  async updateStockItem(
    companyId: string,
    userId: string,
    id: string,
    data: any
  ): Promise<StockItem> {
    const item = await stockItemRepository.findById(companyId, id);
    if (!item) {
      throw ApiError.notFound('Stock item not found');
    }

    if (data.name && data.name.toLowerCase().trim() !== item.name.toLowerCase()) {
      const existing = await stockItemRepository.findByName(companyId, data.name);
      if (existing) {
        throw ApiError.conflict(`Stock item "${data.name}" already exists`);
      }
    }

    if (data.stockGroupId && data.stockGroupId !== item.stockGroupId) {
      const group = await stockGroupRepository.findById(companyId, data.stockGroupId);
      if (!group) {
        throw ApiError.badRequest('Selected stock category group does not exist');
      }
    }

    if (data.unitId && data.unitId !== item.unitId) {
      const unit = await unitRepository.findById(companyId, data.unitId);
      if (!unit) {
        throw ApiError.badRequest('Selected unit of measurement does not exist');
      }
    }

    if (data.taxRateId && data.taxRateId !== item.taxRateId) {
      const tax = await taxRateRepository.findById(companyId, data.taxRateId);
      if (!tax) {
        throw ApiError.badRequest('Selected GST tax rate slab does not exist');
      }
    }

    const updated = await stockItemRepository.update(companyId, userId, id, data);
    if (!updated) {
      throw ApiError.notFound('Stock item not found or cannot be updated');
    }

    return updated;
  },

  async deleteStockItem(companyId: string, userId: string, id: string): Promise<void> {
    const item = await stockItemRepository.findById(companyId, id);
    if (!item) {
      throw ApiError.notFound('Stock item not found');
    }

    // Check dependency in inventory movements/voucher details (Phase 5/6)
    const hasMovements = await db('purchase_invoice_items') // placeholder table
      .where({ stock_item_id: id })
      .first()
      .catch(() => null);

    if (hasMovements) {
      throw ApiError.badRequest('Cannot delete stock item as it has historical stock movements or invoicing entries');
    }

    await stockItemRepository.delete(companyId, userId, id);
  },
};
