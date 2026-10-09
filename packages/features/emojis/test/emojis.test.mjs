/*
	* SPDX-FileCopyrightText: syuilo and misskey-project
	* SPDX-License-Identifier: AGPL-3.0-only
	*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createEmojisRouter } from '../../../backend/built/features/emojis/backend.js';

function publicEmojis(deps) {
	const router = createEmojisRouter({
		emojisRepository: {
			find: () => deps.listLocal(),
			findOneOrFail: ({ where }) => deps.findLocal(where.name),
		},
		emojiEntityService: { packSimpleMany: async rows => rows, packDetailed: async row => row },
	});
	return createRouterClient(router, { context: {
		credential: undefined, ip: '192.0.2.1', headers: {},
		services: { authenticate: async () => [null, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
	} });
}

test('factory construction does no I/O and list results keep dependency order', async () => {
	const calls = [];
	const first = { aliases: ['first-alias'], name: 'first', category: null, url: 'https://example.test/first.png' };
	const second = { aliases: ['second-alias'], name: 'second', category: 'animals', url: 'https://example.test/second.png' };
	const feature = publicEmojis({
		listLocal: async () => { calls.push('list'); return [first, second]; },
		findLocal: async name => { calls.push(`find:${name}`); throw new Error('unused lookup'); },
	});

	assert.deepEqual(calls, []);
	assert.deepEqual(await feature.emojis({}), { emojis: [first, second] });
	assert.deepEqual(calls, ['list']);
});

test('lookup validates required input before reading and forwards the original name unchanged', async () => {
	const calls = [];
	const detailed = {
		id: 'emoji-id', aliases: ['Alias/With:punctuation'], name: 'Alias/With:punctuation', category: null,
		host: null, url: 'https://example.test/emoji.png', license: null, isSensitive: false, localOnly: true,
		roleIdsThatCanBeUsedThisEmojiAsReaction: [],
	};
	const feature = publicEmojis({
		listLocal: async () => { calls.push('list'); return []; },
		findLocal: async name => { calls.push(name); return detailed; },
	});

	await assert.rejects(feature.emoji({}));
	assert.deepEqual(calls, []);
	assert.deepEqual(await feature.emoji({ name: 'Alias/With:punctuation' }), detailed);
	assert.deepEqual(calls, ['Alias/With:punctuation']);
});

test('dependency failures propagate without fallback reads', async () => {
	const listFailure = new Error('local emoji list failed');
	const listCalls = [];
	const listFeature = publicEmojis({
		listLocal: async () => { listCalls.push('list'); throw listFailure; },
		findLocal: async () => { listCalls.push('find'); throw new Error('must not fall back'); },
	});
	await assert.rejects(listFeature.emojis({}), error => error === listFailure);
	assert.deepEqual(listCalls, ['list']);

	const lookupFailure = new Error('local emoji lookup failed');
	const lookupCalls = [];
	const lookupFeature = publicEmojis({
		listLocal: async () => { lookupCalls.push('list'); throw new Error('must not fall back'); },
		findLocal: async name => { lookupCalls.push(name); throw lookupFailure; },
	});
	await assert.rejects(lookupFeature.emoji({ name: 'missing' }), error => error === lookupFailure);
	assert.deepEqual(lookupCalls, ['missing']);
});

test('wire normalization omits undefined optional fields without mutating packed values', async () => {
	const packed = { aliases: [], name: 'sample', category: null, url: '/sample', localOnly: undefined, isSensitive: undefined, roleIdsThatCanBeUsedThisEmojiAsReaction: undefined };
	const feature = publicEmojis({ listLocal: async () => [packed], findLocal: async () => { throw new Error('unused'); } });
	const result = await feature.emojis({});
	assert.deepEqual(result, { emojis: [{ aliases: [], name: 'sample', category: null, url: '/sample' }] });
	assert.equal(Object.hasOwn(packed, 'localOnly'), true);
	assert.equal(Object.hasOwn(result.emojis[0], 'localOnly'), false);
});

test('list input is validated before dependencies and malformed packed results reject', async () => {
	let reads = 0;
	const feature = publicEmojis({ listLocal: async () => { reads++; return [{ aliases: [], name: 'bad', category: null, url: '/bad', localOnly: 'false' }]; }, findLocal: async () => { throw new Error('unused'); } });
	for (const invalid of [null, [], 1, 'invalid']) await assert.rejects(feature.emojis(invalid));
	assert.equal(reads, 0);
	await assert.rejects(feature.emojis({}));
	assert.equal(reads, 1);
});
