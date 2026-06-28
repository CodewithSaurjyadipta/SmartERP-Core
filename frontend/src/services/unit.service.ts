import { api } from '@/lib/api-client';
import type {
  Unit,
  CreateUnitInput,
  UpdateUnitInput,
  ApiResponse,
} from '@smarterp/shared';

// ============================================================
// Unit Service — API Client
// ============================================================

export const unitService = {
  async getUnits(): Promise<Unit[]> {
    const response = await api.get<ApiResponse<Unit[]>>('/units');
    return response.data.data;
  },

  async getUnit(id: string): Promise<Unit> {
    const response = await api.get<ApiResponse<Unit>>(`/units/${id}`);
    return response.data.data;
  },

  async createUnit(data: CreateUnitInput): Promise<Unit> {
    const response = await api.post<ApiResponse<Unit>>('/units', data);
    return response.data.data;
  },

  async updateUnit(id: string, data: UpdateUnitInput): Promise<Unit> {
    const response = await api.put<ApiResponse<Unit>>(`/units/${id}`, data);
    return response.data.data;
  },

  async deleteUnit(id: string): Promise<void> {
    await api.delete<ApiResponse<any>>(`/units/${id}`);
  },
};
