import { Request, Response, NextFunction } from 'express';
import { voucherService } from './voucher.service';
import { successResponse, createdResponse } from '../../utils/api-response';
import { CompanyRequest } from '../../middleware/company-context.middleware';
import { createVoucherSchema } from '@smarterp/shared';
import { ApiError } from '../../utils/api-error';
import { db } from '../../config/db';
import { invoiceBuilder } from '../invoice/invoice-builder';
import { pdfService } from '../invoice/pdf/pdf.service';

export const voucherController = {
  // Get Vouchers List
  async getVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const { status, voucherType, startDate, endDate, search, limit, offset } = compReq.query;
      
      const filters = {
        status: status as any,
        voucherType: voucherType as any,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      };

      const result = await voucherService.getVouchersList(compReq.companyId, filters);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Get single Voucher detail
  async getVoucherById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const { id } = req.params;

      const voucher = await voucherService.getVoucherById(compReq.companyId, id as string);
      if (!voucher) {
        throw ApiError.notFound('Voucher not found');
      }

      successResponse(res, voucher);
    } catch (error) {
      next(error);
    }
  },

  // Create/Post Voucher
  async createVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const { isDraft } = compReq.query;
      
      const validatedInput = createVoucherSchema.parse(compReq.body);
      
      const context = {
        userId: compReq.user.id,
        ipAddress: compReq.ip,
        userAgent: compReq.headers['user-agent'],
      };

      const status = isDraft === 'true' ? 'DRAFT' : 'POSTED';
      const voucher = await voucherService.createVoucher(
        compReq.companyId,
        context,
        validatedInput,
        status
      );

      createdResponse(res, voucher);
    } catch (error) {
      next(error);
    }
  },

  // Promote Draft to Posted
  async postDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const { id } = req.params;

      const context = {
        userId: compReq.user.id,
        ipAddress: compReq.ip,
        userAgent: compReq.headers['user-agent'],
      };

      const voucher = await voucherService.postDraftVoucher(compReq.companyId, context, id as string);
      successResponse(res, voucher);
    } catch (error) {
      next(error);
    }
  },

  // Cancel Voucher
  async cancelVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const { id } = req.params;
      const { reason } = req.body;

      const context = {
        userId: compReq.user.id,
        ipAddress: compReq.ip,
        userAgent: compReq.headers['user-agent'],
      };

      const voucher = await voucherService.cancelVoucher(compReq.companyId, context, id as string, reason);
      successResponse(res, voucher);
    } catch (error) {
      next(error);
    }
  },

  // Reverse Voucher (Create offsetting entries)
  async reverseVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const { id } = req.params;
      const { reason } = req.body;

      const context = {
        userId: compReq.user.id,
        ipAddress: compReq.ip,
        userAgent: compReq.headers['user-agent'],
      };

      const voucher = await voucherService.reverseVoucher(compReq.companyId, context, id as string, reason);
      successResponse(res, voucher);
    } catch (error) {
      next(error);
    }
  },

  // Get Audit Trail for a Voucher
  async getAuditTrail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const { id } = req.params;

      // Query from audit_logs table
      const logs = await db('audit_logs')
        .where({ company_id: compReq.companyId, entity_id: id })
        .orderBy('created_at', 'desc');

      const auditTrail = logs.map((row) => ({
        id: row.id,
        companyId: row.company_id,
        userId: row.user_id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        oldValues: row.old_values,
        newValues: row.new_values,
        reason: row.reason,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: new Date(row.created_at).toISOString(),
      }));

      successResponse(res, auditTrail);
    } catch (error) {
      next(error);
    }
  },

  // Get compiled Invoice DTO
  async getInvoiceDto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const { id } = req.params;
      const dto = await invoiceBuilder.buildInvoiceDtoFromVoucher(compReq.companyId, id as string);
      successResponse(res, dto);
    } catch (error) {
      next(error);
    }
  },

  // Get streamed Invoice PDF
  async getInvoicePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const { id } = req.params;
      const dto = await invoiceBuilder.buildInvoiceDtoFromVoucher(compReq.companyId, id as string);
      await pdfService.generateInvoicePdf(res, dto);
    } catch (error) {
      next(error);
    }
  },
};
