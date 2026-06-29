import type PDFKit from 'pdfkit';
import type { InvoiceDto } from '@smarterp/shared';

// ============================================================
// GST Tax Invoice Drawing Layout (Compliance Template)
// ============================================================

export const gstInvoiceTemplate = {
  draw(doc: typeof PDFKit, dto: InvoiceDto): void {
    const startX = 30;
    const endX = 565; // A4 width 595.28 - 30 margin
    let currentY = 30;

    // ── 1. Page border ───────────────────────────────────────
    doc.strokeColor('#cccccc').lineWidth(1);
    doc.rect(startX, startX, endX - startX, 841.89 - 60).stroke();

    // ── 2. Header Title ──────────────────────────────────────
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(14);
    doc.text('TAX INVOICE', startX, currentY + 10, { align: 'center', width: endX - startX });
    currentY += 35;

    // Divider line
    doc.strokeColor('#e2e8f0').moveTo(startX, currentY).lineTo(endX, currentY).stroke();

    // ── 3. Billing details (Supplier vs Recipient) ───────────
    const boxWidth = (endX - startX) / 2;
    
    // Supplier Box (Left)
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
    doc.text('SUPPLIER (Company Details):', startX + 10, currentY + 10);
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(dto.supplier.name, startX + 10, currentY + 25, { width: boxWidth - 20 });
    
    doc.font('Helvetica').fontSize(8).fillColor('#475569');
    let supplierAddress = '';
    if (dto.supplier.addressLine1) supplierAddress += dto.supplier.addressLine1 + '\n';
    if (dto.supplier.addressLine2) supplierAddress += dto.supplier.addressLine2 + '\n';
    if (dto.supplier.city) supplierAddress += `${dto.supplier.city} - ${dto.supplier.pincode || ''}\n`;
    doc.text(supplierAddress, startX + 10, currentY + 40, { width: boxWidth - 20 });
    
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
    if (dto.supplier.gstin) {
      doc.text(`GSTIN: ${dto.supplier.gstin}`, startX + 10, currentY + 75);
    }
    if (dto.supplier.stateCode) {
      doc.text(`State: ${dto.supplier.stateName || ''} (${dto.supplier.stateCode})`, startX + 10, currentY + 87);
    }

    // Recipient Box (Right)
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
    doc.text('BILL TO (Recipient Details):', startX + boxWidth + 10, currentY + 10);
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(dto.recipient.name, startX + boxWidth + 10, currentY + 25, { width: boxWidth - 20 });
    
    doc.font('Helvetica').fontSize(8).fillColor('#475569');
    let recipientAddress = '';
    if (dto.recipient.addressLine1) recipientAddress += dto.recipient.addressLine1 + '\n';
    if (dto.recipient.addressLine2) recipientAddress += dto.recipient.addressLine2 + '\n';
    if (dto.recipient.city) recipientAddress += `${dto.recipient.city} - ${dto.recipient.pincode || ''}\n`;
    doc.text(recipientAddress, startX + boxWidth + 10, currentY + 40, { width: boxWidth - 20 });
    
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
    if (dto.recipient.gstin) {
      doc.text(`GSTIN: ${dto.recipient.gstin}`, startX + boxWidth + 10, currentY + 75);
    }
    if (dto.recipient.stateCode) {
      doc.text(`State: ${dto.recipient.stateName || ''} (${dto.recipient.stateCode})`, startX + boxWidth + 10, currentY + 87);
    }

    currentY += 105;
    
    // Divider line
    doc.strokeColor('#e2e8f0').moveTo(startX, currentY).lineTo(endX, currentY).stroke();

    // ── 4. Invoice metadata info block ───────────────────────
    doc.fillColor('#475569').font('Helvetica').fontSize(8);
    doc.text('Invoice Number:', startX + 10, currentY + 8);
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(dto.voucherNumber, startX + 85, currentY + 8);

    doc.fillColor('#475569').font('Helvetica').fontSize(8);
    doc.text('Invoice Date:', startX + 195, currentY + 8);
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(dto.date, startX + 255, currentY + 8);

    doc.fillColor('#475569').font('Helvetica').fontSize(8);
    doc.text('Ref Invoice #:', startX + 380, currentY + 8);
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(dto.referenceNumber || '—', startX + 445, currentY + 8);

    currentY += 25;
    doc.strokeColor('#e2e8f0').moveTo(startX, currentY).lineTo(endX, currentY).stroke();

    // ── 5. Items Grid Table ──────────────────────────────────
    // Column widths definition (sum: 535 points)
    const cols = {
      sno: 20,
      item: 125,
      hsn: 40,
      qty: 30,
      rate: 45,
      val: 55,
      cgst: 55,
      sgst: 55,
      igst: 55,
      total: 55
    };

    // Header row background
    doc.fillColor('#f8fafc').rect(startX + 1, currentY, endX - startX - 2, 22).fill();
    
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5);
    let xOffset = startX + 4;
    doc.text('S.No', xOffset, currentY + 7, { width: cols.sno });
    xOffset += cols.sno;
    doc.text('Description of Goods', xOffset, currentY + 7, { width: cols.item });
    xOffset += cols.item;
    doc.text('HSN/SAC', xOffset, currentY + 7, { width: cols.hsn, align: 'center' });
    xOffset += cols.hsn;
    doc.text('Qty', xOffset, currentY + 7, { width: cols.qty, align: 'center' });
    xOffset += cols.qty;
    doc.text('Rate', xOffset, currentY + 7, { width: cols.rate, align: 'right' });
    xOffset += cols.rate;
    doc.text('Tax Value', xOffset, currentY + 7, { width: cols.val, align: 'right' });
    xOffset += cols.val;
    doc.text('CGST Rate/Amt', xOffset, currentY + 7, { width: cols.cgst, align: 'center' });
    xOffset += cols.cgst;
    doc.text('SGST Rate/Amt', xOffset, currentY + 7, { width: cols.sgst, align: 'center' });
    xOffset += cols.sgst;
    doc.text('IGST Rate/Amt', xOffset, currentY + 7, { width: cols.igst, align: 'center' });
    xOffset += cols.igst;
    doc.text('Amount', xOffset, currentY + 7, { width: cols.total, align: 'right' });

    currentY += 22;
    doc.strokeColor('#cbd5e1').moveTo(startX, currentY).lineTo(endX, currentY).stroke();

    // Render items
    doc.fillColor('#0f172a').font('Helvetica').fontSize(7.5);
    dto.lineItems.forEach((item, idx) => {
      // Row separator
      if (idx > 0) {
        doc.strokeColor('#f1f5f9').moveTo(startX, currentY).lineTo(endX, currentY).stroke();
      }

      xOffset = startX + 4;
      doc.text(String(idx + 1), xOffset, currentY + 6, { width: cols.sno });
      xOffset += cols.sno;
      doc.text(item.itemName, xOffset, currentY + 6, { width: cols.item });
      xOffset += cols.item;
      doc.text(item.hsnCode || '—', xOffset, currentY + 6, { width: cols.hsn, align: 'center' });
      xOffset += cols.hsn;
      doc.text(String(item.qty), xOffset, currentY + 6, { width: cols.qty, align: 'center' });
      xOffset += cols.qty;
      doc.text(`₹${item.rate.toFixed(2)}`, xOffset, currentY + 6, { width: cols.rate, align: 'right' });
      xOffset += cols.rate;
      doc.text(`₹${item.taxableValue.toFixed(2)}`, xOffset, currentY + 6, { width: cols.val, align: 'right' });
      xOffset += cols.val;

      // CGST cell
      const cgstStr = item.cgstRate > 0 ? `${item.cgstRate}%\n₹${item.cgstAmount.toFixed(2)}` : '—';
      doc.text(cgstStr, xOffset, currentY + 2, { width: cols.cgst, align: 'center' });
      xOffset += cols.cgst;

      // SGST cell
      const sgstStr = item.sgstRate > 0 ? `${item.sgstRate}%\n₹${item.sgstAmount.toFixed(2)}` : '—';
      doc.text(sgstStr, xOffset, currentY + 2, { width: cols.sgst, align: 'center' });
      xOffset += cols.sgst;

      // IGST cell
      const igstStr = item.igstRate > 0 ? `${item.igstRate}%\n₹${item.igstAmount.toFixed(2)}` : '—';
      doc.text(igstStr, xOffset, currentY + 2, { width: cols.igst, align: 'center' });
      xOffset += cols.igst;

      doc.text(`₹${item.netAmount.toFixed(2)}`, xOffset, currentY + 6, { width: cols.total, align: 'right' });

      currentY += 20;
    });

    doc.strokeColor('#cbd5e1').moveTo(startX, currentY).lineTo(endX, currentY).stroke();

    // ── 6. Summary Block Table ───────────────────────────────
    // Subtotals and summaries block placement
    const sumX = startX + 280;
    doc.fillColor('#475569').font('Helvetica').fontSize(8);
    
    doc.text('Taxable Subtotal:', sumX, currentY + 10);
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(`₹${dto.taxableSubtotal.toFixed(2)}`, endX - 100, currentY + 10, { align: 'right', width: 90 });

    let currentSumY = currentY + 22;
    if (dto.cgstTotal > 0) {
      doc.fillColor('#475569').font('Helvetica').text('CGST Total:', sumX, currentSumY);
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(`₹${dto.cgstTotal.toFixed(2)}`, endX - 100, currentSumY, { align: 'right', width: 90 });
      currentSumY += 12;
    }
    if (dto.sgstTotal > 0) {
      doc.fillColor('#475569').font('Helvetica').text('SGST Total:', sumX, currentSumY);
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(`₹${dto.sgstTotal.toFixed(2)}`, endX - 100, currentSumY, { align: 'right', width: 90 });
      currentSumY += 12;
    }
    if (dto.igstTotal > 0) {
      doc.fillColor('#475569').font('Helvetica').text('IGST Total:', sumX, currentSumY);
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(`₹${dto.igstTotal.toFixed(2)}`, endX - 100, currentSumY, { align: 'right', width: 90 });
      currentSumY += 12;
    }

    doc.strokeColor('#cbd5e1').moveTo(sumX, currentSumY + 2).lineTo(endX, currentSumY + 2).stroke();

    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
    doc.text('Grand Total:', sumX, currentSumY + 8);
    doc.text(`₹${dto.grandTotal.toFixed(2)}`, endX - 120, currentSumY + 8, { align: 'right', width: 110 });

    currentSumY += 24;

    // Divider line below sums table
    doc.strokeColor('#cbd5e1').moveTo(startX, currentSumY).lineTo(endX, currentSumY).stroke();
    currentY = currentSumY;

    // ── 7. HSN Summary breakdown ─────────────────────────────
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8);
    doc.text('HSN / SAC Tax Details Summary:', startX + 10, currentY + 10);
    
    // Mini Table headers
    let hsnY = currentY + 22;
    doc.fillColor('#f8fafc').rect(startX + 10, hsnY, endX - startX - 20, 15).fill();
    doc.strokeColor('#e2e8f0').rect(startX + 10, hsnY, endX - startX - 20, 15).stroke();

    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7);
    doc.text('HSN Code', startX + 15, hsnY + 4);
    doc.text('Taxable Value', startX + 100, hsnY + 4, { align: 'right', width: 60 });
    doc.text('CGST Rate/Amt', startX + 180, hsnY + 4, { align: 'center', width: 80 });
    doc.text('SGST Rate/Amt', startX + 270, hsnY + 4, { align: 'center', width: 80 });
    doc.text('IGST Rate/Amt', startX + 360, hsnY + 4, { align: 'center', width: 80 });
    doc.text('Total Tax', startX + 460, hsnY + 4, { align: 'right', width: 70 });

    hsnY += 15;
    doc.font('Helvetica').fontSize(7).fillColor('#334155');
    dto.taxSummary.forEach((t, i) => {
      // Row borders
      doc.strokeColor('#e2e8f0').rect(startX + 10, hsnY, endX - startX - 20, 15).stroke();
      doc.text(t.hsnCode, startX + 15, hsnY + 4);
      doc.text(`₹${t.taxableValue.toFixed(2)}`, startX + 100, hsnY + 4, { align: 'right', width: 60 });
      
      const cgstVal = t.cgstAmount > 0 ? `${t.cgstRate}% (₹${t.cgstAmount.toFixed(2)})` : '—';
      doc.text(cgstVal, startX + 180, hsnY + 4, { align: 'center', width: 80 });
      
      const sgstVal = t.sgstAmount > 0 ? `${t.sgstRate}% (₹${t.sgstAmount.toFixed(2)})` : '—';
      doc.text(sgstVal, startX + 270, hsnY + 4, { align: 'center', width: 80 });
      
      const igstVal = t.igstAmount > 0 ? `${t.igstRate}% (₹${t.igstAmount.toFixed(2)})` : '—';
      doc.text(igstVal, startX + 360, hsnY + 4, { align: 'center', width: 80 });
      
      doc.text(`₹${t.totalTaxAmount.toFixed(2)}`, startX + 460, hsnY + 4, { align: 'right', width: 70 });
      hsnY += 15;
    });

    currentY = hsnY + 10;
    doc.strokeColor('#cbd5e1').moveTo(startX, currentY).lineTo(endX, currentY).stroke();

    // ── 8. Amount in words description block ─────────────────
    doc.fillColor('#475569').font('Helvetica-Oblique').fontSize(8.5);
    doc.text(`Invoice Amount in Words: ${dto.amountInWords}`, startX + 10, currentY + 10, { width: endX - startX - 20 });
    
    currentY += 28;
    doc.strokeColor('#e2e8f0').moveTo(startX, currentY).lineTo(endX, currentY).stroke();

    // ── 9. Bank details & Declaration footer block ───────────
    const footerBoxW = (endX - startX) / 2;
    
    // Bank Box (Left)
    if (dto.bankDetails) {
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8);
      doc.text('Company Bank Details:', startX + 10, currentY + 10);
      doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
      doc.text(`Bank: ${dto.bankDetails.bankName}`, startX + 10, currentY + 22);
      doc.text(`Account No: ${dto.bankDetails.accountNumber}`, startX + 10, currentY + 32);
      doc.text(`IFSC Code: ${dto.bankDetails.ifscCode}`, startX + 10, currentY + 42);
      doc.text(`Branch: ${dto.bankDetails.branchName}`, startX + 10, currentY + 52);
    }

    // Signatory Box (Right)
    doc.fillColor('#475569').font('Helvetica').fontSize(8);
    doc.text('Declaration & Authorised Signatory:', startX + footerBoxW + 10, currentY + 10);
    doc.font('Helvetica-Oblique').fontSize(7).fillColor('#64748b');
    doc.text(
      'This is a computer-generated tax invoice. Signature not required. Value declared meets standard business definitions.',
      startX + footerBoxW + 10,
      currentY + 22,
      { width: footerBoxW - 20, align: 'justify' }
    );
    
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);
    doc.text('For ' + dto.supplier.name, startX + footerBoxW + 10, currentY + 55, { align: 'right', width: footerBoxW - 20 });

    // ── 10. Watermark (Diagonal light-red stamp if CANCELLED) ─
    if (dto.status === 'CANCELLED') {
      doc.save();
      doc.fillColor('red');
      doc.opacity(0.12);
      doc.font('Helvetica-Bold').fontSize(72);
      doc.rotate(-35, { origin: [297, 420] }); // Rotate relative to A4 page center
      doc.text('CANCELLED', 100, 390, { width: 400, align: 'center' });
      doc.restore();
    }
  }
};
