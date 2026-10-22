import { route } from '$lib/db/schema';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { describe, expect, it } from 'vitest';
import { TRANSACTION_SQL } from './database';

function recordingDb() {
  const statements: string[] = [];
  const db = drizzle(async (sql) => {
    statements.push(sql);
    return { rows: [] };
  });
  return { db, statements };
}

describe('drizzle transactions', () => {
  it('send the statements the database maps to plugin transactions', async () => {
    const { db, statements } = recordingDb();

    await db.transaction(async (tx) => {
      await tx.delete(route);
    });

    expect(statements).toEqual([
      TRANSACTION_SQL.BEGIN,
      'delete from "route"',
      TRANSACTION_SQL.COMMIT,
    ]);
  });

  it('roll back with the mapped statement when the callback throws', async () => {
    const { db, statements } = recordingDb();

    await expect(
      db.transaction(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(statements).toEqual([TRANSACTION_SQL.BEGIN, TRANSACTION_SQL.ROLLBACK]);
  });
});
