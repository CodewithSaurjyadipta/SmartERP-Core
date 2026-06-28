import { db } from '../../config/db';
import { StockGroup } from '@smarterp/shared';

// ============================================================
// Stock Group Repository — Database Access
// ============================================================

export function mapRowToStockGroup(row: any): StockGroup {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    parentId: row.parent_id,
    isActive: row.is_active,
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const stockGroupRepository = {
  async findAll(companyId: string): Promise<StockGroup[]> {
    const rows = await db('stock_groups')
      .where({ company_id: companyId })
      .andWhere('deleted_at', null)
      .orderBy('name', 'asc');
    
    return rows.map(mapRowToStockGroup);
  },

  async findById(companyId: string, id: string): Promise<StockGroup | null> {
    const row = await db('stock_groups')
      .where({ company_id: companyId, id })
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToStockGroup(row) : null;
  },

  async findByName(companyId: string, name: string): Promise<StockGroup | null> {
    const row = await db('stock_groups')
      .where({ company_id: companyId })
      .andWhereRaw('LOWER(name) = ?', [name.toLowerCase().trim()])
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToStockGroup(row) : null;
  },

  async create(
    companyId: string,
    userId: string,
    data: { name: string; parentId?: string | null }
  ): Promise<StockGroup> {
    const [row] = await db('stock_groups')
      .insert({
        company_id: companyId,
        name: data.name.trim(),
        parent_id: data.parentId || null,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      })
      .returning('*');

    return mapRowToStockGroup(row);
  },

  async update(
    companyId: string,
    userId: string,
    id: string,
    data: { name?: string; parentId?: string | null; isActive?: boolean }
  ): Promise<StockGroup | null> {
    const updatePayload: any = {
      updated_by: userId,
      updated_at: new Date(),
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.parentId !== undefined) updatePayload.parent_id = data.parentId || null;
    if (data.isActive !== undefined) updatePayload.is_active = data.isActive;

    const [row] = await db('stock_groups')
      .where({ company_id: companyId, id })
      .andWhere('deleted_at', null)
      .update(updatePayload)
      .returning('*');

    return row ? mapRowToStockGroup(row) : null;
  },

  async delete(companyId: string, userId: string, id: string): Promise<boolean> {
    const count = await db('stock_groups')
      .where({ company_id: companyId, id })
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
