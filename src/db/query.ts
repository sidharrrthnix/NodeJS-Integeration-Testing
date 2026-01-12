import type { QueryResult } from 'pg';
import { BadRequestError, ConflictError, ServiceUnavailableError } from '../errors/httpErrors';

export interface Queryable {
  query<T extends Record<string, any>>(
    text: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<T>>;
}

type PgErrorLike = {
  code: string;
  message: string;
  detail?: string;
  table?: string;
  constraint?: string;
};

export function isPgErrorLike(err: unknown): err is PgErrorLike {
  return typeof err === 'object' && err !== null && 'code' in err && 'message' in err;
}

export function withCause<E extends Error>(err: E, cause: unknown): E {
  err.cause = cause;
  return err;
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

export function mapDbError(err: unknown): unknown {
  // ✅ Fixed: Handle transient errors first (connection issues)
  if (isTransientError(err)) {
    return withCause(new ServiceUnavailableError('Database connection failed'), err);
  }

  // ✅ Then handle Postgres-specific errors
  if (!isPgErrorLike(err)) {
    return withCause(new ServiceUnavailableError('Database error'), err);
  }

  const e = err as PgErrorLike;
  switch (e.code) {
    case '23505':
      return withCause(new ConflictError('Unique constraint violation'), err);
    case '23503':
      return withCause(new BadRequestError('ForeignKey constraint violation'), err);
    case '22P02':
      return withCause(new BadRequestError('Invalid text representation'), err);
    case '23514':
      return withCause(new BadRequestError('Integrity constraint violation'), err);
    default:
      return withCause(new ServiceUnavailableError('Database error'), err);
  }
}

export async function query<T extends Record<string, any>>(
  db: Queryable,
  text: string,
  params?: readonly unknown[],
): Promise<QueryResult<T>> {
  try {
    return await db.query<T>(text, params);
  } catch (err) {
    throw mapDbError(err);
  }
}
