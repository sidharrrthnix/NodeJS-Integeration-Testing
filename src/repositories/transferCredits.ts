import { Pool } from 'pg';
import { query } from '../db/query';
import { withTransaction } from '../db/transaction';
import { BadRequestError, NotFoundError } from '../errors/httpErrors';
import { User } from './user.types';
import { UserRepository } from './UserRepository';

export async function transferCredits(
  pool: Pool,
  params: { fromUserId: string; toUserId: string; amount: number },
): Promise<{ from: User; to: User }> {
  const { fromUserId, toUserId, amount } = params;

  if (fromUserId === toUserId) {
    throw new BadRequestError('From and to user IDs cannot be the same');
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new BadRequestError('Amount must be a positive integer');
  }
  const repo = new UserRepository(pool);
  return withTransaction(pool, async (tx) => {
    const ids = [fromUserId, toUserId].sort();

    const locked = await query<{ id: string; credits: number }>(
      tx,
      `SELECT id, credits FROM users WHERE id = ANY($1::uuid[]) FOR UPDATE`,
      [ids],
    );

    if (locked.rows.length !== 2) {
      const found = new Set(locked.rows.map((r) => r.id));
      if (!found.has(fromUserId)) {
        throw new NotFoundError(`User ${fromUserId} not found`);
      }
      if (!found.has(toUserId)) {
        throw new NotFoundError(`User ${toUserId} not found`);
      }
      throw new NotFoundError('Users not found');
    }

    const [from, to] = locked.rows;
    if (from!.credits < amount) {
      throw new BadRequestError('Insufficient credits');
    }

    await query(tx, `UPDATE users SET credits = credits - $1 WHERE id = $2`, [amount, fromUserId]);
    await query(tx, `UPDATE users SET credits = credits + $1 WHERE id = $2`, [amount, toUserId]);

    const fromAfter = await repo.findById(fromUserId, tx);
    const toAfter = await repo.findById(toUserId, tx);
    if (!fromAfter || !toAfter) {
      throw new NotFoundError('Users not found');
    }

    return { from: fromAfter, to: toAfter };
  });
}
