/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { DataSource } from 'typeorm';

/**
 * Check the selected database, not just NODE_ENV: a test process can still load
 * default.yml. Require a separate `test` name component (e.g. test-misskey),
 * so unrelated names such as contest or latest do not authorize a reset.
 * Adapted from misskey-juice 3d1ffac20040a62516af6a1044c778d3e80a9af9.
 */
export function assertTestDatabaseName(database: unknown, context: string) {
	if (typeof database !== 'string' || !/(^|[-_])test($|[-_])/.test(database)) {
		throw new Error(`${context}: refusing to reset/sync a database without a separate "test" name component (database=${String(database)}). Check the loaded config (test.yml / MISSKEY_CONFIG_YML), not only NODE_ENV.`);
	}
}

export function assertTestDatabaseOptions(options: DataSource['options'], context = 'resetDb') {
	if (process.env.NODE_ENV !== 'test') throw new Error('NODE_ENV is not a test');
	assertTestDatabaseName(options.database, context);
	// These alternative connection settings can override options.database in
	// TypeORM/pg. Test fixtures use one explicit PostgreSQL database; fail closed
	// for overrides rather than approve a name that is not the selected target.
	if (options.type !== 'postgres'
		|| options.url !== undefined
		|| options.replication !== undefined
		|| (options.extra != null && ['database', 'connectionString'].some(key => Object.hasOwn(options.extra, key)))) {
		throw new Error(`${context}: refusing to reset/sync an ambiguous database target. Use an explicit PostgreSQL database without URL, replication, or extra database/connectionString overrides.`);
	}
}

export function assertTestDatabase(db: DataSource) {
	assertTestDatabaseOptions(db.options);
}

export async function resetDb(db: DataSource) {
	assertTestDatabase(db);

	const reset = async () => {
		const tables = await db.query(`SELECT relname AS "table"
		FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
		WHERE nspname NOT IN ('pg_catalog', 'information_schema')
			AND C.relkind = 'r'
			AND nspname !~ '^pg_toast';`);
		for (const table of tables) {
			await db.query(`DELETE FROM "${table.table}" CASCADE`);
		}
	};

	for (let i = 1; i <= 3; i++) {
		try {
			await reset();
		} catch (e) {
			if (i === 3) {
				throw e;
			} else {
				await new Promise(resolve => setTimeout(resolve, 1000));
				continue;
			}
		}
		break;
	}
}
