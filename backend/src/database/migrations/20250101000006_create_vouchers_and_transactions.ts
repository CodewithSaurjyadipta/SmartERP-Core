import { Knex } from 'knex';

// ============================================================
// Migration: Create Transaction Engine & Vouchers Tables
// ============================================================

export async function up(knex: Knex): Promise<void> {
  // 1. Vouchers (Header) Table
  await knex.schema.createTable('vouchers', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('company_id')
      .notNullable()
      .references('id')
      .inTable('companies')
      .onDelete('CASCADE');
    table.string('voucher_number', 255).notNullable();
    table.string('voucher_type', 20).notNullable(); // CONTRA, PAYMENT, RECEIPT, JOURNAL, SALES, PURCHASE
    table.string('status', 20).notNullable().defaultTo('DRAFT'); // DRAFT, POSTED, CANCELLED, REVERSED
    table.date('date').notNullable();
    table.text('narration').nullable();
    table.string('reference_number', 255).nullable();
    table.decimal('total_amount', 18, 2).notNullable().defaultTo(0);
    
    // Audit relationships
    table
      .uuid('created_by')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .uuid('updated_by')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
      
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    // Voucher numbers must be unique per company
    table.unique(['company_id', 'voucher_number']);
  });

  // 2. Voucher Entries (Double-Entry Ledger Transactions) Table
  await knex.schema.createTable('voucher_entries', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('voucher_id')
      .notNullable()
      .references('id')
      .inTable('vouchers')
      .onDelete('CASCADE');
    table
      .uuid('ledger_id')
      .notNullable()
      .references('id')
      .inTable('ledgers')
      .onDelete('RESTRICT');
    table.string('entry_type', 6).notNullable(); // DEBIT, CREDIT
    table.decimal('amount', 18, 2).notNullable();
    table.string('narration', 255).nullable();
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  // 3. Stock Movements (Inventory Log) Table
  await knex.schema.createTable('stock_movements', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('voucher_id')
      .notNullable()
      .references('id')
      .inTable('vouchers')
      .onDelete('CASCADE');
    table
      .uuid('stock_item_id')
      .notNullable()
      .references('id')
      .inTable('stock_items')
      .onDelete('RESTRICT');
    table.string('movement_type', 10).notNullable(); // INWARD, OUTWARD
    table.decimal('qty', 18, 3).notNullable();
    table.decimal('rate', 18, 2).notNullable();
    table.decimal('amount', 18, 2).notNullable();
    
    // GST Tax Fields
    table.decimal('cgst_rate', 5, 2).notNullable().defaultTo(0);
    table.decimal('cgst_amount', 18, 2).notNullable().defaultTo(0);
    table.decimal('sgst_rate', 5, 2).notNullable().defaultTo(0);
    table.decimal('sgst_amount', 18, 2).notNullable().defaultTo(0);
    table.decimal('igst_rate', 5, 2).notNullable().defaultTo(0);
    table.decimal('igst_amount', 18, 2).notNullable().defaultTo(0);
    
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  // 4. Ledger Balances (Cached Totals Optimization) Table
  await knex.schema.createTable('ledger_balances', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('company_id')
      .notNullable()
      .references('id')
      .inTable('companies')
      .onDelete('CASCADE');
    table
      .uuid('ledger_id')
      .notNullable()
      .references('id')
      .inTable('ledgers')
      .onDelete('CASCADE');
    table.decimal('balance', 18, 2).notNullable().defaultTo(0);
    table.string('balance_type', 6).notNullable().defaultTo('DEBIT'); // DEBIT, CREDIT
    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.unique(['company_id', 'ledger_id']);
  });

  // 5. Audit Logs Table
  await knex.schema.createTable('audit_logs', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('company_id')
      .notNullable()
      .references('id')
      .inTable('companies')
      .onDelete('CASCADE');
    table
      .uuid('user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.string('action', 50).notNullable(); // e.g. VOUCHER_POST, VOUCHER_CANCEL, VOUCHER_REVERSE
    table.string('entity_type', 50).notNullable(); // e.g. VOUCHER
    table.uuid('entity_id').notNullable();
    table.jsonb('old_values').nullable();
    table.jsonb('new_values').nullable();
    table.text('reason').nullable();
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  // 6. Event Outbox Table (Outbox Pattern)
  await knex.schema.createTable('event_outbox', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('company_id')
      .notNullable()
      .references('id')
      .inTable('companies')
      .onDelete('CASCADE');
    table.string('event_type', 100).notNullable(); // e.g. voucher.posted, voucher.cancelled
    table.jsonb('payload').notNullable();
    table.string('status', 20).notNullable().defaultTo('PENDING'); // PENDING, PROCESSED, FAILED
    table.integer('attempts').notNullable().defaultTo(0);
    table.text('error').nullable();
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.timestamp('processed_at', { useTz: true }).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('event_outbox');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('ledger_balances');
  await knex.schema.dropTableIfExists('stock_movements');
  await knex.schema.dropTableIfExists('voucher_entries');
  await knex.schema.dropTableIfExists('vouchers');
}
