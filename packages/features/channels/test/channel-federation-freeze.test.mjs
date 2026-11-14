/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ChannelFederationFreeze1794697200000 } from '../../../backend/migration/1794697200000-ChannelFederationFreeze.js';

test('freeze migration has a reversible column and only freezes existing local federated channels', async () => {
	const queries = [];
	const db = { async query(sql) { queries.push(sql); } };
	const migration = new ChannelFederationFreeze1794697200000();
	await migration.up(db);
	assert.deepEqual(queries, [
		'ALTER TABLE "channel" ADD "isFederationFrozen" boolean NOT NULL DEFAULT false',
		'UPDATE "channel" SET "isFederationFrozen" = true WHERE "host" IS NULL AND "isFederated" = true',
	]);
	await migration.down(db);
	assert.equal(queries.at(-1), 'ALTER TABLE "channel" DROP COLUMN "isFederationFrozen"');
});
