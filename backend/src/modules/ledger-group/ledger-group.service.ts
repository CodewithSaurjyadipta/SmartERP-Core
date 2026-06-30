import { ledgerGroupRepository, mapRowToLedgerGroup } from './ledger-group.repository';
import { LedgerGroup, LedgerGroupNode } from '@smarterp/shared';
import { ApiError } from '../../utils/api-error';
import { db } from '../../config/db';

// ============================================================
// Ledger Group Service
// ============================================================

export const ledgerGroupService = {
  async getGroups(companyId: string): Promise<LedgerGroup[]> {
    return ledgerGroupRepository.findAll(companyId);
  },

  async getGroupsTree(companyId: string): Promise<LedgerGroupNode[]> {
    const groups = await ledgerGroupRepository.findAll(companyId);
    
    // Builds hierarchical tree structure
    const buildTree = (parentId: string | null): LedgerGroupNode[] => {
      return groups
        .filter((g) => g.parentId === parentId)
        .map((g) => ({
          ...g,
          children: buildTree(g.id),
        }));
    };

    return buildTree(null);
  },

  async createGroup(
    companyId: string,
    userId: string,
    data: {
      name: string;
      parentId?: string | null;
      nature: 'ASSETS' | 'LIABILITIES' | 'INCOME' | 'EXPENSE';
      affectsGp?: boolean;
      sequenceOrder?: number;
    }
  ): Promise<LedgerGroup> {
    // 1. Check duplicate name including soft-deleted ones
    const existing = await db('ledger_groups')
      .where({ company_id: companyId })
      .andWhereRaw('LOWER(name) = ?', [data.name.toLowerCase().trim()])
      .first();

    if (existing) {
      if (existing.deleted_at === null) {
        throw ApiError.conflict(`Ledger group with name "${data.name}" already exists`);
      }

      // 2. Validate parent group if provided
      if (data.parentId) {
        const parent = await ledgerGroupRepository.findById(companyId, data.parentId);
        if (!parent) {
          throw ApiError.badRequest('Parent ledger group not found');
        }
      }

      // Self-heal restore soft-deleted group
      const [restored] = await db('ledger_groups')
        .where({ id: existing.id })
        .update({
          deleted_at: null,
          parent_id: data.parentId || null,
          nature: data.nature,
          is_active: true,
          affects_gp: data.affectsGp ?? false,
          sequence_order: data.sequenceOrder ?? 100,
          updated_by: userId,
          updated_at: new Date(),
        })
        .returning('*');

      return mapRowToLedgerGroup(restored);
    }

    // 2. Validate parent group if provided
    if (data.parentId) {
      const parent = await ledgerGroupRepository.findById(companyId, data.parentId);
      if (!parent) {
        throw ApiError.badRequest('Parent ledger group not found');
      }
    }

    return ledgerGroupRepository.create(companyId, userId, data);
  },

  async updateGroup(
    companyId: string,
    userId: string,
    id: string,
    data: {
      name?: string;
      parentId?: string | null;
      nature?: 'ASSETS' | 'LIABILITIES' | 'INCOME' | 'EXPENSE';
      affectsGp?: boolean;
      sequenceOrder?: number;
      isActive?: boolean;
    }
  ): Promise<LedgerGroup> {
    const group = await ledgerGroupRepository.findById(companyId, id);
    if (!group) {
      throw ApiError.notFound('Ledger group not found');
    }

    if (group.isSystem) {
      throw ApiError.forbidden('System-seeded ledger groups cannot be modified');
    }

    // Check duplicate name if changed
    if (data.name && data.name.toLowerCase().trim() !== group.name.toLowerCase()) {
      const existing = await ledgerGroupRepository.findByName(companyId, data.name);
      if (existing) {
        throw ApiError.conflict(`Ledger group with name "${data.name}" already exists`);
      }
    }

    // Validate parent group
    if (data.parentId) {
      if (data.parentId === id) {
        throw ApiError.badRequest('A group cannot be its own parent');
      }
      const parent = await ledgerGroupRepository.findById(companyId, data.parentId);
      if (!parent) {
        throw ApiError.badRequest('Parent ledger group not found');
      }
    }

    const updated = await ledgerGroupRepository.update(companyId, userId, id, data);
    if (!updated) {
      throw ApiError.notFound('Ledger group not found or cannot be updated');
    }

    return updated;
  },

  async deleteGroup(companyId: string, userId: string, id: string): Promise<void> {
    const group = await ledgerGroupRepository.findById(companyId, id);
    if (!group) {
      throw ApiError.notFound('Ledger group not found');
    }



    // Check for child groups
    const childGroups = await db('ledger_groups')
      .where({ company_id: companyId, parent_id: id })
      .andWhere('deleted_at', null)
      .first();
    if (childGroups) {
      throw ApiError.badRequest('Cannot delete group containing sub-groups');
    }

    // Check for associated ledgers
    const associatedLedgers = await db('ledgers')
      .where({ company_id: companyId, ledger_group_id: id })
      .andWhere('deleted_at', null)
      .first();
    if (associatedLedgers) {
      throw ApiError.badRequest('Cannot delete group containing active ledger accounts');
    }

    await ledgerGroupRepository.delete(companyId, userId, id);
  },
};
