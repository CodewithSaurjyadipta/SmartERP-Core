import { api } from '@/lib/api-client';
import type { 
  Company, 
  CompanyWithRole, 
  CreateCompanyInput, 
  UpdateCompanyInput, 
  ApiResponse 
} from '@smarterp/shared';

// ============================================================
// Company Service — API Calls
// ============================================================

export const companyService = {
  async getCompanies(): Promise<CompanyWithRole[]> {
    const response = await api.get<ApiResponse<CompanyWithRole[]>>('/companies');
    return response.data.data;
  },

  async getCompany(id: string): Promise<Company> {
    const response = await api.get<ApiResponse<Company>>(`/companies/${id}`);
    return response.data.data;
  },

  async createCompany(data: CreateCompanyInput): Promise<Company> {
    const response = await api.post<ApiResponse<Company>>('/companies', data);
    return response.data.data;
  },

  async updateCompany(id: string, data: UpdateCompanyInput): Promise<Company> {
    const response = await api.put<ApiResponse<Company>>(`/companies/${id}`, data);
    return response.data.data;
  },
};
