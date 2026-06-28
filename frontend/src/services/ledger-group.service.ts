import { api } from '@/lib/api-client';
import type {
  LedgerGroup,
  LedgerGroupNode,
  CreateLedgerGroupInput,
  UpdateLedgerGroupInput,
  ApiResponse,
} from '@smarterp/shared';

// ============================================================
// Ledger Group Service — API Client
// ============================================================

export const ledgerGroupService = {
  async getGroups(): Promise<LedgerGroup[]> {
    const response = await api.get<ApiResponse<LedgerGroup[]>>('/ledger-groups');
    return response.data.data;
  },

  async getGroupsTree(): Promise<LedgerGroupNode[]> {
    const response = await api.get<ApiResponse<LedgerGroupNode[]>>('/ledger-groups/tree');
    return response.data.data;
  },

  async createGroup(data: CreateLedgerGroupInput): Promise<LedgerGroup> {
    const response = await api.post<ApiResponse<LedgerGroup>>('/ledger-groups', data);
    return response.data.data;
  },

  async updateGroup(id: string, data: UpdateLedgerGroupInput): Promise<LedgerGroup> {
    const response = await api.put<ApiResponse<LedgerGroup>>(`/ledger-groups/${id}`, data);
    return response.data.data;
  },

  async deleteGroup(id: string): Promise<void> {
    await api.delete<ApiResponse<any>>(`/ledger-groups/${id}`);
  },
};
