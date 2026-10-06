/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAvatarDecorationCommands, legacyAvatarDecorationCommandSchemas } from '../../../backend/built/features/avatar-decorations/backend.js';

const updateKey = 'admin/avatar-decorations/update';
const deleteKey = 'admin/avatar-decorations/delete';

function invoke(feature, key, input, ...actorArg) {
	const actor = actorArg.length === 0 ? { id: 'alice' } : actorArg[0];
	return feature[key](input, { context: actor == null ? undefined : { actor } });
}

test('legacy avatar-decoration command schemas preserve required, optional, nullable and empty-string rules', () => {
	const update = legacyAvatarDecorationCommandSchemas[updateKey].input;
	assert.equal(update.type, 'object');
	assert.equal(update.additionalProperties, undefined); // AJV's default is to allow additional properties
	assert.deepEqual(update.required, ['id']);
	assert.equal(update.properties.id.format, 'misskey:id');
	assert.deepEqual(update.properties.name, { type: 'string', minLength: 1 });
	assert.deepEqual(update.properties.description, { type: 'string' });
	assert.deepEqual(update.properties.url, { type: 'string', minLength: 1 });
	assert.deepEqual(update.properties.roleIdsThatCanBeUsedThisDecoration, { type: 'array', items: { type: 'string' } });
	assert.deepEqual(update.properties.category, { type: 'string', nullable: true });
	assert.equal('optional' in update.properties.category, false);
	assert.deepEqual(legacyAvatarDecorationCommandSchemas[deleteKey].input.required, ['id']);
});

test('update and delete use the trusted full actor, preserve legacy patch fields, await ports, and return void', async () => {
	const actor = { id: 'trusted-user', moderatorContext: { source: 'request' } };
	const calls = [];
	let releaseUpdate;
	let resolveUpdateStarted;
	const updateStarted = new Promise(resolve => { resolveUpdateStarted = resolve; });
	const feature = createAvatarDecorationCommands({
		update: (id, values, actorArg) => new Promise(resolve => {
			calls.push(['update', id, values, actorArg]);
			releaseUpdate = resolve;
			resolveUpdateStarted();
		}),
		delete: async (id, actorArg) => { calls.push(['delete', id, actorArg]); },
	});

	let settled = false;
	const pending = invoke(feature, updateKey, {
		id: 'decoration1',
		name: 'name',
		url: 'https://example.test/image.png',
		category: null,
		roleIdsThatCanBeUsedThisDecoration: ['role with spaces'],
		actor: { id: 'spoofed' },
		ignored: true,
	}, actor).then(value => { settled = true; return value; });
	await updateStarted;
	assert.equal(settled, false);
	assert.deepEqual(calls[0], ['update', 'decoration1', {
		name: 'name',
		description: undefined,
		url: 'https://example.test/image.png',
		roleIdsThatCanBeUsedThisDecoration: ['role with spaces'],
		category: null,
	}, actor]);
	releaseUpdate();
	assert.equal(await pending, undefined);

	assert.equal(await invoke(feature, deleteKey, { id: 'decoration2' }, actor), undefined);
	assert.deepEqual(calls[1], ['delete', 'decoration2', actor]);
});

test('invalid actors fail before service calls and command inputs keep legacy validation limits', async () => {
	const calls = [];
	const feature = createAvatarDecorationCommands({
		update: async (...args) => { calls.push(args); },
		delete: async (...args) => { calls.push(args); },
	});

	for (const key of [updateKey, deleteKey]) {
		for (const actor of [undefined, null, {}, { id: '' }]) {
			await assert.rejects(invoke(feature, key, { id: 'decoration1' }, actor));
		}
	}
	assert.deepEqual(calls, []);

	await assert.rejects(invoke(feature, updateKey, { id: 'decoration1', name: '' }));
	await assert.rejects(invoke(feature, updateKey, { id: 'decoration1', url: '' }));
	await assert.rejects(invoke(feature, updateKey, { id: 'bad-id!' }));
	assert.equal(await invoke(feature, updateKey, { id: 'decoration1', category: null }), undefined);
});
