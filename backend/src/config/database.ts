import { Knex } from 'knex';
import path from 'path';
import { env } from './env';

// ============================================================
// Knex Database Configuration
// ============================================================

const isSSL = env.DATABASE_URL.includes('sslmode=require');

const sharedConfig: Knex.Config = {
  client: 'pg',
  connection: {
    connectionString: env.DATABASE_URL,
    ssl: isSSL ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: env.DATABASE_POOL_MIN,
    max: env.DATABASE_POOL_MAX,
  },
  migrations: {
    directory: path.join(__dirname, '../database/migrations'),
    tableName: 'knex_migrations',
    extension: 'ts',
  },
  seeds: {
    directory: path.join(__dirname, '../database/seeds'),
    extension: 'ts',
  },
};



const databaseConfig: Record<string, Knex.Config> = {
  development: {
    ...sharedConfig,
    debug: false,
  },
  production: {
    ...sharedConfig,
    pool: {
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX,
      acquireTimeoutMillis: 30000,
    },
  },
  test: {
    ...sharedConfig,
  },
};

export function getDatabaseConfig(): Knex.Config {
  return databaseConfig[env.NODE_ENV] || databaseConfig.development;
}

export default databaseConfig;
