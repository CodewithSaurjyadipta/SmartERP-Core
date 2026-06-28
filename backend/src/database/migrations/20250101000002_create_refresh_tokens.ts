import { Knex } from 'knex';

// ============================================================
// Migration: Create refresh_tokens table
// ============================================================

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('refresh_tokens', (table) => {
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
      .string('token_hash', 255)
      .notNullable();
    table
      .timestamp('expires_at', { useTz: true })
      .notNullable();
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('revoked_at', { useTz: true })
      .nullable();

    // Indexes
    table.index('user_id', 'idx_refresh_tokens_user');
    table.index('token_hash', 'idx_refresh_tokens_hash');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('refresh_tokens');
}
