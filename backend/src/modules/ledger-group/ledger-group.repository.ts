import { db } from '../../config/db';
import { LedgerGroup } from '@smarterp/shared';

// ============================================================
// Ledger Group Repository
// ============================================================

export function mapRowToLedgerGroup(row: any): LedgerGroup {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    parentId: row.parent_id,
    nature: row.nature,
    isSystem: row.is_system,
    affectsGp: row.affects_gp,
    sequenceOrder: row.sequence_order,
    isActive: row.is_active,
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const ledgerGroupRepository = {
  async findAll(companyId: string): Promise<LedgerGroup[]> {
    const rows = await db('ledger_groups')
      .where({ company_id: companyId })
      .andWhere('deleted_at', null)
      .orderBy('sequence_order', 'asc')
      .orderBy('name', 'asc');
    
    return rows.map(mapRowToLedgerGroup);
  },

  async findById(companyId: string, id: string): Promise<LedgerGroup | null> {
    const row = await db('ledger_groups')
      .where({ company_id: companyId, id })
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToLedgerGroup(row) : null;
  },

  async findByName(companyId: string, name: string): Promise<LedgerGroup | null> {
    const row = await db('ledger_groups')
      .where({ company_id: companyId })
      .andWhereRaw('LOWER(name) = ?', [name.toLowerCase().trim()])
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToLedgerGroup(row) : null;
  },

  async create(
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
    const [row] = await db('ledger_groups')
      .insert({
        company_id: companyId,
        name: data.name.trim(),
        parent_id: data.parentId || null,
        nature: data.nature,
        is_system: false,
        affects_gp: data.affectsGp ?? false,
        sequence_order: data.sequenceOrder ?? 100,
        created_by: userId,
        updated_by: userId,
      })
      .returning('*');

    return mapRowToLedgerGroup(row);
  },

  async update(
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
  ): Promise<LedgerGroup | null> {
    const updatePayload: any = {
      updated_by: userId,
      updated_at: new Date(),
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.parentId !== undefined) updatePayload.parent_id = data.parentId || null;
    if (data.nature !== undefined) updatePayload.nature = data.nature;
    if (data.affectsGp !== undefined) updatePayload.affects_gp = data.affectsGp;
    if (data.sequenceOrder !== undefined) updatePayload.sequence_order = data.sequenceOrder;
    if (data.isActive !== undefined) updatePayload.is_active = data.isActive;

    const [row] = await db('ledger_groups')
      .where({ company_id: companyId, id, is_system: false }) // Prevent modifying system groups
      .andWhere('deleted_at', null)
      .update(updatePayload)
      .returning('*');

    return row ? mapRowToLedgerGroup(row) : null;
  },

  async delete(companyId: string, userId: string, id: string): Promise<boolean> {
    const count = await db('ledger_groups')
      .where({ company_id: companyId, id, is_system: false }) // Guard system groups
      .andWhere('deleted_at', null)
      .update({
        deleted_at: new Date(),
        is_active: false,
        updated_by: userId,
        updated_at: new Date(),
      });

    return count > 0;
  },
};
