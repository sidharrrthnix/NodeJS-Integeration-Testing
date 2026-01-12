import { randomUUID } from 'crypto';
import { query, Queryable } from '../db/query';
import { BadRequestError } from '../errors/httpErrors';
import { CreateUserParams, UpdateUserPatch, User, UserWithPassword } from './user.types';

type UserRow = {
  id: string;
  email: string;
  name: string;
  date_of_birth: string;
  credits: number;
  created_at: Date | string;
  updated_at: Date | string;
  password_hash?: string;
};

function toIso(v: Date | string): string {
  return (v instanceof Date ? v : new Date(v)).toISOString();
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    dateOfBirth: row.date_of_birth,
    credits: row.credits,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function rowToUserWithPassword(row: UserRow): UserWithPassword {
  return {
    ...rowToUser(row),
    passwordHash: row.password_hash!,
  };
}

export class UserRepository {
  constructor(private readonly db: Queryable) {}

  async create(params: CreateUserParams, db: Queryable = this.db): Promise<User> {
    const id = params.id ?? randomUUID();
    const email = params.email.toLowerCase();
    const credits = params.credits ?? 0;

    const res = await query<UserRow>(
      db,
      `
      INSERT INTO users (id, email, password_hash, name, date_of_birth, credits)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name, date_of_birth, credits, created_at, updated_at
      `,
      [id, email, params.passwordHash, params.name, params.dateOfBirth, credits],
    );

    return rowToUser(res.rows[0]!);
  }

  async findById(id: string, db: Queryable = this.db): Promise<User | null> {
    const res = await query<UserRow>(
      db,
      `SELECT id, email, name, date_of_birth, credits, created_at, updated_at FROM users WHERE id = $1`,
      [id],
    );
    return res.rows.length > 0 ? rowToUser(res.rows[0]!) : null;
  }

  async findByEmail(email: string, db: Queryable = this.db): Promise<UserWithPassword | null> {
    const res = await query<UserRow>(
      db,
      `SELECT id, email, password_hash, name, date_of_birth, credits, created_at, updated_at FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );
    return res.rows.length > 0 ? rowToUserWithPassword(res.rows[0]!) : null;
  }

  async findAll(db: Queryable = this.db): Promise<User[]> {
    const res = await query<UserRow>(
      db,
      `SELECT id, email, name, date_of_birth, credits, created_at, updated_at FROM users ORDER BY created_at DESC`,
      [],
    );
    return res.rows.map(rowToUser);
  }

  async update(id: string, patch: UpdateUserPatch, db: Queryable = this.db): Promise<User | null> {
    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    if (patch.email !== undefined) {
      sets.push(`email = $${i++}`);
      values.push(patch.email.toLowerCase());
    }
    if (patch.passwordHash !== undefined) {
      sets.push(`password_hash = $${i++}`);
      values.push(patch.passwordHash);
    }
    if (patch.name !== undefined) {
      sets.push(`name = $${i++}`);
      values.push(patch.name);
    }
    if (patch.dateOfBirth !== undefined) {
      sets.push(`date_of_birth = $${i++}`);
      values.push(patch.dateOfBirth);
    }
    if (sets.length === 0) return null;
    const setClause = sets.join(', ');
    const res = await query<UserRow>(
      db,
      `UPDATE users SET ${setClause} WHERE id = $${i} RETURNING id, email, name, date_of_birth, credits, created_at, updated_at`,
      [...values, id],
    );
    return res.rows.length > 0 ? rowToUser(res.rows[0]!) : null;
  }

  async delete(id: string, db: Queryable = this.db): Promise<boolean> {
    const res = await query<UserRow>(db, `DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
    if (res.rows.length === 0) {
      throw new BadRequestError('User not found');
    }
    return true;
  }
  async list(
    opts: { limit?: number; offset?: number } = {},
    db: Queryable = this.db,
  ): Promise<User[]> {
    const limit = opts.limit ?? 20;
    const offset = opts.offset ?? 0;

    const result = await query<UserRow>(
      db,
      `SELECT id, email, name, date_of_birth, credits, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return result.rows.map(rowToUser);
  }
}
