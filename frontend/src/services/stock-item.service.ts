import { api } from '@/lib/api-client';
import type {
  StockItem,
  CreateStockItemInput,
  UpdateStockItemInput,
  ApiResponse,
} from '@smarterp/shared';

// ============================================================
// Stock Item Service — API Client
// ============================================================

export interface StockItemWithRelations extends StockItem {
  unitSymbol?: string;
  unitName?: string;
  taxRateName?: string;
  cgstRate?: number | null;
  sgstRate?: number | null;
  igstRate?: number | null;
  stockGroupName?: string;
}

export const stockItemService = {
  async getStockItems(): Promise<StockItemWithRelations[]> {
    const response = await api.get<ApiResponse<StockItemWithRelations[]>>('/stock-items');
    return response.data.data;
  },

  async getStockItem(id: string): Promise<StockItem> {
    const response = await api.get<ApiResponse<StockItem>>(`/stock-items/${id}`);
    return response.data.data;
  },

  async createStockItem(data: CreateStockItemInput): Promise<StockItem> {
    const response = await api.post<ApiResponse<StockItem>>('/stock-items', data);
    return response.data.data;
  },

  async updateStockItem(id: string, data: UpdateStockItemInput): Promise<StockItem> {
    const response = await api.put<ApiResponse<StockItem>>(`/stock-items/${id}`, data);
    return response.data.data;
  },

  async deleteStockItem(id: string): Promise<void> {
    await api.delete<ApiResponse<any>>(`/stock-items/${id}`);
  },
};
