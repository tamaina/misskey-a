/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { userInfo } from 'node:os';
import { isAbsolute } from 'node:path';
import { DataSource } from 'typeorm';
import { expect, test } from 'vitest';
import { SessionUserIp1794700800000 } from '../../../../backend/migration/1794700800000-SessionUserIp.js';

// Explicit opt-in, dedicated disposable database only; never use the application config.
// This test is not run against the retained auth188 database.
const socket = process.env.MISSKEY_USER_IP_TEST_SOCKET;
test.skipIf(!socket)('PostgreSQL migration round trip, NULL uniqueness, upsert timestamps and session deletion', async () => {
	if (!socket || !isAbsolute(socket)) throw new Error('An absolute disposable PostgreSQL socket directory is required');
	const source = new DataSource({ type: 'postgres', host: socket, username: userInfo().username, database: 'session_ip_synthetic', synchronize: false });
	await source.initialize();
	const runner = source.createQueryRunner();
	try {
		await runner.startTransaction();
		// A private transactional schema allows testing the original migration SQL.
		await runner.query('CREATE SCHEMA session_ip_roundtrip');
		await runner.query('SET LOCAL search_path TO session_ip_roundtrip');
		await runner.query(`CREATE TABLE browser_session (id varchar(32) PRIMARY KEY, "userId" varchar(32), "lastIp" varchar(128), "lastUserAgent" varchar(1024), "lastUsedAt" timestamptz)`);
		await runner.query(`CREATE TABLE user_ip (id serial PRIMARY KEY, "userId" varchar(32) NOT NULL, ip varchar(128) NOT NULL, "createdAt" timestamptz NOT NULL)`);
		await runner.query(`CREATE UNIQUE INDEX "IDX_361b500e06721013c124b7b6c5" ON user_ip ("userId", ip)`);
		await runner.query(`INSERT INTO browser_session VALUES ('one', 'alice', '192.0.2.1', 'UA one', '2026-10-02T00:00:00Z'), ('two', 'alice', '192.0.2.1', 'UA two', '2026-10-03T00:00:00Z')`);
		await runner.query(`INSERT INTO user_ip ("userId", ip, "createdAt") VALUES ('alice', '192.0.2.1', '2026-10-01T00:00:00Z')`);
		const migration = new SessionUserIp1794700800000();
		await migration.up(runner);
		expect((await runner.query('SELECT * FROM user_ip')).length).toBe(3);
		// NULL must conflict just like a concrete session; neither creates a new row.
		const upsert = `INSERT INTO user_ip ("userId", ip, "browserSessionId", "createdAt", "lastSeenAt") VALUES ('alice', '192.0.2.1', $1, '2026-10-04T00:00:00Z', '2026-10-04T00:00:00Z') ON CONFLICT ("userId", ip, (COALESCE("browserSessionId", ''))) DO UPDATE SET "lastSeenAt" = EXCLUDED."lastSeenAt" RETURNING "createdAt", "lastSeenAt"`;
		for (const [session, firstSeen] of [[null, '2026-10-01'], ['one', '2026-10-02']] as const) {
			const [row] = await runner.query(upsert, [session]);
			expect(row.createdAt.toISOString()).toBe(`${firstSeen}T00:00:00.000Z`);
			expect(row.lastSeenAt.toISOString()).toBe('2026-10-04T00:00:00.000Z');
		}
		expect((await runner.query('SELECT * FROM user_ip')).length).toBe(3);
		await runner.query(`DELETE FROM browser_session WHERE id = 'one'`);
		const unlinked = await runner.query(`SELECT * FROM user_ip WHERE "browserSessionId" IS NULL`);
		expect(unlinked).toHaveLength(1);
		expect(unlinked[0].createdAt.toISOString()).toBe('2026-10-01T00:00:00.000Z');
		expect(unlinked[0].lastSeenAt.toISOString()).toBe('2026-10-04T00:00:00.000Z');
		await migration.down(runner);
		expect(await runner.query(`SELECT "lastIp", "lastUserAgent" FROM browser_session`)).toEqual([{ lastIp: '192.0.2.1', lastUserAgent: 'UA two' }]);
		expect((await runner.query('SELECT * FROM user_ip')).length).toBe(1);
		// A second up proves the original index/schema were restored by down.
		await migration.up(runner);
		expect((await runner.query('SELECT * FROM user_ip')).length).toBe(2);
	} finally {
		if (runner.isTransactionActive) await runner.rollbackTransaction();
		await runner.release();
		await source.destroy();
	}
});
