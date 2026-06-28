import { ledgerRepository } from './ledger.repository';
import { ledgerGroupRepository } from '../ledger-group/ledger-group.repository';
import { Ledger } from '@smarterp/shared';
import { ApiError } from '../../utils/api-error';
import { db } from '../../config/db';

// ============================================================
// Ledger Service
// ============================================================

export const ledgerService = {
  async getLedgers(
    companyId: string,
    filters?: { ledgerGroupId?: string; isSystemGroupNames?: string[]; isActive?: boolean }
  ): Promise<Ledger[]> {
    return ledgerRepository.findAll(companyId, filters);
  },

  async getLedgerById(companyId: string, id: string): Promise<Ledger> {
    const ledger = await ledgerRepository.findById(companyId, id);
    if (!ledger) {
      throw ApiError.notFound('Ledger account not found');
    }
    return ledger;
  },

  async createLedger(
    companyId: string,
    userId: string,
    data: any
  ): Promise<Ledger> {
    // 1. Validate name uniqueness
    const existing = await ledgerRepository.findByName(companyId, data.name);
    if (existing) {
      throw ApiError.conflict(`Ledger account with name "${data.name}" already exists`);
    }

    // 2. Validate group ID
    const group = await ledgerGroupRepository.findById(companyId, data.ledgerGroupId);
    if (!group) {
      throw ApiError.badRequest('Selected ledger group does not exist');
    }

    return ledgerRepository.create(companyId, userId, data);
  },

  async updateLedger(
    companyId: string,
    userId: string,
    id: string,
    data: any
  ): Promise<Ledger> {
    const ledger = await ledgerRepository.findById(companyId, id);
    if (!ledger) {
      throw ApiError.notFound('Ledger account not found');
    }

    // Protect system ledgers from renaming
    const isSystemName = ['cash', 'profit & loss a/c', 'profit and loss a/c'].includes(
      ledger.name.toLowerCase().trim()
    );
    if (isSystemName && data.name && data.name.toLowerCase().trim() !== ledger.name.toLowerCase()) {
      throw ApiError.forbidden('Renaming system-seeded ledger accounts is not allowed');
    }

    // Validate duplicate name
    if (data.name && data.name.toLowerCase().trim() !== ledger.name.toLowerCase()) {
      const existing = await ledgerRepository.findByName(companyId, data.name);
      if (existing) {
        throw ApiError.conflict(`Ledger account with name "${data.name}" already exists`);
      }
    }

    // Validate group ID if changing
    if (data.ledgerGroupId && data.ledgerGroupId !== ledger.ledgerGroupId) {
      const group = await ledgerGroupRepository.findById(companyId, data.ledgerGroupId);
      if (!group) {
        throw ApiError.badRequest('Selected ledger group does not exist');
      }
    }

    const updated = await ledgerRepository.update(companyId, userId, id, data);
    if (!updated) {
      throw ApiError.notFound('Ledger account not found or cannot be updated');
    }

    return updated;
  },

  async deleteLedger(companyId: string, userId: string, id: string): Promise<void> {
    const ledger = await ledgerRepository.findById(companyId, id);
    if (!ledger) {
      throw ApiError.notFound('Ledger account not found');
    }

    // Protect system ledgers
    const isSystemName = ['cash', 'profit & loss a/c', 'profit and loss a/c'].includes(
      ledger.name.toLowerCase().trim()
    );
    if (isSystemName) {
      throw ApiError.forbidden('System-seeded ledger accounts cannot be deleted');
    }

    // Check for voucher dependencies
    // Wait, are there vouchers yet? No, but let's write a generic guard.
    // When we implement vouchers in Phase 5, they will reference `ledgers.id` as `ledger_id`.
    // Let's add a placeholder query check for transaction rows.
    const hasTransactions = await db('journal_items') // or similar voucher ledger table
      .where({ ledger_id: id })
      .first()
      .catch(() => null); // Silently swallow if table doesn't exist yet

    if (hasTransactions) {
      throw ApiError.badRequest('Cannot delete ledger account that has historical transaction entries');
    }

    await ledgerRepository.delete(companyId, userId, id);
  },
};
