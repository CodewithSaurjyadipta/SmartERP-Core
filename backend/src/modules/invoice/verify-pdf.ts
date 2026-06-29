import fs from 'fs';
import path from 'path';

// Manually parse env variables to bypass Node resolution blocks outside monorepo
const envContent = fs.readFileSync('/Users/saurjyadiptamacbookair/Programming/Labmentix/SmartERP/backend/.env', 'utf-8');
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  }
});

import { db } from '../../config/db';
import { voucherService } from '../voucher/voucher.service';
import { invoiceBuilder } from './invoice-builder';
import PDFDocument from 'pdfkit';
import { gstInvoiceTemplate } from './pdf/templates/gst-invoice.template';

async function verifyPdfGeneration() {
  console.log('🚀 Starting Invoice PDF Compiler verification...');

  // Setup - Find a seed user and create a temporary test company with full GST/Address settings
  const user = await db('users').first();
  if (!user) {
    console.error('❌ Error: No users found in database.');
    process.exit(1);
  }

  const companyName = `Hindustan Trade Enterprise ${Date.now()}`;
  const [company] = await db('companies')
    .insert({
      name: companyName,
      legal_name: `${companyName} Ltd.`,
      gstin: '19AABCU9603R1ZM', // West Bengal GSTIN
      pan: 'AABCU9603R',
      address_line1: '12, J.N. Road, Chowringhee',
      address_line2: 'Block B, 4th Floor',
      city: 'Kolkata',
      state_code: '19', // West Bengal
      state_name: 'West Bengal',
      pincode: '700013',
      financial_year_start: new Date('2026-04-01'),
      books_from: new Date('2026-04-01'),
      base_currency: 'INR',
    })
    .returning('*');
  
  await db('user_companies').insert({
    user_id: user.id,
    company_id: company.id,
    role: 'OWNER',
  });
  console.log(`🏢 Created temporary company: ${companyName} (${company.id})`);

  // Seed ledger groups
  const debtorsGroup = await db('ledger_groups').insert({
    company_id: company.id,
    name: 'Sundry Debtors',
    nature: 'ASSETS',
    is_system: true,
  }).returning('*').then((rows: any[]) => rows[0]);

  const salesGroup = await db('ledger_groups').insert({
    company_id: company.id,
    name: 'Sales Accounts',
    nature: 'INCOME',
    is_system: true,
  }).returning('*').then((rows: any[]) => rows[0]);

  const taxGroup = await db('ledger_groups').insert({
    company_id: company.id,
    name: 'Duties & Taxes',
    nature: 'LIABILITIES',
    is_system: true,
  }).returning('*').then((rows: any[]) => rows[0]);

  // Seed ledgers (including Customer with full GST details)
  const [customerLedger] = await db('ledgers')
    .insert({
      company_id: company.id,
      name: 'Reliance Retail Kolkata Ltd.',
      ledger_group_id: debtorsGroup.id,
      opening_balance: 0,
      opening_balance_type: 'DEBIT',
      address_line1: 'Plot 4, Sector V, Salt Lake',
      city: 'Kolkata',
      state_code: '19', // Intrastate (matches West Bengal!)
      state_name: 'West Bengal',
      pincode: '700091',
      gstin: '19AABCR8080C1Z0',
    })
    .returning('*');

  const [salesLedger] = await db('ledgers')
    .insert({
      company_id: company.id,
      name: 'Domestic Sales A/c',
      ledger_group_id: salesGroup.id,
      opening_balance: 0,
    })
    .returning('*');

  const [cgstLedger] = await db('ledgers')
    .insert({
      company_id: company.id,
      name: 'CGST Input Tax A/c',
      ledger_group_id: taxGroup.id,
      opening_balance: 0,
    })
    .returning('*');

  const [sgstLedger] = await db('ledgers')
    .insert({
      company_id: company.id,
      name: 'SGST Input Tax A/c',
      ledger_group_id: taxGroup.id,
      opening_balance: 0,
    })
    .returning('*');

  console.log(`📝 Seeded Party and Posting accounts`);

  // Seed tax rates and stock items
  const [taxRate] = await db('tax_rates')
    .insert({
      company_id: company.id,
      name: 'GST 18%',
      tax_type: 'GST',
      cgst_rate: 9.0,
      sgst_rate: 9.0,
      igst_rate: 18.0,
    })
    .returning('*');

  const [stockItem] = await db('stock_items')
    .insert({
      company_id: company.id,
      name: 'Lenovo ThinkPad L14 Laptop',
      tax_rate_id: taxRate.id,
      hsn_code: '84713010',
      opening_qty: 0,
      opening_rate: 0,
      opening_value: 0,
      standard_selling_price: 55000,
    })
    .returning('*');

  console.log(`📦 Seeded stock items & GST rates`);

  // Post a sales voucher using the service
  const clientContext = {
    userId: user.id,
    ipAddress: '127.0.0.1',
    userAgent: 'PDF Test Runner',
  };

  const voucherInput = {
    date: '2026-06-30',
    voucherType: 'SALES' as const,
    narration: 'Bulk supply of Lenovo ThinkPad L14 laptops under invoice',
    referenceNumber: 'HTE-0042',
    entries: [
      { ledgerId: customerLedger.id, entryType: 'DEBIT' as const, amount: 129800 }, // Gross (110k + 9.9k CGST + 9.9k SGST)
      { ledgerId: salesLedger.id, entryType: 'CREDIT' as const, amount: 110000 },  // Net taxable
      { ledgerId: cgstLedger.id, entryType: 'CREDIT' as const, amount: 9900 },
      { ledgerId: sgstLedger.id, entryType: 'CREDIT' as const, amount: 9900 },
    ],
    stockEntries: [
      {
        stockItemId: stockItem.id,
        qty: 2,
        rate: 55000,
        amount: 110000,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
      }
    ]
  };

  try {
    console.log('🧪 Posting sales voucher...');
    const voucher = await voucherService.createVoucher(company.id, clientContext, voucherInput);
    console.log(`✅ Voucher posted: ${voucher.voucherNumber}`);

    // Compile DTO
    console.log('🧪 Compiling Invoice DTO...');
    const dto = await invoiceBuilder.buildInvoiceDtoFromVoucher(company.id, voucher.id);
    console.log('✅ DTO created & validated:', JSON.stringify(dto, null, 2));

    // Compile PDF to a file on disk
    console.log('🧪 Drawing Tax Invoice PDF to disk...');
    const pdfPath = path.join(__dirname, 'test-invoice.pdf');
    const writeStream = fs.createWriteStream(pdfPath);
    
    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    doc.pipe(writeStream);
    gstInvoiceTemplate.draw(doc, dto);
    doc.end();

    await new Promise<void>((resolve) => writeStream.on('finish', () => resolve()));
    
    console.log(`✅ PDF Tax Invoice generated successfully at: ${pdfPath}`);
    if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 0) {
      console.log(`✅ PDF file verified on disk: size = ${fs.statSync(pdfPath).size} bytes`);
    } else {
      throw new Error('PDF file empty or missing!');
    }

  } finally {
    // Clean up temporary company context
    console.log('\n🧹 Cleaning up test database records...');
    try {
      await db('vouchers').where({ company_id: company.id }).delete();
      await db('companies').where({ id: company.id }).delete();
      console.log('✅ Cleanup complete');
    } catch (cleanErr) {
      console.error('⚠️ Cleanup warning:', cleanErr);
    }
  }

  console.log('\n🎉 ALL INVOICE PDF GENERATION CHECKS PASSED! 🎉');
}

verifyPdfGeneration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
