import { api } from '@/lib/api-client';
import type {
  TaxRate,
  CreateTaxRateInput,
  UpdateTaxRateInput,
  ApiResponse,
} from '@smarterp/shared';

// ============================================================
// Tax Rate Service — API Client
// ============================================================

export const taxRateService = {
  async getTaxRates(): Promise<TaxRate[]> {
    const response = await api.get<ApiResponse<TaxRate[]>>('/tax-rates');
    return response.data.data;
  },

  async getTaxRate(id: string): Promise<TaxRate> {
    const response = await api.get<ApiResponse<TaxRate>>(`/tax-rates/${id}`);
    return response.data.data;
  },

  async createTaxRate(data: CreateTaxRateInput): Promise<TaxRate> {
    const response = await api.post<ApiResponse<TaxRate>>('/tax-rates', data);
    return response.data.data;
  },

  async updateTaxRate(id: string, data: UpdateTaxRateInput): Promise<TaxRate> {
    const response = await api.put<ApiResponse<TaxRate>>(`/tax-rates/${id}`, data);
    return response.data.data;
  },

  async deleteTaxRate(id: string): Promise<void> {
    await api.delete<ApiResponse<any>>(`/tax-rates/${id}`);
  },
};
