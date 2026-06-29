import type { InvoiceLineItem, InvoiceTaxSummary } from '@smarterp/shared';

// ============================================================
// GST Engine — Indian Tax Compliance Service
// ============================================================

export interface GstInputItem {
  itemName: string;
  hsnCode?: string | null;
  qty: number;
  rate: number;
  unitSymbol?: string | null;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

export interface GstCalculationResult {
  lineItems: InvoiceLineItem[];
  taxSummary: InvoiceTaxSummary[];
  taxableSubtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  grandTotal: number;
}

export const gstEngine = {
  /**
   * Evaluates tax rates and computes GST line allocations and HSN aggregations.
   * Compiles with CGST Rules on decimal rounding to 2 decimal places.
   */
  calculateTaxes(
    supplierStateCode: string | null,
    recipientStateCode: string | null,
    items: GstInputItem[]
  ): GstCalculationResult {
    const isInterstate =
      supplierStateCode &&
      recipientStateCode &&
      supplierStateCode.trim().toUpperCase() !== recipientStateCode.trim().toUpperCase();

    let taxableSubtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const lineItems: InvoiceLineItem[] = items.map((item, idx) => {
      const taxableValue = Number((item.qty * item.rate).toFixed(2));
      taxableSubtotal += taxableValue;

      let cgstRate = 0;
      let cgstAmount = 0;
      let sgstRate = 0;
      let sgstAmount = 0;
      let igstRate = 0;
      let igstAmount = 0;

      if (isInterstate) {
        igstRate = item.igstRate || (item.cgstRate + item.sgstRate);
        igstAmount = Number(((taxableValue * igstRate) / 100).toFixed(2));
        igstTotal += igstAmount;
      } else {
        cgstRate = item.cgstRate;
        cgstAmount = Number(((taxableValue * cgstRate) / 100).toFixed(2));
        cgstTotal += cgstAmount;

        sgstRate = item.sgstRate;
        sgstAmount = Number(((taxableValue * sgstRate) / 100).toFixed(2));
        sgstTotal += sgstAmount;
      }

      const netAmount = Number((taxableValue + cgstAmount + sgstAmount + igstAmount).toFixed(2));

      return {
        serialNumber: idx + 1,
        itemName: item.itemName,
        hsnCode: item.hsnCode || null,
        qty: item.qty,
        unitSymbol: item.unitSymbol || null,
        rate: item.rate,
        taxableValue,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        netAmount,
      };
    });

    // Round total tax allocations
    taxableSubtotal = Number(taxableSubtotal.toFixed(2));
    cgstTotal = Number(cgstTotal.toFixed(2));
    sgstTotal = Number(sgstTotal.toFixed(2));
    igstTotal = Number(igstTotal.toFixed(2));

    const taxTotal = Number((cgstTotal + sgstTotal + igstTotal).toFixed(2));
    const grandTotal = Number((taxableSubtotal + taxTotal).toFixed(2));

    // Compile HSN Tax Summary Groups (Mandatory for Indian GST compliance reporting)
    const hsnGroups: { [hsn: string]: InvoiceTaxSummary } = {};

    lineItems.forEach(line => {
      const hsn = line.hsnCode || 'N/A';
      if (!hsnGroups[hsn]) {
        hsnGroups[hsn] = {
          hsnCode: hsn,
          taxableValue: 0,
          cgstRate: line.cgstRate,
          cgstAmount: 0,
          sgstRate: line.sgstRate,
          sgstAmount: 0,
          igstRate: line.igstRate,
          igstAmount: 0,
          totalTaxAmount: 0,
        };
      }

      const group = hsnGroups[hsn];
      group.taxableValue = Number((group.taxableValue + line.taxableValue).toFixed(2));
      group.cgstAmount = Number((group.cgstAmount + line.cgstAmount).toFixed(2));
      group.sgstAmount = Number((group.sgstAmount + line.sgstAmount).toFixed(2));
      group.igstAmount = Number((group.igstAmount + line.igstAmount).toFixed(2));
      group.totalTaxAmount = Number(
        (group.cgstAmount + group.sgstAmount + group.igstAmount).toFixed(2)
      );
    });

    return {
      lineItems,
      taxSummary: Object.values(hsnGroups),
      taxableSubtotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      taxTotal,
      grandTotal,
    };
  },
};
