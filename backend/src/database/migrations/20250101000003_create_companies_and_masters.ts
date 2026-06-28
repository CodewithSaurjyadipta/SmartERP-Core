import { Knex } from 'knex';

// ============================================================
// Migration: Create Companies & Master Data Tables
// ============================================================

export async function up(knex: Knex): Promise<void> {
  // 1. Companies Table
  await knex.schema.createTable('companies', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('legal_name', 255).nullable();
    table.string('gstin', 15).nullable();
    table.string('pan', 10).nullable();
    table.string('address_line1', 255).nullable();
    table.string('address_line2', 255).nullable();
    table.string('city', 100).nullable();
    table.string('state_code', 2).nullable();
    table.string('state_name', 100).nullable();
    table.string('pincode', 6).nullable();
    table.string('phone', 20).nullable();
    table.string('email', 255).nullable();
    table.string('website', 255).nullable();
    table.date('financial_year_start').notNullable();
    table.date('books_from').notNullable();
    table.string('base_currency', 3).notNullable().defaultTo('INR');
    table.boolean('is_active').notNullable().defaultTo(true);
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  // 2. User-Company Mapping (Multi-tenancy Link)
  await knex.schema.createTable('user_companies', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .uuid('company_id')
      .notNullable()
      .references('id')
      .inTable('companies')
      .onDelete('CASCADE');
    table
      .string('role', 20)
      .notNullable()
      .defaultTo('OWNER'); // OWNER, ADMIN, ACCOUNTANT, VIEWER
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.unique(['user_id', 'company_id']);
  });

  // 3. Financial Years Table
  await knex.schema.createTable('financial_years', (table) => {
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
    table.string('name', 20).notNullable(); // e.g. "2025-2026"
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.unique(['company_id', 'name']);
  });

  // 4. Ledger Groups Table
  await knex.schema.createTable('ledger_groups', (table) => {
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
    table.string('name', 255).notNullable();
    table
      .uuid('parent_id')
      .nullable()
      .references('id')
      .inTable('ledger_groups')
      .onDelete('SET NULL');
    table
      .string('nature', 20)
      .notNullable(); // ASSETS, LIABILITIES, INCOME, EXPENSE
    table.boolean('is_system').notNullable().defaultTo(false);
    table.boolean('affects_gp').notNullable().defaultTo(false);
    table.integer('sequence_order').notNullable().defaultTo(0);
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.unique(['company_id', 'name']);
  });

  // 5. Ledgers Table
  await knex.schema.createTable('ledgers', (table) => {
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
    table.string('name', 255).notNullable();
    table
      .uuid('ledger_group_id')
      .notNullable()
      .references('id')
      .inTable('ledger_groups')
      .onDelete('RESTRICT');
    table.decimal('opening_balance', 18, 2).notNullable().defaultTo(0);
    table.string('opening_balance_type', 6).nullable(); // DEBIT, CREDIT
    
    // Contact & GST Info (for customers/suppliers/banks/etc.)
    table.string('contact_name', 255).nullable();
    table.string('phone', 20).nullable();
    table.string('email', 255).nullable();
    table.string('gstin', 15).nullable();
    table.string('pan', 10).nullable();
    table.string('address_line1', 255).nullable();
    table.string('address_line2', 255).nullable();
    table.string('city', 100).nullable();
    table.string('state_code', 2).nullable();
    table.string('state_name', 100).nullable();
    table.string('pincode', 6).nullable();
    table.string('gst_registration_type', 20).nullable(); // REGULAR, COMPOSITION, UNREGISTERED, CONSUMER
    
    table.boolean('is_active').notNullable().defaultTo(true);
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.unique(['company_id', 'name']);
  });

  // 6. Tax Rates Table
  await knex.schema.createTable('tax_rates', (table) => {
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
    table.string('name', 100).notNullable(); // e.g. "GST 18%"
    table.string('hsn_sac_code', 8).nullable();
    table.string('tax_type', 10).notNullable().defaultTo('GST'); // GST, EXEMPT, NIL
    table.decimal('cgst_rate', 5, 2).notNullable().defaultTo(0);
    table.decimal('sgst_rate', 5, 2).notNullable().defaultTo(0);
    table.decimal('igst_rate', 5, 2).notNullable().defaultTo(0);
    table.decimal('cess_rate', 5, 2).notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.unique(['company_id', 'name']);
  });

  // 7. Units Table
  await knex.schema.createTable('units', (table) => {
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
    table.string('name', 50).notNullable(); // e.g. "Pieces"
    table.string('symbol', 10).notNullable(); // e.g. "PCS"
    table.integer('decimal_places').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.unique(['company_id', 'symbol']);
  });

  // 8. Voucher Sequences Table
  await knex.schema.createTable('voucher_sequences', (table) => {
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
    table.string('voucher_type', 20).notNullable(); // SALES, PURCHASE, RECEIPT, PAYMENT, JOURNAL, etc.
    table.string('financial_year', 9).notNullable(); // e.g. "2025-2026"
    table.string('prefix', 10).notNullable(); // e.g. "SV-", "PV-"
    table.integer('last_number').notNullable().defaultTo(0);
    table.integer('padding').notNullable().defaultTo(5);

    table.unique(['company_id', 'voucher_type', 'financial_year']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('voucher_sequences');
  await knex.schema.dropTableIfExists('units');
  await knex.schema.dropTableIfExists('tax_rates');
  await knex.schema.dropTableIfExists('ledgers');
  await knex.schema.dropTableIfExists('ledger_groups');
  await knex.schema.dropTableIfExists('financial_years');
  await knex.schema.dropTableIfExists('user_companies');
  await knex.schema.dropTableIfExists('companies');
}
