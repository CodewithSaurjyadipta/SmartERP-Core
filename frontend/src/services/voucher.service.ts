import { api } from '@/lib/api-client';
import type {
  Voucher,
  CreateVoucherInput,
  VoucherType,
  VoucherStatus,
  ApiResponse,
} from '@smarterp/shared';

// ============================================================
// Voucher Service — API Client
// ============================================================

export interface GetVouchersParams {
  status?: VoucherStatus;
  voucherType?: VoucherType;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditTrailLog {
  id: string;
  companyId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const voucherService = {
  // Query Vouchers List
  async getVouchers(params?: GetVouchersParams): Promise<{ vouchers: Voucher[]; totalCount: number }> {
    const response = await api.get<ApiResponse<{ vouchers: Voucher[]; totalCount: number }>>('/vouchers', { params });
    return response.data.data;
  },

  // Get Detailed Voucher
  async getVoucher(id: string): Promise<Voucher & { entries: any[]; stockEntries?: any[] }> {
    const response = await api.get<ApiResponse<Voucher & { entries: any[]; stockEntries?: any[] }>>(`/vouchers/${id}`);
    return response.data.data;
  },

  // Post Voucher or save Draft
  async createVoucher(data: CreateVoucherInput, isDraft = false): Promise<Voucher> {
    const response = await api.post<ApiResponse<Voucher>>('/vouchers', data, {
      params: { isDraft: String(isDraft) },
    });
    return response.data.data;
  },

  // Post a Draft Voucher
  async postDraft(id: string): Promise<Voucher> {
    const response = await api.post<ApiResponse<Voucher>>(`/vouchers/${id}/post`);
    return response.data.data;
  },

  // Cancel Voucher
  async cancelVoucher(id: string, reason?: string): Promise<Voucher> {
    const response = await api.post<ApiResponse<Voucher>>(`/vouchers/${id}/cancel`, { reason });
    return response.data.data;
  },

  // Reverse Voucher
  async reverseVoucher(id: string, reason?: string): Promise<Voucher> {
    const response = await api.post<ApiResponse<Voucher>>(`/vouchers/${id}/reverse`, { reason });
    return response.data.data;
  },

  // Get Audit logs
  async getAuditTrail(id: string): Promise<AuditTrailLog[]> {
    const response = await api.get<ApiResponse<AuditTrailLog[]>>(`/vouchers/${id}/audit`);
    return response.data.data;
  },

  // Fetch and print invoice PDF
  async printInvoicePdf(id: string): Promise<void> {
    const response = await api.get(`/vouchers/${id}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  },
};
