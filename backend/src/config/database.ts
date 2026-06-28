import { Knex } from 'knex';
import path from 'path';
import fs from 'fs';
import { env } from './env';

// ============================================================
// Knex Database Configuration
// ============================================================

const isSSL = env.DATABASE_URL.includes('sslmode=require');

class CustomMigrationSource {
  constructor(private directory: string) {}

  async getMigrations() {
    if (!fs.existsSync(this.directory)) return [];
    return fs.readdirSync(this.directory)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.cjs'))
      .sort();
  }

  getMigrationName(migration: string) {
    return migration.replace(/\.ts$/, '.js');
  }

  getMigration(migration: string) {
    return require(path.join(this.directory, migration));
  }
}

const migrationsDir = path.join(__dirname, '../database/migrations');

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
    migrationSource: new CustomMigrationSource(migrationsDir),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, '../database/seeds'),
    extension: env.NODE_ENV === 'production' ? 'js' : 'ts',
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
