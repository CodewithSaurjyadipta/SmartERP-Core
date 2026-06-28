import { db } from '../../config/db';
import { Unit } from '@smarterp/shared';

// ============================================================
// Unit Repository — Database Access
// ============================================================

export function mapRowToUnit(row: any): Unit {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    symbol: row.symbol,
    decimalPlaces: Number(row.decimal_places || 0),
    isActive: row.is_active,
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export const unitRepository = {
  async findAll(companyId: string): Promise<Unit[]> {
    const rows = await db('units')
      .where({ company_id: companyId })
      .andWhere('deleted_at', null)
      .orderBy('symbol', 'asc');
    
    return rows.map(mapRowToUnit);
  },

  async findById(companyId: string, id: string): Promise<Unit | null> {
    const row = await db('units')
      .where({ company_id: companyId, id })
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToUnit(row) : null;
  },

  async findBySymbol(companyId: string, symbol: string): Promise<Unit | null> {
    const row = await db('units')
      .where({ company_id: companyId })
      .andWhereRaw('LOWER(symbol) = ?', [symbol.toLowerCase().trim()])
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToUnit(row) : null;
  },

  async create(
    companyId: string,
    userId: string,
    data: { name: string; symbol: string; decimalPlaces?: number }
  ): Promise<Unit> {
    const [row] = await db('units')
      .insert({
        company_id: companyId,
        name: data.name.trim(),
        symbol: data.symbol.trim().toUpperCase(),
        decimal_places: data.decimalPlaces ?? 0,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      })
      .returning('*');

    return mapRowToUnit(row);
  },

  async update(
    companyId: string,
    userId: string,
    id: string,
    data: { name?: string; symbol?: string; decimalPlaces?: number; isActive?: boolean }
  ): Promise<Unit | null> {
    const updatePayload: any = {
      updated_by: userId,
      updated_at: new Date(),
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.symbol !== undefined) updatePayload.symbol = data.symbol.trim().toUpperCase();
    if (data.decimalPlaces !== undefined) updatePayload.decimal_places = data.decimalPlaces;
    if (data.isActive !== undefined) updatePayload.is_active = data.isActive;

    const [row] = await db('units')
      .where({ company_id: companyId, id })
      .andWhere('deleted_at', null)
      .update(updatePayload)
      .returning('*');

    return row ? mapRowToUnit(row) : null;
  },

  async delete(companyId: string, userId: string, id: string): Promise<boolean> {
    const count = await db('units')
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
