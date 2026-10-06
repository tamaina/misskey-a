/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	createEmojis,
	legacyEmojiDetailedSchema,
	legacyEmojiSchemas,
	legacyEmojiSimpleSchema,
	legacyEmojisSchemas,
} from '../../../backend/built/features/emojis/backend.js';

const simpleFields = [
	'aliases', 'name', 'category', 'url', 'localOnly', 'isSensitive', 'roleIdsThatCanBeUsedThisEmojiAsReaction',
];
const detailedFields = [
	'id', 'aliases', 'name', 'category', 'host', 'url', 'license', 'isSensitive', 'localOnly',
	'roleIdsThatCanBeUsedThisEmojiAsReaction',
];

function ids(schema) {
	return schema.properties.roleIdsThatCanBeUsedThisEmojiAsReaction.items;
}

test('legacy emoji schemas preserve property order, optionality, nullability, ID metadata, and host description', () => {
	assert.deepEqual(Object.keys(legacyEmojiSimpleSchema.properties), simpleFields);
	assert.deepEqual(legacyEmojiSimpleSchema.required, ['aliases', 'name', 'category', 'url']);
	assert.deepEqual(legacyEmojiDetailedSchema.properties && Object.keys(legacyEmojiDetailedSchema.properties), detailedFields);
	assert.deepEqual(legacyEmojiDetailedSchema.required, detailedFields);

	assert.equal(legacyEmojiSimpleSchema.properties.category.type, 'string');
	assert.equal(legacyEmojiSimpleSchema.properties.category.nullable, true);
	for (const name of ['localOnly', 'isSensitive', 'roleIdsThatCanBeUsedThisEmojiAsReaction']) {
		assert.equal(legacyEmojiSimpleSchema.properties[name].optional, true);
		assert.equal(legacyEmojiSimpleSchema.required.includes(name), false);
	}
	assert.equal(legacyEmojiSimpleSchema.properties.aliases.items.format, 'id');
	assert.equal(ids(legacyEmojiSimpleSchema).format, 'id');
	assert.equal(legacyEmojiDetailedSchema.properties.id.format, 'id');
	assert.equal(legacyEmojiDetailedSchema.properties.aliases.items.format, 'id');
	assert.equal(ids(legacyEmojiDetailedSchema).format, 'id');
	assert.equal(legacyEmojiDetailedSchema.properties.category.nullable, true);
	assert.equal(legacyEmojiDetailedSchema.properties.host.nullable, true);
	assert.equal(legacyEmojiDetailedSchema.properties.license.nullable, true);
	assert.equal(legacyEmojiDetailedSchema.properties.host.description, 'The local host is represented with `null`.');
});

test('legacy route schemas retain the public emoji refs and exclude admin-only fields', () => {
	assert.deepEqual(legacyEmojisSchemas.input, {
		type: 'object', properties: {}, additionalProperties: true,
	});
	assert.equal(legacyEmojisSchemas.output.properties.emojis.items.ref, 'EmojiSimple');
	assert.deepEqual(legacyEmojiSchemas.input.required, ['name']);
	assert.equal(legacyEmojiSchemas.output.ref, 'EmojiDetailed');

	for (const schema of [legacyEmojiSimpleSchema, legacyEmojiDetailedSchema]) {
		for (const adminField of ['updatedAt', 'publicUrl', 'originalUrl', 'uri', 'type']) {
			assert.equal(Object.hasOwn(schema.properties, adminField), false, `${adminField} is admin-only`);
		}
	}
});

test('factory construction does no I/O and list results keep dependency order', async () => {
	const calls = [];
	const first = { aliases: ['first-alias'], name: 'first', category: null, url: 'https://example.test/first.png' };
	const second = { aliases: ['second-alias'], name: 'second', category: 'animals', url: 'https://example.test/second.png' };
	const feature = createEmojis({
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
	const feature = createEmojis({
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
	const listFeature = createEmojis({
		listLocal: async () => { listCalls.push('list'); throw listFailure; },
		findLocal: async () => { listCalls.push('find'); throw new Error('must not fall back'); },
	});
	await assert.rejects(listFeature.emojis({}), error => error === listFailure);
	assert.deepEqual(listCalls, ['list']);

	const lookupFailure = new Error('local emoji lookup failed');
	const lookupCalls = [];
	const lookupFeature = createEmojis({
		listLocal: async () => { lookupCalls.push('list'); throw new Error('must not fall back'); },
		findLocal: async name => { lookupCalls.push(name); throw lookupFailure; },
	});
	await assert.rejects(lookupFeature.emoji({ name: 'missing' }), error => error === lookupFailure);
	assert.deepEqual(lookupCalls, ['missing']);
});

test('wire normalization omits undefined optional fields without mutating packed values', async () => {
	const packed = { aliases: [], name: 'sample', category: null, url: '/sample', localOnly: undefined, isSensitive: undefined, roleIdsThatCanBeUsedThisEmojiAsReaction: undefined };
	const feature = createEmojis({ listLocal: async () => [packed], findLocal: async () => { throw new Error('unused'); } });
	const result = await feature.emojis({});
	assert.deepEqual(result, { emojis: [{ aliases: [], name: 'sample', category: null, url: '/sample' }] });
	assert.equal(Object.hasOwn(packed, 'localOnly'), true);
	assert.equal(Object.hasOwn(result.emojis[0], 'localOnly'), false);
});

test('list input is validated before dependencies and malformed packed results reject', async () => {
	let reads = 0;
	const feature = createEmojis({ listLocal: async () => { reads++; return [{ aliases: [], name: 'bad', category: null, url: '/bad', localOnly: 'false' }]; }, findLocal: async () => { throw new Error('unused'); } });
	for (const invalid of [null, [], 1, 'invalid']) await assert.rejects(feature.emojis(invalid));
	assert.equal(reads, 0);
	await assert.rejects(feature.emojis({}));
	assert.equal(reads, 1);
});
