import { Pool, PoolConfig } from 'pg';
import { env } from '../lib/env';

export function createPool(overrides: Partial<PoolConfig> = {}) {
  const base: PoolConfig = {
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT,
    connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT,
    application_name: env.APP_NAME,
    ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
    allowExitOnIdle: true,
  };
  const pool = new Pool({ ...base, ...overrides });

  pool.on('error', (err) => {
    console.error('[db] pool error', err);
  });

  pool.on('connect', () => {
    console.log('[db] pool connected');
  });

  pool.on('remove', () => {
    console.log('[db] pool disconnected');
  });

  return pool;
}

export const pool = createPool();
