import knex from 'knex';
import { getDatabaseConfig } from './database';

// ============================================================
// Knex Database Instance
// ============================================================
// Single shared Knex instance used by all repositories.
// ============================================================

export const db = knex(getDatabaseConfig());
