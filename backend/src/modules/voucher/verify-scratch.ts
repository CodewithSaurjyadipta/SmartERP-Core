import fs from 'fs';

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

// Import using absolute paths
import { db } from '/Users/saurjyadiptamacbookair/Programming/Labmentix/SmartERP/backend/src/config/db';
import { voucherService } from '/Users/saurjyadiptamacbookair/Programming/Labmentix/SmartERP/backend/src/modules/voucher/voucher.service';

async function runTests() {
  console.log('🚀 Starting Backend Transaction Engine verification tests...');

  // 1. Setup - Find a seed user and create a temporary test company
  const user = await db('users').first();
  if (!user) {
    console.error('❌ Error: No users found in database to run tests. Register a user first.');
    process.exit(1);
  }
  console.log(`👤 Using user: ${user.email} (${user.id})`);

  // Create temporary test company
  const companyName = `Test Enterprise ${Date.now()}`;
  const [company] = await db('companies')
    .insert({
      name: companyName,
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

  // Seed default ledger groups
  const cashGroup = await db('ledger_groups').insert({
    company_id: company.id,
    name: 'Cash-in-Hand',
    nature: 'ASSETS',
    is_system: true,
  }).returning('*').then((rows: any[]) => rows[0]);

  const salesGroup = await db('ledger_groups').insert({
    company_id: company.id,
    name: 'Sales Accounts',
    nature: 'INCOME',
    is_system: true,
  }).returning('*').then((rows: any[]) => rows[0]);

  // Seed ledgers
  const [cashLedger] = await db('ledgers')
    .insert({
      company_id: company.id,
      name: 'Cash',
      ledger_group_id: cashGroup.id,
      opening_balance: 0,
      opening_balance_type: 'DEBIT',
    })
    .returning('*');

  const [salesLedger] = await db('ledgers')
    .insert({
      company_id: company.id,
      name: 'Sales A/c',
      ledger_group_id: salesGroup.id,
      opening_balance: 0,
      opening_balance_type: 'CREDIT',
    })
    .returning('*');

  console.log(`📝 Seeded ledgers: Cash (${cashLedger.id}), Sales A/c (${salesLedger.id})`);

  const clientContext = {
    userId: user.id,
    ipAddress: '127.0.0.1',
    userAgent: 'Node Test runner',
  };

  try {
    // ── Test 1: Post Balanced Voucher ────────────────────────
    console.log('\n🧪 Test 1: Posting balanced Journal voucher...');
    const voucherInput = {
      date: '2026-06-29',
      voucherType: 'JOURNAL' as const,
      narration: 'Balanced transaction log verification test',
      entries: [
        { ledgerId: cashLedger.id, entryType: 'DEBIT' as const, amount: 1500 },
        { ledgerId: salesLedger.id, entryType: 'CREDIT' as const, amount: 1500 },
      ],
    };

    const voucher = await voucherService.createVoucher(company.id, clientContext, voucherInput);
    console.log(`✅ Voucher posted successfully: ${voucher.voucherNumber}`);
    
    // Validate balance caching
    const cashBal = await db('ledger_balances').where({ ledger_id: cashLedger.id }).first();
    const salesBal = await db('ledger_balances').where({ ledger_id: salesLedger.id }).first();
    
    if (Number(cashBal?.balance) === 1500 && cashBal?.balance_type === 'DEBIT') {
      console.log('✅ Cash ledger balance cache correctly updated to DEBIT 1500');
    } else {
      throw new Error(`Invalid Cash cache balance: ${JSON.stringify(cashBal)}`);
    }

    if (Number(salesBal?.balance) === 1500 && salesBal?.balance_type === 'CREDIT') {
      console.log('✅ Sales ledger balance cache correctly updated to CREDIT 1500');
    } else {
      throw new Error(`Invalid Sales cache balance: ${JSON.stringify(salesBal)}`);
    }

    // ── Test 2: Unbalanced Voucher Rollback ───────────────────
    console.log('\n🧪 Test 2: Posting unbalanced voucher (Expect Rollback)...');
    const unbalancedInput = {
      date: '2026-06-29',
      voucherType: 'JOURNAL' as const,
      narration: 'Unbalanced check',
      entries: [
        { ledgerId: cashLedger.id, entryType: 'DEBIT' as const, amount: 1000 },
        { ledgerId: salesLedger.id, entryType: 'CREDIT' as const, amount: 800 },
      ],
    };

    try {
      await voucherService.createVoucher(company.id, clientContext, unbalancedInput);
      throw new Error('❌ Test Failed: Unbalanced voucher did not fail validation!');
    } catch (err: any) {
      console.log(`✅ Validation correctly rejected unbalanced input. Error message: "${err.message}"`);
      // Verify no records inserted
      const count = await db('vouchers').where({ company_id: company.id }).count('id as count').first();
      if (Number(count?.count) === 1) {
        console.log('✅ Rollback verified: database transaction clean, only 1 voucher exists.');
      } else {
        throw new Error(`Invalid voucher count post-rollback: ${count?.count}`);
      }
    }

    // ── Test 3: Cancel Voucher State & Zeroing ───────────────
    console.log('\n🧪 Test 3: Cancelling posted voucher...');
    await voucherService.cancelVoucher(company.id, clientContext, voucher.id, 'Testing cancellation');
    console.log('✅ Cancel service executed');

    // Verify voucher status and entries zeroed
    const cancelledVch = await db('vouchers').where({ id: voucher.id }).first();
    const cancelledEntries = await db('voucher_entries').where({ voucher_id: voucher.id });
    
    if (cancelledVch.status === 'CANCELLED' && Number(cancelledVch.total_amount) === 0) {
      console.log('✅ Voucher status transitioned to CANCELLED and total zeroed out');
    } else {
      throw new Error(`Voucher cancel status check failed: ${JSON.stringify(cancelledVch)}`);
    }

    const allZeroed = cancelledEntries.every((e: any) => Number(e.amount) === 0);
    if (allZeroed) {
      console.log('✅ Individual voucher entry rows successfully zeroed');
    } else {
      throw new Error(`Voucher entries not zeroed: ${JSON.stringify(cancelledEntries)}`);
    }

    // Verify balances returned to zero
    const cashBalCancelled = await db('ledger_balances').where({ ledger_id: cashLedger.id }).first();
    const salesBalCancelled = await db('ledger_balances').where({ ledger_id: salesLedger.id }).first();
    
    if (Number(cashBalCancelled?.balance) === 0 && Number(salesBalCancelled?.balance) === 0) {
      console.log('✅ Ledger balances cache successfully returned to 0');
    } else {
      throw new Error(`Balances cache not returned to 0: Cash=${cashBalCancelled?.balance}, Sales=${salesBalCancelled?.balance}`);
    }

  } finally {
    // ── Clean Up ─────────────────────────────────────────────
    console.log('\n🧹 Cleaning up test company...');
    try {
      await db('vouchers').where({ company_id: company.id }).delete();
      await db('companies').where({ id: company.id }).delete();
      console.log('✅ Cleanup complete');
    } catch (cleanErr) {
      console.error('⚠️ Cleanup warning:', cleanErr);
    }
  }

  console.log('\n🎉 ALL BACKEND TRANSACTION ENGINE TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test execution failed:', err);
    process.exit(1);
  });
