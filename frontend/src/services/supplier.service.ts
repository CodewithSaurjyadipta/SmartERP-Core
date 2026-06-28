import { api } from '@/lib/api-client';
import type {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  ApiResponse,
} from '@smarterp/shared';

// ============================================================
// Supplier Service — API Client
// ============================================================

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    const response = await api.get<ApiResponse<Supplier[]>>('/suppliers');
    return response.data.data;
  },

  async getSupplier(id: string): Promise<Supplier> {
    const response = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return response.data.data;
  },

  async createSupplier(data: CreateSupplierInput): Promise<Supplier> {
    const response = await api.post<ApiResponse<Supplier>>('/suppliers', data);
    return response.data.data;
  },

  async updateSupplier(id: string, data: UpdateSupplierInput): Promise<Supplier> {
    const response = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
    return response.data.data;
  },

  async deleteSupplier(id: string): Promise<void> {
    await api.delete<ApiResponse<any>>(`/suppliers/${id}`);
  },
};
