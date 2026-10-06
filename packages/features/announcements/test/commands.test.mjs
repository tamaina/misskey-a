/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnnouncementCommands, legacyAnnouncementCommandSchemas } from '../../../backend/built/features/announcements/backend.js';

const updateKey = 'admin/announcements/update';
const deleteKey = 'admin/announcements/delete';
const readKey = 'i/read-announcement';
const missingUpdateId = 'd3aae5a7-6372-4cb4-b61c-f511ffc2d7cc';
const missingDeleteId = 'ecad8040-a276-4e85-bda9-015a708d291e';

function createError(definition) {
	const error = new Error(definition.code);
	error.definition = definition;
	return error;
}

function createDeps(overrides = {}) {
	const calls = [];
	const deps = {
		findById: async id => { calls.push(['findById', id]); return { id }; },
		update: async (announcement, values, actor) => { calls.push(['update', announcement, values, actor]); },
		delete: async (announcement, actor) => { calls.push(['delete', announcement, actor]); },
		read: async (actor, id) => { calls.push(['read', actor, id]); },
		now: () => new Date('2025-01-02T03:04:05.000Z'),
		createError,
		...overrides,
	};
	return { deps, calls };
}

function invoke(feature, key, input, ...actorArg) {
	const actor = actorArg.length === 0 ? { id: 'alice' } : actorArg[0];
	return feature[key](input, { context: actor == null ? undefined : { actor } });
}

test('announcement schemas match route constraints, nullable image URLs, and required identifiers', () => {
	const update = legacyAnnouncementCommandSchemas[updateKey].input;
	assert.equal(update.type, 'object');
	assert.equal(update.additionalProperties, undefined); // AJV's default is to allow additional properties
	assert.deepEqual(update.required, ['id']);
	assert.equal(update.properties.id.format, 'misskey:id');
	assert.deepEqual(update.properties.title, { type: 'string', minLength: 1 });
	assert.deepEqual(update.properties.text, { type: 'string', minLength: 1 });
	assert.deepEqual(update.properties.imageUrl, { type: 'string', nullable: true, minLength: 0 });
	assert.deepEqual(update.properties.icon, { type: 'string', enum: ['info', 'warning', 'error', 'success'] });
	assert.deepEqual(update.properties.display, { type: 'string', enum: ['normal', 'banner', 'dialog'] });
	for (const field of ['forExistingUsers', 'silence', 'needConfirmationToRead', 'isActive']) {
		assert.deepEqual(update.properties[field], { type: 'boolean' });
		assert.equal(update.required.includes(field), false);
	}
	assert.deepEqual(legacyAnnouncementCommandSchemas[deleteKey].input.required, ['id']);
	const read = legacyAnnouncementCommandSchemas[readKey].input;
	assert.deepEqual(read.required, ['announcementId']);
	assert.equal(read.properties.announcementId.format, 'misskey:id');
});

test('update awaits lookup and update ports, forwards the trusted actor and preserves undefined fields', async () => {
	const actor = { id: 'trusted-user', moderatorContext: { source: 'request' } };
	const announcement = { id: 'announcement1', userId: null };
	const timestamp = new Date('2025-01-02T03:04:05.000Z');
	const calls = [];
	let releaseFind;
	let notifyFindStarted;
	const findStarted = new Promise(resolve => { notifyFindStarted = resolve; });
	let releaseUpdate;
	let notifyUpdateStarted;
	const updateStarted = new Promise(resolve => { notifyUpdateStarted = resolve; });
	const feature = createAnnouncementCommands({
		findById: id => new Promise(resolve => { calls.push(['find-start', id]); releaseFind = () => resolve(announcement); notifyFindStarted(); }),
		update: (found, values, actorArg) => new Promise(resolve => { calls.push(['update-start', found, values, actorArg]); releaseUpdate = resolve; notifyUpdateStarted(); }),
		delete: async () => {},
		read: async () => {},
		now: () => timestamp,
		createError,
	});

	let settled = false;
	const pending = invoke(feature, updateKey, {
		id: 'announcement1',
		title: 'Updated',
		imageUrl: '',
		actor: { id: 'spoofed' },
	}, actor).then(value => { settled = true; return value; });
	await findStarted;
	assert.deepEqual(calls, [['find-start', 'announcement1']]);
	assert.equal(settled, false);
	releaseFind();
	await updateStarted;
	assert.equal(settled, false);
	assert.deepEqual(calls[1], ['update-start', announcement, {
		updatedAt: timestamp,
		title: 'Updated',
		text: undefined,
		imageUrl: null,
		display: undefined,
		icon: undefined,
		forExistingUsers: undefined,
		silence: undefined,
		needConfirmationToRead: undefined,
		isActive: undefined,
	}, actor]);
	releaseUpdate();
	assert.equal(await pending, undefined);

	const { deps, calls: omittedCalls } = createDeps();
	const omittedFeature = createAnnouncementCommands(deps);
	assert.equal(await invoke(omittedFeature, updateKey, { id: 'announcement2', title: 'Next' }, actor), undefined);
	assert.equal(omittedCalls[1][2].imageUrl, null);
	assert.equal(omittedCalls[1][2].text, undefined);
});

test('missing announcements use route-specific errors and never call update/delete', async () => {
	for (const [key, expectedId] of [[updateKey, missingUpdateId], [deleteKey, missingDeleteId]]) {
		const { deps, calls } = createDeps({ findById: async id => { calls.push(['findById', id]); return null; } });
		const feature = createAnnouncementCommands(deps);
		await assert.rejects(invoke(feature, key, { id: 'missing1' }), error => {
			assert.equal(error.definition.id, expectedId);
			assert.equal(error.definition.code, 'NO_SUCH_ANNOUNCEMENT');
			return true;
		});
		assert.deepEqual(calls, [['findById', 'missing1']]);
	}
});

test('delete and read await their ports; malformed actors fail before any dependency', async () => {
	const actor = { id: 'trusted-user', audit: true };
	const calls = [];
	let releaseDelete;
	let notifyDeleteStarted;
	const deleteStarted = new Promise(resolve => { notifyDeleteStarted = resolve; });
	let releaseRead;
	let notifyReadStarted;
	const readStarted = new Promise(resolve => { notifyReadStarted = resolve; });
	const feature = createAnnouncementCommands({
		findById: async id => { calls.push(['findById', id]); return { id }; },
		update: async () => {},
		delete: (announcement, actorArg) => new Promise(resolve => { calls.push(['delete', announcement, actorArg]); releaseDelete = resolve; notifyDeleteStarted(); }),
		read: (actorArg, id) => new Promise(resolve => { calls.push(['read', actorArg, id]); releaseRead = resolve; notifyReadStarted(); }),
		now: () => new Date(),
		createError,
	});

	let deleted = false;
	const deletion = invoke(feature, deleteKey, { id: 'announcement1' }, actor).then(() => { deleted = true; });
	await deleteStarted;
	assert.equal(deleted, false);
	assert.deepEqual(calls[1], ['delete', { id: 'announcement1' }, actor]);
	releaseDelete();
	await deletion;

	let read = false;
	const reading = invoke(feature, readKey, { announcementId: 'announcement2' }, actor).then(() => { read = true; });
	await readStarted;
	assert.equal(read, false);
	assert.deepEqual(calls[2], ['read', actor, 'announcement2']);
	releaseRead();
	await reading;

	const { deps, calls: invalidCalls } = createDeps();
	const invalidFeature = createAnnouncementCommands(deps);
	for (const key of [updateKey, deleteKey, readKey]) {
		for (const invalidActor of [undefined, null, {}, { id: '' }]) {
			const input = key === readKey ? { announcementId: 'announcement1' } : { id: 'announcement1' };
			await assert.rejects(invoke(invalidFeature, key, input, invalidActor));
		}
	}
	assert.deepEqual(invalidCalls, []);
});
