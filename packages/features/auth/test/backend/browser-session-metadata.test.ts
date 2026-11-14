/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { DataSource, IsNull } from 'typeorm';
import type { QueryRunner } from 'typeorm';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { BrowserSessionHistory1794614400000 } from '../../../../backend/migration/1794614400000-BrowserSessionHistory.js';
import { MiSignin } from '../../backend/models/Signin.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { SudoPolicy1792300000001 } from '../../../../backend/migration/1792300000001-SudoPolicy.js';
import { BrowserSession1791849600000 } from '../../../../backend/migration/1791849600000-BrowserSession.js';

class MetadataSource extends DataSource {
	public async prepare(): Promise<void> {
		await this.buildMetadatas();
	}
}

test('browser session entity metadata matches the additive migrations without connecting to a database', async () => {
	const source = new MetadataSource({ type: 'postgres', entities, synchronize: false, dropSchema: false });
	await source.prepare();
	const metadata = source.getMetadata(MiBrowserSession);
	expect(metadata.tableName).toBe('browser_session');
	expect(metadata.columns.map(column => column.databaseName)).toEqual(['id', 'userId', 'tokenHash', 'createdAt', 'lastUsedAt', 'lastUserAgent', 'revokedAt', 'sudoUntil', 'sudoGrantId', 'sudoPolicyStamp']);
	expect(metadata.primaryColumns[0].primaryKeyConstraintName).toBe('PK_browser_session');
	expect(metadata.foreignKeys[0]).toMatchObject({ name: 'FK_browser_session_userId', onDelete: 'CASCADE', referencedTablePath: 'user' });
	expect(metadata.indices.map(index => ({ name: index.name, unique: index.isUnique }))).toEqual([
		{ name: 'IDX_browser_session_userId', unique: false },
		{ name: 'IDX_browser_session_tokenHash', unique: true },
	]);
	expect(metadata.findColumnWithPropertyName('tokenHash')).toMatchObject({ isSelect: false, length: '64', isNullable: false });
	const runner = mockDeep<QueryRunner>();
	const migration = new BrowserSession1791849600000();
	await migration.up(runner);
	const statements = runner.query.mock.calls.map(([sql]) => sql);
	expect(statements).toHaveLength(3);
	expect(statements[0]).toContain('CREATE TABLE "browser_session"');
	expect(statements[0]).toContain('FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE');
	for (const column of metadata.columns.filter(value => !['sudoGrantId', 'sudoPolicyStamp', 'lastIp', 'lastUserAgent'].includes(value.databaseName))) expect(statements[0]).toContain(`"${column.databaseName}"`);
	for (const index of metadata.indices) expect(statements.slice(1).join('\n')).toContain(`"${index.name}"`);
	expect(metadata.findColumnWithPropertyName('sudoGrantId')).toMatchObject({ isSelect: false, length: '43', isNullable: true });
	expect(metadata.findColumnWithPropertyName('sudoPolicyStamp')).toMatchObject({ isSelect: false, length: '64', isNullable: true });
	runner.query.mockClear();
	await new SudoPolicy1792300000001().up(runner);
	expect(runner.query.mock.calls).toEqual([
		['ALTER TABLE "browser_session" ADD "sudoGrantId" character varying(43)'],
		['ALTER TABLE "browser_session" ADD "sudoPolicyStamp" character varying(64)'],
		['UPDATE "browser_session" SET "sudoUntil" = NULL'],
	]);
	runner.query.mockClear();
	await migration.down(runner);
	expect(runner.query.mock.calls).toEqual([['DROP TABLE "browser_session"']]);
});

test('durable session gates generate a joined local-user suspension and deletion predicate', async () => {
	const source = new MetadataSource({ type: 'postgres', entities, synchronize: false, dropSchema: false });
	await source.prepare();
	const query = source.getRepository(MiBrowserSession).createQueryBuilder('session').setFindOptions({
		where: { id: 'session1', userId: 'alice', revokedAt: IsNull(), user: { id: 'alice', host: IsNull(), isSuspended: false, isDeleted: false } },
	});
	const sql = query.getSql();
	expect(sql).toContain('JOIN "user"');
	expect(sql).toContain('"revokedAt" IS NULL');
	expect(sql).toContain('"host" IS NULL');
	expect(sql).toContain('"isSuspended" =');
	expect(sql).toContain('"isDeleted" =');
});

test('session history migration matches nullable metadata and reverses without a database', async () => {
	const source = new MetadataSource({ type: 'postgres', entities, synchronize: false, dropSchema: false });
	await source.prepare();
	const session = source.getMetadata(MiBrowserSession);
	expect(session.findColumnWithPropertyName('lastIp')).toBeUndefined();
	expect(session.findColumnWithPropertyName('lastUserAgent')).toMatchObject({ length: '1024', isNullable: true });
	const signin = source.getMetadata(MiSignin);
	expect(signin.findColumnWithPropertyName('browserSessionId')).toMatchObject({ length: '32', isNullable: true });
	expect(signin.foreignKeys.find(key => key.name === 'FK_signin_browserSessionId')).toMatchObject({ onDelete: 'SET NULL', referencedTablePath: 'browser_session' });
	const runner = mockDeep<QueryRunner>();
	const migration = new BrowserSessionHistory1794614400000();
	await migration.up(runner);
	expect(runner.query.mock.calls.map(([sql]) => sql).join('\n')).toContain('ON DELETE SET NULL');
	expect(runner.query).toHaveBeenCalledTimes(4);
	runner.query.mockClear();
	await migration.down(runner);
	expect(runner.query.mock.calls.map(([sql]) => sql)).toEqual([
		'ALTER TABLE "signin" DROP CONSTRAINT "FK_signin_browserSessionId"',
		'DROP INDEX "IDX_signin_browserSessionId"',
		'ALTER TABLE "signin" DROP COLUMN "browserSessionId"',
		'ALTER TABLE "browser_session" DROP COLUMN "lastUserAgent", DROP COLUMN "lastIp"',
	]);
});
