/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';

async function migration(concurrent) {
	const previous = process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY;
	try {
		process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY = concurrent ? '1' : '0';
		const module = await import(`../../../backend/migration/1792504800000-ChannelExploreIndexes.js?concurrent=${concurrent}`);
		return new module.ChannelExploreIndexes1792504800000();
	} finally {
		if (previous === undefined) delete process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY;
		else process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY = previous;
	}
}

function fixture() {
	const indexes = new Map();
	const calls = [];
	let interruptAt = Infinity;
	let mutations = 0;
	return {
		indexes, calls,
		interruptAfter(count) { mutations = 0; interruptAt = count; },
		async query(sql, params) {
			calls.push(sql);
			if (sql.startsWith('SELECT')) {
				const name = params[0].slice(1, -1);
				return indexes.has(name) ? [{ indisvalid: indexes.get(name) }] : [];
			}
			if (++mutations === interruptAt) { interruptAt = Infinity; throw new Error('interrupted'); }
			const name = sql.match(/"(IDX_channel_[^"]+)"/)[1];
			if (sql.startsWith('CREATE')) {
				assert.equal(indexes.has(name), false, `duplicate index: ${name}`);
				indexes.set(name, true);
			} else {
				assert.ok(indexes.has(name) || sql.includes('IF EXISTS'), `missing index: ${name}`);
				indexes.delete(name);
			}
			return [];
		},
	};
}

test('normal mode retains transactional up/down with four matching indexes', async () => {
	const subject = await migration(false);
	const db = fixture();
	assert.equal(subject.transaction, undefined);
	await subject.up(db);
	assert.equal(db.indexes.size, 4);
	assert.ok(db.calls.every(sql => !sql.includes('CONCURRENTLY')));
	await subject.down(db);
	assert.equal(db.indexes.size, 0);
});

test('concurrent up resumes after partial creation and repairs an invalid index', async () => {
	const subject = await migration(true);
	const db = fixture();
	assert.equal(subject.transaction, false);
	db.interruptAfter(3);
	await assert.rejects(subject.up(db), /interrupted/);
	assert.equal(db.indexes.size, 2);
	db.indexes.set('IDX_channel_active_local_activity', false);
	await subject.up(db);
	assert.equal(db.indexes.size, 4);
	assert.ok([...db.indexes.values()].every(Boolean));
	assert.equal(db.calls.filter(sql => sql.startsWith('CREATE INDEX CONCURRENTLY "IDX_channel_active_local_id"')).length, 1);
	assert.ok(db.calls.includes('DROP INDEX CONCURRENTLY "IDX_channel_active_local_activity"'));
});

test('concurrent down resumes after partial removal', async () => {
	const subject = await migration(true);
	const db = fixture();
	await subject.up(db);
	db.interruptAfter(3);
	await assert.rejects(subject.down(db), /interrupted/);
	assert.equal(db.indexes.size, 2);
	await subject.down(db);
	assert.equal(db.indexes.size, 0);
});
