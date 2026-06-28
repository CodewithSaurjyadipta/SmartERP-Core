import { Knex } from 'knex';

// ============================================================
// Migration: Create users table
// ============================================================

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('users', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));
    table
      .string('email', 255)
      .notNullable()
      .unique();
    table
      .string('password_hash', 255)
      .notNullable();
    table
      .string('full_name', 255)
      .notNullable();
    table
      .string('phone', 20)
      .nullable();
    table
      .boolean('is_active')
      .notNullable()
      .defaultTo(true);
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
