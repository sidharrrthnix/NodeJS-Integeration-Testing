import { Pool, PoolClient } from 'pg';
import { env } from '../lib/env';
import { isPgErrorLike } from './query';
export type IsolationLevel = 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';

export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  retries?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isTransientError(err: unknown): boolean {
  const e = err as NodeJS.ErrnoException;
  const codes = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'EPIPE',
  ]);
  return typeof e === 'object' && e !== null && typeof e.code === 'string' && codes.has(e.code);
}

export function isRetryablePgError(err: unknown): boolean {
  if (!isPgErrorLike(err)) {
    return false;
  }
  return err.code === '40P01' || err.code === '40P02';
}

async function connectWithRetry(pool: Pool): Promise<PoolClient> {
  const max = env.DB_CONNECT_RETRIES;
  const baseDelay = env.DB_CONNECT_RETRY_BASE_DELAY;

  for (let attempt = 0; ; attempt++) {
    try {
      return await pool.connect();
    } catch (err) {
      const canRetry = isTransientError(err) && attempt < max;
      if (!canRetry) {
        throw err;
      }
      await sleep(baseDelay * Math.pow(2, attempt));
    }
  }
}

export async function withTransaction<T>(
  pool: Pool,
  fn: (tx: PoolClient) => Promise<T>,
  opts: TransactionOptions = {},
): Promise<T> {
  const retries = opts.retries ?? 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const client = await connectWithRetry(pool);

    try {
      await client.query('BEGIN');
      if (opts.isolationLevel) {
        await client.query(`SET TRANSACTION ISOLATION LEVEL ${opts.isolationLevel}`);
      }

      const result = await fn(client);

      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // ignore rollback failures
      }

      const shouldRetry = attempt < retries && isRetryablePgError(err);
      if (shouldRetry) {
        await sleep(10 * Math.pow(2, attempt));
        continue;
      }

      throw err;
    } finally {
      client.release();
    }
  }

  throw new Error('withTransaction: exceeded retries');
}
