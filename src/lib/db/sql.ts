import { sql } from 'drizzle-orm';

export const TODAY_SQL = sql`date('now', 'localtime')`;
