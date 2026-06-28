import { stockGroupRepository } from './stock-group.repository';
import { StockGroup, StockGroupNode } from '@smarterp/shared';
import { ApiError } from '../../utils/api-error';
import { db } from '../../config/db';

// ============================================================
// Stock Group Service
// ============================================================

export const stockGroupService = {
  async getStockGroups(companyId: string): Promise<StockGroup[]> {
    return stockGroupRepository.findAll(companyId);
  },

  async getStockGroupsTree(companyId: string): Promise<StockGroupNode[]> {
    const groups = await stockGroupRepository.findAll(companyId);

    const buildTree = (parentId: string | null): StockGroupNode[] => {
      return groups
        .filter((g) => g.parentId === parentId)
        .map((g) => ({
          ...g,
          children: buildTree(g.id),
        }));
    };

    return buildTree(null);
  },

  async createStockGroup(
    companyId: string,
    userId: string,
    data: { name: string; parentId?: string | null }
  ): Promise<StockGroup> {
    // 1. Check duplicate name
    const existing = await stockGroupRepository.findByName(companyId, data.name);
    if (existing) {
      throw ApiError.conflict(`Stock category group "${data.name}" already exists`);
    }

    // 2. Validate parent if provided
    if (data.parentId) {
      const parent = await stockGroupRepository.findById(companyId, data.parentId);
      if (!parent) {
        throw ApiError.badRequest('Parent stock category group not found');
      }
    }

    return stockGroupRepository.create(companyId, userId, data);
  },

  async updateStockGroup(
    companyId: string,
    userId: string,
    id: string,
    data: { name?: string; parentId?: string | null; isActive?: boolean }
  ): Promise<StockGroup> {
    const group = await stockGroupRepository.findById(companyId, id);
    if (!group) {
      throw ApiError.notFound('Stock category group not found');
    }

    if (data.name && data.name.toLowerCase().trim() !== group.name.toLowerCase()) {
      const existing = await stockGroupRepository.findByName(companyId, data.name);
      if (existing) {
        throw ApiError.conflict(`Stock category group "${data.name}" already exists`);
      }
    }

    if (data.parentId) {
      if (data.parentId === id) {
        throw ApiError.badRequest('A stock group cannot be its own parent');
      }
      const parent = await stockGroupRepository.findById(companyId, data.parentId);
      if (!parent) {
        throw ApiError.badRequest('Parent stock category group not found');
      }
    }

    const updated = await stockGroupRepository.update(companyId, userId, id, data);
    if (!updated) {
      throw ApiError.notFound('Stock category group not found or cannot be updated');
    }

    return updated;
  },

  async deleteStockGroup(companyId: string, userId: string, id: string): Promise<void> {
    const group = await stockGroupRepository.findById(companyId, id);
    if (!group) {
      throw ApiError.notFound('Stock category group not found');
    }

    // Check sub-groups
    const hasChildren = await db('stock_groups')
      .where({ company_id: companyId, parent_id: id })
      .andWhere('deleted_at', null)
      .first();

    if (hasChildren) {
      throw ApiError.badRequest('Cannot delete stock group containing sub-groups');
    }

    // Check stock items
    const hasItems = await db('stock_items')
      .where({ company_id: companyId, stock_group_id: id })
      .andWhere('deleted_at', null)
      .first();

    if (hasItems) {
      throw ApiError.badRequest('Cannot delete stock group containing active stock items');
    }

    await stockGroupRepository.delete(companyId, userId, id);
  },
};
