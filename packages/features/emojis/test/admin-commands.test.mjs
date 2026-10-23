/*
	* SPDX-FileCopyrightText: syuilo and misskey-project
	* SPDX-License-Identifier: AGPL-3.0-only
	*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createEmojisRouter } from '../../../backend/built/features/emojis/backend.js';

const routeMethods = {
	'admin/emoji/set-category-bulk': 'setCategoryBulk',
	'admin/emoji/set-license-bulk': 'setLicenseBulk',
	'admin/emoji/set-aliases-bulk': 'setAliasesBulk',
	'admin/emoji/add-aliases-bulk': 'addAliasesBulk',
	'admin/emoji/remove-aliases-bulk': 'removeAliasesBulk',
};

function bulkClient(deps) {
	const actor = { id: 'admin1', isSuspended: false, movedToUri: null };
	const router = createEmojisRouter({ customEmojiService: deps });
	const client = createRouterClient(router, { context: {
		credential: 'session', ip: '192.0.2.1', headers: {},
		services: { authenticate: async () => [actor, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
		authorization: { rootUserId: () => actor.id },
	} });
	return Object.fromEntries(Object.entries(routeMethods).map(([route, method]) => [route, client[method]]));
}

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

test('all bulk emoji commands accept empty arrays and validate Misskey identifiers', async () => {
	const { deps, calls } = createDeps();
	const feature = bulkClient(deps);

	for (const [command, input] of Object.entries(commandInputs)) {
		await feature[command]({ ...input, ids: [], ...(input.aliases ? { aliases: [] } : {}) });
		await assert.rejects(feature[command]({ ...input, ids: ['not-valid!'] }));
		await assert.rejects(feature[command]({ ...input, ids: ['valid1', ''] }));
	}
	assert.equal(calls.length, Object.keys(commandInputs).length);
});

test('category and license omission or null normalize to null; empty strings stay explicit', async () => {
	const { deps, calls } = createDeps();
	const feature = bulkClient(deps);
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
	const feature = bulkClient(Object.fromEntries(
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
		const feature = bulkClient(createDeps({
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
		const rejecting = bulkClient(createDeps({ [method]: async () => { throw failure; } }).deps);
		await assert.rejects(rejecting[command](input), error => error === failure);
	}
});
