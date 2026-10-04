import {
  CapacitorSQLite,
  SQLiteConnection,
  type capSQLiteVersionUpgrade,
  type SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import journal from './migrations/meta/_journal.json';
import * as schema from './schema';

const DB_NAME = 'maroonrides.db';
const DB_ENCRYPTION_MODE = 'no-encryption';
const MIGRATION_BREAKPOINT = '--> statement-breakpoint';
const WEB_STORE_ELEMENT = 'jeep-sqlite';
const IS_WEB = Capacitor.getPlatform() === 'web';

// The statements drizzle's db.transaction() sends through the proxy.
export const TRANSACTION_SQL = { BEGIN: 'begin', COMMIT: 'commit', ROLLBACK: 'rollback' } as const;

const migrationFiles = import.meta.glob<string>('./migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function migrations(): capSQLiteVersionUpgrade[] {
  return journal.entries.map((entry) => ({
    toVersion: entry.idx + 1,
    statements: migrationFiles[`./migrations/${entry.tag}.sql`]
      .split(MIGRATION_BREAKPOINT)
      .map((statement) => statement.trim())
      .filter(Boolean),
  }));
}

async function installWebStore(sqlite: SQLiteConnection) {
  const { defineCustomElements } = await import('jeep-sqlite/loader');
  defineCustomElements(window);

  const element = document.body.appendChild(document.createElement(WEB_STORE_ELEMENT));
  element.autoSave = true;

  // whenDefined resolves before the lazy component loads and opens its IndexedDB store.
  await customElements.whenDefined(WEB_STORE_ELEMENT);
  await element.componentOnReady();
  await sqlite.initWebStore();
}

class Database {
  readonly #sqlite = new SQLiteConnection(CapacitorSQLite);
  #connection: Promise<SQLiteDBConnection> | null = null;

  // sqlite-proxy expects rows as arrays in select order, the plugin returns objects keyed by column.
  readonly db = drizzle(
    async (sql, params, method) => {
      const connection = await this.#connect();
      if (method === 'run') {
        await this.#run(connection, sql, params);
        return { rows: [] };
      }

      const { values = [] } = await connection.query(sql, params);
      const rows = values.map((row) => Object.values(row));
      return { rows: method === 'get' ? rows[0] : rows };
    },
    { schema },
  );

  // The plugin's own transaction calls let web hold off saving to IndexedDB until the commit.
  async #run(connection: SQLiteDBConnection, sql: string, params: unknown[]) {
    switch (sql) {
      case TRANSACTION_SQL.BEGIN:
        return connection.beginTransaction();
      case TRANSACTION_SQL.COMMIT:
        await connection.commitTransaction();
        // saveToStore is the one call that does not strip ".db" from the name, so pass the connection's.
        if (IS_WEB) await this.#sqlite.saveToStore(connection.getConnectionDBName());
        return;
      case TRANSACTION_SQL.ROLLBACK:
        return connection.rollbackTransaction();
      default:
        return connection.run(sql, params, false);
    }
  }

  #connect(): Promise<SQLiteDBConnection> {
    this.#connection ??= this.#open().catch((error) => {
      this.#connection = null;
      throw error;
    });
    return this.#connection;
  }

  async #open() {
    if (IS_WEB) await installWebStore(this.#sqlite);

    const upgrades = migrations();
    await this.#sqlite.addUpgradeStatement(DB_NAME, upgrades);

    // A reload leaves the last page's native connection open, and reusing it would skip new
    // migrations. With no connections of its own yet, this closes it.
    await this.#sqlite.checkConnectionsConsistency();

    const connection = await this.#sqlite.createConnection(
      DB_NAME,
      false,
      DB_ENCRYPTION_MODE,
      upgrades.length,
      false,
    );
    await connection.open();
    return connection;
  }
}

export const db = new Database().db;
