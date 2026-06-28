import { api } from '@/lib/api-client';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  ApiResponse,
} from '@smarterp/shared';

// ============================================================
// Customer Service — API Client
// ============================================================

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const response = await api.get<ApiResponse<Customer[]>>('/customers');
    return response.data.data;
  },

  async getCustomer(id: string): Promise<Customer> {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data.data;
  },

  async createCustomer(data: CreateCustomerInput): Promise<Customer> {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data.data;
  },

  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<Customer> {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete<ApiResponse<any>>(`/customers/${id}`);
  },
};
