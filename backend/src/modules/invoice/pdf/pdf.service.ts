import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { InvoiceDto } from '@smarterp/shared';
import { gstInvoiceTemplate } from './templates/gst-invoice.template';

// ============================================================
// PDF Compile Service
// ============================================================

export const pdfService = {
  /**
   * Generates a tax invoice PDF binary stream and pipes it directly into Express Response.
   */
  async generateInvoicePdf(res: Response, dto: InvoiceDto): Promise<void> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 30,
      info: {
        Title: `Tax Invoice - ${dto.voucherNumber}`,
        Author: dto.supplier.name,
        Subject: 'SmartERP Accounting Document',
        Keywords: 'Invoice, GST, Tax, SmartERP',
      },
    });

    // Set responsive response headers to view in-browser natively
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${dto.voucherNumber}.pdf"`);

    // Pipe compiler stream directly to response
    doc.pipe(res);

    // Render A4 layout template
    gstInvoiceTemplate.draw(doc, dto);

    // Close compilation stream
    doc.end();
  },
};
