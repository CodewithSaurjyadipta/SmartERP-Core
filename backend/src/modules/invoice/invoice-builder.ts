import { db } from '../../config/db';
import { gstEngine, GstInputItem } from '../gst/gst-engine';
import { numberToIndianRupeesWords } from '../../utils/number-to-words';
import { invoiceDtoSchema } from '@smarterp/shared';
import type { InvoiceDto, InvoiceParty, InvoiceLineItem } from '@smarterp/shared';

export const invoiceBuilder = {
  /**
   * Loads a voucher and its nested context from Postgres and builds a validated InvoiceDto.
   */
  async buildInvoiceDtoFromVoucher(companyId: string, voucherId: string): Promise<InvoiceDto> {
    // 1. Fetch Company Settings
    const company = await db('companies').where({ id: companyId }).first();
    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    // 2. Fetch Voucher Header
    const voucher = await db('vouchers')
      .where({ id: voucherId, company_id: companyId })
      .first();
    if (!voucher) {
      throw new Error(`Voucher not found: ${voucherId}`);
    }

    // 3. Fetch Ledger Entries
    const entries = await db('voucher_entries')
      .join('ledgers', 'voucher_entries.ledger_id', 'ledgers.id')
      .where({ 'voucher_entries.voucher_id': voucherId })
      .select(
        'voucher_entries.*',
        'ledgers.name as ledger_name',
        'ledgers.gstin',
        'ledgers.state_code',
        'ledgers.state_name',
        'ledgers.address_line1',
        'ledgers.address_line2',
        'ledgers.city',
        'ledgers.pincode',
        'ledgers.email',
        'ledgers.phone'
      );

    // 4. Fetch Stock Movements
    const stockMovements = await db('stock_movements')
      .join('stock_items', 'stock_movements.stock_item_id', 'stock_items.id')
      .leftJoin('units', 'stock_items.unit_id', 'units.id')
      .leftJoin('tax_rates', 'stock_items.tax_rate_id', 'tax_rates.id')
      .where({ 'stock_movements.voucher_id': voucherId })
      .select(
        'stock_movements.*',
        'stock_items.name as item_name',
        'stock_items.hsn_code',
        'units.symbol as unit_symbol',
        'tax_rates.cgst_rate as cgst_rate',
        'tax_rates.sgst_rate as sgst_rate',
        'tax_rates.igst_rate as igst_rate'
      );

    // 5. Determine the recipient/party ledger and vendor/supplier roles
    // In Tally, the party ledger is typically the one with address & GST details
    let partyEntry = entries.find(e => e.gstin || e.state_code || e.address_line1);
    
    // Fallback: If no address details exist, select the key offset entry depending on Voucher Type
    if (!partyEntry) {
      if (voucher.voucher_type === 'SALES') {
        // Sales: Debited Party ledger
        partyEntry = entries.find(e => e.entry_type === 'DEBIT') || entries[0];
      } else {
        // Purchase/Others: Credited Party ledger
        partyEntry = entries.find(e => e.entry_type === 'CREDIT') || entries[0];
      }
    }

    if (!partyEntry) {
      throw new Error(`Failed to identify client party ledger for voucher: ${voucherId}`);
    }

    // 6. Map Supplier & Recipient addresses
    const supplierParty: InvoiceParty = {
      name: company.name,
      legalName: company.legal_name || company.name,
      gstin: company.gstin || null,
      pan: company.pan || null,
      addressLine1: company.address_line1 || null,
      addressLine2: company.address_line2 || null,
      city: company.city || null,
      stateCode: company.state_code || null,
      stateName: company.state_name || null,
      pincode: company.pincode || null,
      phone: company.phone || null,
      email: company.email || null,
    };

    const recipientParty: InvoiceParty = {
      name: partyEntry.ledger_name,
      gstin: partyEntry.gstin || null,
      addressLine1: partyEntry.address_line1 || null,
      addressLine2: partyEntry.address_line2 || null,
      city: partyEntry.city || null,
      stateCode: partyEntry.state_code || null,
      stateName: partyEntry.state_name || null,
      pincode: partyEntry.pincode || null,
      phone: partyEntry.phone || null,
      email: partyEntry.email || null,
    };

    // 7. Compile items input list for GST tax calculation
    const inputItems: GstInputItem[] = [];

    if (stockMovements.length > 0) {
      // Inventory Items Allocation
      stockMovements.forEach(s => {
        inputItems.push({
          itemName: s.item_name,
          hsnCode: s.hsn_code || null,
          qty: Number(s.qty),
          rate: Number(s.rate),
          unitSymbol: s.unit_symbol || 'pcs',
          cgstRate: Number(s.cgst_rate || 0),
          sgstRate: Number(s.sgst_rate || 0),
          igstRate: Number(s.igst_rate || 0),
        });
      });
    } else {
      // Service Ledger Allocations (direct accounting entries)
      // Map non-party postings as individual lines
      const servicePostings = entries.filter(e => e.id !== partyEntry?.id);
      servicePostings.forEach(e => {
        inputItems.push({
          itemName: e.ledger_name,
          hsnCode: null,
          qty: 1,
          rate: Number(e.amount),
          unitSymbol: 'nos',
          cgstRate: 0,
          sgstRate: 0,
          igstRate: 0,
        });
      });
    }

    // 8. Run GST Calculation
    const gstResult = gstEngine.calculateTaxes(
      supplierParty.stateCode || null,
      recipientParty.stateCode || null,
      inputItems
    );

    // 9. Convert Grand Total value to Indian currency words
    const amountInWords = numberToIndianRupeesWords(gstResult.grandTotal);

    // 10. Assemble complete InvoiceDto structure
    const rawDto: InvoiceDto = {
      voucherId: voucher.id,
      voucherNumber: voucher.voucher_number,
      voucherType: voucher.voucher_type,
      status: voucher.status,
      date: new Date(voucher.date).toISOString().split('T')[0],
      referenceNumber: voucher.reference_number || null,
      narration: voucher.narration || null,
      
      supplier: voucher.voucher_type === 'PURCHASE' ? recipientParty : supplierParty,
      recipient: voucher.voucher_type === 'PURCHASE' ? supplierParty : recipientParty,
      
      lineItems: gstResult.lineItems,
      taxSummary: gstResult.taxSummary,
      
      taxableSubtotal: gstResult.taxableSubtotal,
      cgstTotal: gstResult.cgstTotal,
      sgstTotal: gstResult.sgstTotal,
      igstTotal: gstResult.igstTotal,
      taxTotal: gstResult.taxTotal,
      grandTotal: gstResult.grandTotal,
      amountInWords,
      
      bankDetails: {
        bankName: 'State Bank of India',
        accountNumber: '330922880011',
        ifscCode: 'SBIN0001042',
        branchName: 'SME Branch Kolkata',
      },
      
      qrCodeContent: `UPI://pay?pa=smarterp@sbi&pn=SmartERP&am=${gstResult.grandTotal}&cu=INR`,
      digitalSignature: 'Digitally Signed by SmartERP Secure Auth Key',
    };

    // 11. Run structural schema validation
    return invoiceDtoSchema.parse(rawDto);
  },
};
