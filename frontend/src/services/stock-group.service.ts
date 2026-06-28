import { api } from '@/lib/api-client';
import type {
  StockGroup,
  StockGroupNode,
  CreateStockGroupInput,
  UpdateStockGroupInput,
  ApiResponse,
} from '@smarterp/shared';

// ============================================================
// Stock Group Service — API Client
// ============================================================

export const stockGroupService = {
  async getStockGroups(): Promise<StockGroup[]> {
    const response = await api.get<ApiResponse<StockGroup[]>>('/stock-groups');
    return response.data.data;
  },

  async getStockGroupsTree(): Promise<StockGroupNode[]> {
    const response = await api.get<ApiResponse<StockGroupNode[]>>('/stock-groups/tree');
    return response.data.data;
  },

  async createStockGroup(data: CreateStockGroupInput): Promise<StockGroup> {
    const response = await api.post<ApiResponse<StockGroup>>('/stock-groups', data);
    return response.data.data;
  },

  async updateStockGroup(id: string, data: UpdateStockGroupInput): Promise<StockGroup> {
    const response = await api.put<ApiResponse<StockGroup>>(`/stock-groups/${id}`, data);
    return response.data.data;
  },

  async deleteStockGroup(id: string): Promise<void> {
    await api.delete<ApiResponse<any>>(`/stock-groups/${id}`);
  },
};
