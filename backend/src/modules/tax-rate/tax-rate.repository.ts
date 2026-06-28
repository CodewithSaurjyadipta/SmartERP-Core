import { db } from '../../config/db';
import { TaxRate } from '@smarterp/shared';

// ============================================================
// Tax Rate Repository — Database Access
// ============================================================

export function mapRowToTaxRate(row: any): TaxRate {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    hsnSacCode: row.hsn_sac_code ?? null,
    taxType: row.tax_type,
    cgstRate: Number(row.cgst_rate || 0),
    sgstRate: Number(row.sgst_rate || 0),
    igstRate: Number(row.igst_rate || 0),
    cessRate: Number(row.cess_rate || 0),
    isActive: row.is_active,
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const taxRateRepository = {
  async findAll(companyId: string): Promise<TaxRate[]> {
    const rows = await db('tax_rates')
      .where({ company_id: companyId })
      .andWhere('deleted_at', null)
      .orderBy('name', 'asc');
    
    return rows.map(mapRowToTaxRate);
  },

  async findById(companyId: string, id: string): Promise<TaxRate | null> {
    const row = await db('tax_rates')
      .where({ company_id: companyId, id })
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToTaxRate(row) : null;
  },

  async findByName(companyId: string, name: string): Promise<TaxRate | null> {
    const row = await db('tax_rates')
      .where({ company_id: companyId })
      .andWhereRaw('LOWER(name) = ?', [name.toLowerCase().trim()])
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToTaxRate(row) : null;
  },

  async create(
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
    const [row] = await db('tax_rates')
      .insert({
        company_id: companyId,
        name: data.name.trim(),
        hsn_sac_code: data.hsnSacCode || null,
        tax_type: data.taxType,
        cgst_rate: data.cgstRate ?? 0,
        sgst_rate: data.sgstRate ?? 0,
        igst_rate: data.igstRate ?? 0,
        cess_rate: data.cessRate ?? 0,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      })
      .returning('*');

    return mapRowToTaxRate(row);
  },

  async update(
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
  ): Promise<TaxRate | null> {
    const updatePayload: any = {
      updated_by: userId,
      updated_at: new Date(),
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.hsnSacCode !== undefined) updatePayload.hsn_sac_code = data.hsnSacCode || null;
    if (data.taxType !== undefined) updatePayload.tax_type = data.taxType;
    if (data.cgstRate !== undefined) updatePayload.cgst_rate = data.cgstRate;
    if (data.sgstRate !== undefined) updatePayload.sgst_rate = data.sgstRate;
    if (data.igstRate !== undefined) updatePayload.igst_rate = data.igstRate;
    if (data.cessRate !== undefined) updatePayload.cess_rate = data.cessRate;
    if (data.isActive !== undefined) updatePayload.is_active = data.isActive;

    const [row] = await db('tax_rates')
      .where({ company_id: companyId, id })
      .andWhere('deleted_at', null)
      .update(updatePayload)
      .returning('*');

    return row ? mapRowToTaxRate(row) : null;
  },

  async delete(companyId: string, userId: string, id: string): Promise<boolean> {
    const count = await db('tax_rates')
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
