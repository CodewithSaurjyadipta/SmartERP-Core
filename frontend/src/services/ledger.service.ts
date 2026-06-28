import { api } from '@/lib/api-client';
import type {
  Ledger,
  CreateLedgerInput,
  UpdateLedgerInput,
  ApiResponse,
} from '@smarterp/shared';

// ============================================================
// Ledger Service — API Client
// ============================================================

export const ledgerService = {
  async getLedgers(params?: { ledgerGroupId?: string; isSystemGroupName?: string | string[] }): Promise<Ledger[]> {
    const response = await api.get<ApiResponse<Ledger[]>>('/ledgers', { params });
    return response.data.data;
  },

  async getLedger(id: string): Promise<Ledger> {
    const response = await api.get<ApiResponse<Ledger>>(`/ledgers/${id}`);
    return response.data.data;
  },

  async createLedger(data: CreateLedgerInput): Promise<Ledger> {
    const response = await api.post<ApiResponse<Ledger>>('/ledgers', data);
    return response.data.data;
  },

  async updateLedger(id: string, data: UpdateLedgerInput): Promise<Ledger> {
    const response = await api.put<ApiResponse<Ledger>>(`/ledgers/${id}`, data);
    return response.data.data;
  },

  async deleteLedger(id: string): Promise<void> {
    await api.delete<ApiResponse<any>>(`/ledgers/${id}`);
  },
};
