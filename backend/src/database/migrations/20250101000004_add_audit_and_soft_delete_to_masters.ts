import { Knex } from 'knex';

// ============================================================
// Migration: Add audit and soft-delete fields to existing master tables
// ============================================================

export async function up(knex: Knex): Promise<void> {
  // 1. Alter ledger_groups
  await knex.schema.alterTable('ledger_groups', (table) => {
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
  });

  // Helper to alter other tables
  const tablesToAlter = ['ledgers', 'tax_rates', 'units', 'financial_years'];

  for (const tableName of tablesToAlter) {
    await knex.schema.alterTable(tableName, (table) => {
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
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const tablesToAlter = ['ledgers', 'tax_rates', 'units', 'financial_years'];

  for (const tableName of tablesToAlter) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn('created_by');
      table.dropColumn('updated_by');
      table.dropColumn('deleted_at');
    });
  }

  await knex.schema.alterTable('ledger_groups', (table) => {
    table.dropColumn('created_by');
    table.dropColumn('updated_by');
    table.dropColumn('deleted_at');
    table.dropColumn('is_active');
  });
}
