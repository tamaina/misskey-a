/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEmojiAdministration, legacyEmojiAdministrationSchemas } from '../../../backend/built/features/emojis/backend.js';

const commandInputs = {
	'admin/emoji/set-category-bulk': { ids: ['emoji1', 'emoji2'], category: 'animals' },
	'admin/emoji/set-license-bulk': { ids: ['emoji1', 'emoji2'], license: 'CC0' },
	'admin/emoji/set-aliases-bulk': { ids: ['emoji1', 'emoji2'], aliases: ['cat', 'kitty'] },
	'admin/emoji/add-aliases-bulk': { ids: ['emoji1', 'emoji2'], aliases: ['cat', 'kitty'] },
	'admin/emoji/remove-aliases-bulk': { ids: ['emoji1', 'emoji2'], aliases: ['cat', 'kitty'] },
};

function createDeps(overrides = {}) {
	const calls = [];
	const deps = {
		setCategoryBulk: async (ids, category) => { calls.push(['setCategoryBulk', ids, category]); },
		setLicenseBulk: async (ids, license) => { calls.push(['setLicenseBulk', ids, license]); },
		setAliasesBulk: async (ids, aliases) => { calls.push(['setAliasesBulk', ids, aliases]); },
		addAliasesBulk: async (ids, aliases) => { calls.push(['addAliasesBulk', ids, aliases]); },
		removeAliasesBulk: async (ids, aliases) => { calls.push(['removeAliasesBulk', ids, aliases]); },
		...overrides,
	};
	return { deps, calls };
}

test('legacy request schemas are generated from the same command input schemas', () => {
	const ids = { type: 'array', items: { type: 'string', format: 'misskey:id' } };
	const aliases = { type: 'array', items: { type: 'string' } };
	assert.deepEqual(legacyEmojiAdministrationSchemas['admin/emoji/set-category-bulk'].input, {
		type: 'object',
		properties: { ids, category: { type: 'string', nullable: true, description: 'Use `null` to reset the category.' } },
		required: ['ids'],
	});
	assert.deepEqual(legacyEmojiAdministrationSchemas['admin/emoji/set-license-bulk'].input, {
		type: 'object',
		properties: { ids, license: { type: 'string', nullable: true, description: 'Use `null` to reset the license.' } },
		required: ['ids'],
	});
	for (const command of [
		'admin/emoji/set-aliases-bulk',
		'admin/emoji/add-aliases-bulk',
		'admin/emoji/remove-aliases-bulk',
	]) {
		assert.deepEqual(legacyEmojiAdministrationSchemas[command].input, {
			type: 'object',
			properties: { ids, aliases },
			required: ['ids', 'aliases'],
		});
	}
});

test('all bulk emoji commands accept empty arrays and validate Misskey identifiers', async () => {
	const { deps, calls } = createDeps();
	const feature = createEmojiAdministration(deps);

	for (const [command, input] of Object.entries(commandInputs)) {
		await feature[command]({ ...input, ids: [], ...(input.aliases ? { aliases: [] } : {}) });
		await assert.rejects(feature[command]({ ...input, ids: ['not-valid!'] }));
		await assert.rejects(feature[command]({ ...input, ids: ['valid1', ''] }));
	}
	assert.equal(calls.length, Object.keys(commandInputs).length);
});

test('category and license omission or null normalize to null; empty strings stay explicit', async () => {
	const { deps, calls } = createDeps();
	const feature = createEmojiAdministration(deps);
	const ids = ['emoji1'];

	await feature['admin/emoji/set-category-bulk']({ ids });
	await feature['admin/emoji/set-category-bulk']({ ids, category: null });
	await feature['admin/emoji/set-category-bulk']({ ids, category: '' });
	await feature['admin/emoji/set-license-bulk']({ ids });
	await feature['admin/emoji/set-license-bulk']({ ids, license: null });
	await feature['admin/emoji/set-license-bulk']({ ids, license: '' });

	assert.deepEqual(calls, [
		['setCategoryBulk', ids, null],
		['setCategoryBulk', ids, null],
		['setCategoryBulk', ids, ''],
		['setLicenseBulk', ids, null],
		['setLicenseBulk', ids, null],
		['setLicenseBulk', ids, ''],
	]);
	await assert.rejects(feature['admin/emoji/set-category-bulk']({ ids, category: 7 }));
	await assert.rejects(feature['admin/emoji/set-license-bulk']({ ids, license: false }));
});

test('set, add and remove aliases remain distinct awaited operations', async () => {
	const calls = [];
	const feature = createEmojiAdministration(Object.fromEntries(
		['setAliasesBulk', 'addAliasesBulk', 'removeAliasesBulk'].map(name => [name, async (ids, aliases) => {
			calls.push([name, ids, aliases]);
		}]),
	));
	const ids = ['emoji1'];
	const aliases = ['cat', 'kitty'];

	await feature['admin/emoji/set-aliases-bulk']({ ids, aliases });
	await feature['admin/emoji/add-aliases-bulk']({ ids, aliases });
	await feature['admin/emoji/remove-aliases-bulk']({ ids, aliases });

	assert.deepEqual(calls, [
		['setAliasesBulk', ids, aliases],
		['addAliasesBulk', ids, aliases],
		['removeAliasesBulk', ids, aliases],
	]);
});

test('bulk handlers await service completion, propagate failures, and return no payload', async () => {
	for (const [command, method, input] of Object.entries(commandInputs).map(([command, input]) => [command, {
		'admin/emoji/set-category-bulk': 'setCategoryBulk',
		'admin/emoji/set-license-bulk': 'setLicenseBulk',
		'admin/emoji/set-aliases-bulk': 'setAliasesBulk',
		'admin/emoji/add-aliases-bulk': 'addAliasesBulk',
		'admin/emoji/remove-aliases-bulk': 'removeAliasesBulk',
	}[command], input])) {
		let finish;
		let start;
		const started = new Promise(resolve => { start = resolve; });
		let settled = false;
		const feature = createEmojiAdministration(createDeps({
			[method]: async () => {
				start();
				await new Promise(resolve => { finish = resolve; });
			},
		}).deps);
		const result = feature[command](input).then(value => { settled = true; return value; });
		await started;
		assert.equal(settled, false);
		finish();
		assert.equal(await result, undefined);
		assert.equal(settled, true);

		const failure = new Error(`${method} failed`);
		const rejecting = createEmojiAdministration(createDeps({ [method]: async () => { throw failure; } }).deps);
		await assert.rejects(rejecting[command](input), error => error === failure);
	}
});
