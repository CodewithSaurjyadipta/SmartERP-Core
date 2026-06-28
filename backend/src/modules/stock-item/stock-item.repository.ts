import { db } from '../../config/db';
import { StockItem } from '@smarterp/shared';

// ============================================================
// Stock Item Repository — Database Access
// ============================================================

export function mapRowToStockItem(row: any): StockItem {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    stockGroupId: row.stock_group_id ?? null,
    unitId: row.unit_id ?? null,
    taxRateId: row.tax_rate_id ?? null,
    hsnCode: row.hsn_code ?? null,
    
    openingQty: Number(row.opening_qty || 0),
    openingRate: Number(row.opening_rate || 0),
    openingValue: Number(row.opening_value || 0),
    
    standardSellingPrice: row.standard_selling_price ? Number(row.standard_selling_price) : null,
    standardPurchasePrice: row.standard_purchase_price ? Number(row.standard_purchase_price) : null,
    mrp: row.mrp ? Number(row.mrp) : null,
    
    reorderLevel: Number(row.reorder_level || 0),
    minimumQty: Number(row.minimum_qty || 0),
    
    isActive: row.is_active,
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const stockItemRepository = {
  async findAll(companyId: string): Promise<any[]> {
    // Join units, tax_rates, stock_groups to return readable items
    const rows = await db('stock_items')
      .leftJoin('units', 'stock_items.unit_id', 'units.id')
      .leftJoin('tax_rates', 'stock_items.tax_rate_id', 'tax_rates.id')
      .leftJoin('stock_groups', 'stock_items.stock_group_id', 'stock_groups.id')
      .where('stock_items.company_id', companyId)
      .andWhere('stock_items.deleted_at', null)
      .select(
        'stock_items.*',
        'units.symbol as unit_symbol',
        'units.name as unit_name',
        'tax_rates.name as tax_rate_name',
        'tax_rates.cgst_rate',
        'tax_rates.sgst_rate',
        'tax_rates.igst_rate',
        'stock_groups.name as stock_group_name'
      )
      .orderBy('stock_items.name', 'asc');

    return rows.map((row) => ({
      ...mapRowToStockItem(row),
      unitSymbol: row.unit_symbol,
      unitName: row.unit_name,
      taxRateName: row.tax_rate_name,
      cgstRate: row.cgst_rate ? Number(row.cgst_rate) : null,
      sgstRate: row.sgst_rate ? Number(row.sgst_rate) : null,
      igstRate: row.igst_rate ? Number(row.igst_rate) : null,
      stockGroupName: row.stock_group_name,
    }));
  },

  async findById(companyId: string, id: string): Promise<StockItem | null> {
    const row = await db('stock_items')
      .where({ company_id: companyId, id })
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToStockItem(row) : null;
  },

  async findByName(companyId: string, name: string): Promise<StockItem | null> {
    const row = await db('stock_items')
      .where({ company_id: companyId })
      .andWhereRaw('LOWER(name) = ?', [name.toLowerCase().trim()])
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToStockItem(row) : null;
  },

  async create(
    companyId: string,
    userId: string,
    data: any
  ): Promise<StockItem> {
    const [row] = await db('stock_items')
      .insert({
        company_id: companyId,
        name: data.name.trim(),
        stock_group_id: data.stockGroupId || null,
        unit_id: data.unitId || null,
        tax_rate_id: data.taxRateId || null,
        hsn_code: data.hsnCode || null,
        
        opening_qty: data.openingQty ?? 0,
        opening_rate: data.openingRate ?? 0,
        opening_value: data.openingValue ?? 0,
        
        standard_selling_price: data.standardSellingPrice || null,
        standard_purchase_price: data.standardPurchasePrice || null,
        mrp: data.mrp || null,
        
        reorder_level: data.reorderLevel ?? 0,
        minimum_qty: data.minimumQty ?? 0,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      })
      .returning('*');

    return mapRowToStockItem(row);
  },

  async update(
    companyId: string,
    userId: string,
    id: string,
    data: any
  ): Promise<StockItem | null> {
    const updatePayload: any = {
      updated_by: userId,
      updated_at: new Date(),
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.stockGroupId !== undefined) updatePayload.stock_group_id = data.stockGroupId || null;
    if (data.unitId !== undefined) updatePayload.unit_id = data.unitId || null;
    if (data.taxRateId !== undefined) updatePayload.tax_rate_id = data.taxRateId || null;
    if (data.hsnCode !== undefined) updatePayload.hsn_code = data.hsnCode || null;
    if (data.openingQty !== undefined) updatePayload.opening_qty = data.openingQty;
    if (data.openingRate !== undefined) updatePayload.opening_rate = data.openingRate;
    if (data.openingValue !== undefined) updatePayload.opening_value = data.openingValue;
    if (data.standardSellingPrice !== undefined) updatePayload.standard_selling_price = data.standardSellingPrice || null;
    if (data.standardPurchasePrice !== undefined) updatePayload.standard_purchase_price = data.standardPurchasePrice || null;
    if (data.mrp !== undefined) updatePayload.mrp = data.mrp || null;
    if (data.reorderLevel !== undefined) updatePayload.reorder_level = data.reorderLevel;
    if (data.minimumQty !== undefined) updatePayload.minimum_qty = data.minimumQty;
    if (data.isActive !== undefined) updatePayload.is_active = data.isActive;

    const [row] = await db('stock_items')
      .where({ company_id: companyId, id })
      .andWhere('deleted_at', null)
      .update(updatePayload)
      .returning('*');

    return row ? mapRowToStockItem(row) : null;
  },

  async delete(companyId: string, userId: string, id: string): Promise<boolean> {
    const count = await db('stock_items')
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
