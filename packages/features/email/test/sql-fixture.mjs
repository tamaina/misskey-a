/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { MailFoundation1794697200000 } from '../../../backend/migration/1794697200000-MailFoundation.js';
import { MailSubmissions1794697200001 } from '../../../backend/migration/1794697200001-MailSubmissions.js';

export const hasMailSql = Boolean(process.env.MAIL_TEST_DATABASE_URL || process.env.MAIL_TEST_PGLITE_MODULE);

/** Isolated schema, real SQL semantics, sequential transactions only. */
export async function mailSqlFixture() {
	const postgres = Boolean(process.env.MAIL_TEST_DATABASE_URL);
	let connection;
	if (postgres) {
		const require = createRequire(new URL('../../../backend/package.json', import.meta.url));
		const { Client } = require('pg');
		connection = new Client({ connectionString: process.env.MAIL_TEST_DATABASE_URL });
		await connection.connect();
	} else {
		const { PGlite } = await import(process.env.MAIL_TEST_PGLITE_MODULE);
		connection = new PGlite();
	}
	const schema = `mail_submission_test_${randomUUID().replaceAll('-', '')}`;
	const query = async (sql, params) => (await connection.query(sql, params)).rows;
	const db = {
		query,
		async transaction(work) {
			await query('BEGIN');
			try {
				const result = await work({ query });
				await query('COMMIT');
				return result;
			} catch (error) {
				await query('ROLLBACK');
				throw error;
			}
		},
	};
	await query(`CREATE SCHEMA "${schema}"`);
	await query(`SET search_path TO "${schema}"`);
	await query('CREATE TABLE "user" ("id" varchar(32) PRIMARY KEY,"username" varchar(128),"usernameLower" varchar(128),"host" varchar(128),"movedToUri" varchar(512),"isDeleted" boolean NOT NULL DEFAULT false,"isSuspended" boolean NOT NULL DEFAULT false)');
	await new MailFoundation1794697200000().up({ query });
	await new MailSubmissions1794697200001().up({ query });
	return {
		db,
		async close() {
			await query('SET search_path TO public');
			await query(`DROP SCHEMA "${schema}" CASCADE`);
			if (postgres) await connection.end();
			else await connection.close();
		},
	};
}
