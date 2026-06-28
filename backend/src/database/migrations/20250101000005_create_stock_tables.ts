import { Knex } from 'knex';

// ============================================================
// Migration: Create stock_groups and stock_items tables
// ============================================================

export async function up(knex: Knex): Promise<void> {
  // 1. Create stock_groups table
  await knex.schema.createTable('stock_groups', (table) => {
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
      .inTable('stock_groups')
      .onDelete('SET NULL');
    
    // Audit & Soft Delete Columns
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('deleted_at', { useTz: true }).nullable();
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

    table.unique(['company_id', 'name']);
  });

  // 2. Create stock_items table
  await knex.schema.createTable('stock_items', (table) => {
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
      .uuid('stock_group_id')
      .nullable()
      .references('id')
      .inTable('stock_groups')
      .onDelete('SET NULL');
    table
      .uuid('unit_id')
      .nullable()
      .references('id')
      .inTable('units')
      .onDelete('SET NULL');
    table
      .uuid('tax_rate_id')
      .nullable()
      .references('id')
      .inTable('tax_rates')
      .onDelete('SET NULL');
    table.string('hsn_code', 8).nullable();

    // Opening balances (static, not dynamic stock counts)
    table.decimal('opening_qty', 18, 3).notNullable().defaultTo(0);
    table.decimal('opening_rate', 18, 2).notNullable().defaultTo(0);
    table.decimal('opening_value', 18, 2).notNullable().defaultTo(0);

    // Pricing
    table.decimal('standard_selling_price', 18, 2).nullable();
    table.decimal('standard_purchase_price', 18, 2).nullable();
    table.decimal('mrp', 18, 2).nullable();

    // Inventory levels
    table.decimal('reorder_level', 18, 3).notNullable().defaultTo(0);
    table.decimal('minimum_qty', 18, 3).notNullable().defaultTo(0);

    // Audit & Soft Delete Columns
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('deleted_at', { useTz: true }).nullable();
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

    table.unique(['company_id', 'name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('stock_items');
  await knex.schema.dropTableIfExists('stock_groups');
}
