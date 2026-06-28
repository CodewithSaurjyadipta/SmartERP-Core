import 'dotenv/config';
import { Knex } from 'knex';
import { env } from './src/config/env';

// ============================================================
// Knex CLI Configuration
// ============================================================

const knexConfig: Record<string, Knex.Config> = {
  development: {
    client: 'pg',
    connection: env.DATABASE_URL,
    pool: {
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
      extension: 'ts',
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
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './src/database/seeds',
      extension: 'ts',
    },
  },
};

export default knexConfig;
