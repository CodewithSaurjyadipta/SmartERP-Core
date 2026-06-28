import 'dotenv/config';
import { Knex } from 'knex';
import path from 'path';
import fs from 'fs';
import { env } from './src/config/env';

// ============================================================
// Knex CLI Configuration
// ============================================================

class CustomMigrationSource {
  constructor(private directory: string) {}

  async getMigrations() {
    const absPath = path.resolve(__dirname, this.directory);
    if (!fs.existsSync(absPath)) return [];
    return fs.readdirSync(absPath)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.cjs'))
      .sort();
  }

  getMigrationName(migration: string) {
    return migration.replace(/\.ts$/, '.js');
  }

  getMigration(migration: string) {
    const absPath = path.resolve(__dirname, this.directory);
    return require(path.join(absPath, migration));
  }
}

const knexConfig: Record<string, Knex.Config> = {
  development: {
    client: 'pg',
    connection: env.DATABASE_URL,
    pool: {
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX,
    },
    migrations: {
      migrationSource: new CustomMigrationSource('./src/database/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
      extension: 'ts',
    },
  },
  production: {
    client: 'pg',
    connection: env.DATABASE_URL,
    pool: {
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX,
    },
    migrations: {
      migrationSource: new CustomMigrationSource('./src/database/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
      extension: 'js',
    },
  },
};

export default knexConfig;
