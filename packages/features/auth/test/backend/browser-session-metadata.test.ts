/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { QueryRunner } from 'typeorm';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { BrowserSession1791849600000 } from '../../../../backend/migration/1791849600000-BrowserSession.js';

class MetadataSource extends DataSource {
	public async prepare(): Promise<void> {
		await this.buildMetadatas();
	}
}

test('browser session entity metadata matches the additive migration without connecting to a database', async () => {
	const source = new MetadataSource({ type: 'postgres', entities, synchronize: false, dropSchema: false });
	await source.prepare();
	const metadata = source.getMetadata(MiBrowserSession);
	expect(metadata.tableName).toBe('browser_session');
	expect(metadata.columns.map(column => column.databaseName)).toEqual(['id', 'userId', 'tokenHash', 'createdAt', 'lastUsedAt', 'revokedAt', 'sudoUntil']);
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
	for (const column of metadata.columns) expect(statements[0]).toContain(`"${column.databaseName}"`);
	for (const index of metadata.indices) expect(statements.slice(1).join('\n')).toContain(`"${index.name}"`);
	runner.query.mockClear();
	await migration.down(runner);
	expect(runner.query.mock.calls).toEqual([['DROP TABLE "browser_session"']]);
});
