import { query, Queryable } from './query';

export async function ensureSchema(db: Queryable): Promise<void> {
  await query<any>(
    db,
    `
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      name text NOT NULL,
      date_of_birth date NOT NULL,
      role VARCHAR (50) NOT NULL DEFAULT 'user',
      credits integer NOT NULL DEFAULT 0 CHECK (credits >= 0),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    `,
  );

  await query<any>(db, `CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);`);
  await query<any>(db, `CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);`);
}
