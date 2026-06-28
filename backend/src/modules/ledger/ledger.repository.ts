import { db } from '../../config/db';
import { Ledger } from '@smarterp/shared';

// ============================================================
// Ledger Repository — Database Access
// ============================================================

export function mapRowToLedger(row: any): Ledger {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    ledgerGroupId: row.ledger_group_id,
    openingBalance: Number(row.opening_balance || 0),
    openingBalanceType: row.opening_balance_type,
    contactName: row.contact_name ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    gstin: row.gstin ?? null,
    pan: row.pan ?? null,
    addressLine1: row.address_line1 ?? null,
    addressLine2: row.address_line2 ?? null,
    city: row.city ?? null,
    stateCode: row.state_code ?? null,
    stateName: row.state_name ?? null,
    pincode: row.pincode ?? null,
    gstRegistrationType: row.gst_registration_type ?? null,
    isActive: row.is_active,
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const ledgerRepository = {
  async findAll(
    companyId: string,
    filters?: { ledgerGroupId?: string; isSystemGroupNames?: string[]; isActive?: boolean }
  ): Promise<Ledger[]> {
    let query = db('ledgers')
      .where({ company_id: companyId })
      .andWhere('deleted_at', null);

    if (filters?.ledgerGroupId) {
      query = query.andWhere({ ledger_group_id: filters.ledgerGroupId });
    }

    if (filters?.isSystemGroupNames && filters.isSystemGroupNames.length > 0) {
      // Find the group IDs for these system group names first
      const groups = await db('ledger_groups')
        .where({ company_id: companyId })
        .whereIn('name', filters.isSystemGroupNames)
        .andWhere('deleted_at', null)
        .select('id');
      const groupIds = groups.map((g) => g.id);

      // If we found groups, filter by those IDs
      if (groupIds.length > 0) {
        query = query.whereIn('ledger_group_id', groupIds);
      } else {
        // If groups not found, return empty set
        return [];
      }
    }

    if (filters?.isActive !== undefined) {
      query = query.andWhere({ is_active: filters.isActive });
    }

    const rows = await query.orderBy('name', 'asc');
    return rows.map(mapRowToLedger);
  },

  async findById(companyId: string, id: string): Promise<Ledger | null> {
    const row = await db('ledgers')
      .where({ company_id: companyId, id })
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToLedger(row) : null;
  },

  async findByName(companyId: string, name: string): Promise<Ledger | null> {
    const row = await db('ledgers')
      .where({ company_id: companyId })
      .andWhereRaw('LOWER(name) = ?', [name.toLowerCase().trim()])
      .andWhere('deleted_at', null)
      .first();

    return row ? mapRowToLedger(row) : null;
  },

  async create(
    companyId: string,
    userId: string,
    data: any
  ): Promise<Ledger> {
    const [row] = await db('ledgers')
      .insert({
        company_id: companyId,
        name: data.name.trim(),
        ledger_group_id: data.ledgerGroupId,
        opening_balance: data.openingBalance ?? 0,
        opening_balance_type: data.openingBalanceType || null,
        contact_name: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
        gstin: data.gstin || null,
        pan: data.pan || null,
        address_line1: data.addressLine1 || null,
        address_line2: data.addressLine2 || null,
        city: data.city || null,
        state_code: data.stateCode || null,
        state_name: data.stateName || null,
        pincode: data.pincode || null,
        gst_registration_type: data.gstRegistrationType || null,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      })
      .returning('*');

    return mapRowToLedger(row);
  },

  async update(
    companyId: string,
    userId: string,
    id: string,
    data: any
  ): Promise<Ledger | null> {
    const updatePayload: any = {
      updated_by: userId,
      updated_at: new Date(),
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.ledgerGroupId !== undefined) updatePayload.ledger_group_id = data.ledgerGroupId;
    if (data.openingBalance !== undefined) updatePayload.opening_balance = data.openingBalance;
    if (data.openingBalanceType !== undefined) updatePayload.opening_balance_type = data.openingBalanceType || null;
    if (data.contactName !== undefined) updatePayload.contact_name = data.contactName || null;
    if (data.phone !== undefined) updatePayload.phone = data.phone || null;
    if (data.email !== undefined) updatePayload.email = data.email || null;
    if (data.gstin !== undefined) updatePayload.gstin = data.gstin || null;
    if (data.pan !== undefined) updatePayload.pan = data.pan || null;
    if (data.addressLine1 !== undefined) updatePayload.address_line1 = data.addressLine1 || null;
    if (data.addressLine2 !== undefined) updatePayload.address_line2 = data.addressLine2 || null;
    if (data.city !== undefined) updatePayload.city = data.city || null;
    if (data.stateCode !== undefined) updatePayload.state_code = data.stateCode || null;
    if (data.stateName !== undefined) updatePayload.state_name = data.stateName || null;
    if (data.pincode !== undefined) updatePayload.pincode = data.pincode || null;
    if (data.gstRegistrationType !== undefined) updatePayload.gst_registration_type = data.gstRegistrationType || null;
    if (data.isActive !== undefined) updatePayload.is_active = data.isActive;

    const [row] = await db('ledgers')
      .where({ company_id: companyId, id })
      .andWhere('deleted_at', null)
      .update(updatePayload)
      .returning('*');

    return row ? mapRowToLedger(row) : null;
  },

  async delete(companyId: string, userId: string, id: string): Promise<boolean> {
    const count = await db('ledgers')
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
