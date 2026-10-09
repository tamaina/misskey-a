/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnnouncementsRouter, announcementsContract } from '../../../backend/built/features/announcements/backend.js';

import { createRouterClient } from '@orpc/server';
import * as v from 'valibot';

function announcementDependenciesFixture(deps) {
	return { announcementsRepository: { findOneBy: ({ id }) => deps.findById(id) }, announcementService: deps };
}

const updateKey = 'admin/announcements/update';
const deleteKey = 'admin/announcements/delete';
const readKey = 'i/read-announcement';
const missingUpdateId = 'd3aae5a7-6372-4cb4-b61c-f511ffc2d7cc';
const missingDeleteId = 'ecad8040-a276-4e85-bda9-015a708d291e';

function createDeps(overrides = {}) {
	const calls = [];
	const deps = {
		findById: async id => { calls.push(['findById', id]); return { id }; },
		update: async (announcement, values, actor) => { calls.push(['update', announcement, values, actor]); },
		delete: async (announcement, actor) => { calls.push(['delete', announcement, actor]); },
		read: async (actor, id) => { calls.push(['read', actor, id]); },
		...overrides,
	};
	return { deps, calls };
}

function invoke(dependencies, key, input, ...actorArg) {
	const actor = actorArg.length === 0 ? { id: 'alice' } : actorArg[0];
	const client = createRouterClient(createAnnouncementsRouter(dependencies), { context: {
		credential: 'native', ip: '127.0.0.1', headers: {},
		services: { authenticate: async () => [actor ?? null, null], limitActor: () => null },
		authorization: { rootUserId: () => null, roles: async () => [{ isModerator: true, isAdministrator: true }] },
	} });
	return client[key === updateKey ? 'update' : key === deleteKey ? 'delete' : 'read'](input);
}

test('announcement native inputs retain nullable URLs, required IDs and patch constraints', () => {
	const update = announcementsContract.update['~orpc'].inputSchema;
	assert.deepEqual(v.parse(update, { id: 'announcement1', imageUrl: null, title: 'Title', future: true }), { id: 'announcement1', imageUrl: null, title: 'Title' });
	for (const input of [{}, { id: 'bad-id' }, { id: 'announcement1', title: '' }, { id: 'announcement1', text: '' }, { id: 'announcement1', icon: 'invalid' }, { id: 'announcement1', display: 'invalid' }, { id: 'announcement1', silence: 1 }]) assert.equal(v.safeParse(update, input).success, false);
	assert.deepEqual(v.parse(update, { id: 'announcement1', imageUrl: '' }), { id: 'announcement1', imageUrl: '' });
	assert.equal(v.safeParse(announcementsContract.delete['~orpc'].inputSchema, {}).success, false);
	assert.equal(v.safeParse(announcementsContract.read['~orpc'].inputSchema, {}).success, false);
});

test('update awaits lookup and update ports, forwards the trusted actor and preserves undefined fields', async () => {
	const actor = { id: 'trusted-user', moderatorContext: { source: 'request' } };
	const announcement = { id: 'announcement1', userId: null };
	const calls = [];
	let releaseFind;
	let notifyFindStarted;
	const findStarted = new Promise(resolve => { notifyFindStarted = resolve; });
	let releaseUpdate;
	let notifyUpdateStarted;
	const updateStarted = new Promise(resolve => { notifyUpdateStarted = resolve; });
	const feature = announcementDependenciesFixture({
		findById: id => new Promise(resolve => { calls.push(['find-start', id]); releaseFind = () => resolve(announcement); notifyFindStarted(); }),
		update: (found, values, actorArg) => new Promise(resolve => { calls.push(['update-start', found, values, actorArg]); releaseUpdate = resolve; notifyUpdateStarted(); }),
		delete: async () => {},
		read: async () => {},
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
	assert.ok(calls[1][2].updatedAt instanceof Date);
	assert.deepEqual(calls[1], ['update-start', announcement, {
		updatedAt: calls[1][2].updatedAt,
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
	const omittedFeature = announcementDependenciesFixture(deps);
	assert.equal(await invoke(omittedFeature, updateKey, { id: 'announcement2', title: 'Next' }, actor), undefined);
	assert.equal(omittedCalls[1][2].imageUrl, null);
	assert.equal(omittedCalls[1][2].text, undefined);
});

test('missing announcements use route-specific errors and never call update/delete', async () => {
	for (const [key, expectedId] of [[updateKey, missingUpdateId], [deleteKey, missingDeleteId]]) {
		const { deps, calls } = createDeps({ findById: async id => { calls.push(['findById', id]); return null; } });
		const feature = announcementDependenciesFixture(deps);
		await assert.rejects(invoke(feature, key, { id: 'missing1' }), error => {
			assert.equal(error.data.id, expectedId);
			assert.equal(error.code, 'NO_SUCH_ANNOUNCEMENT');
			return true;
		});
		assert.deepEqual(calls, [['findById', 'missing1']]);
	}
});

test('delete and read await their ports; missing credentials fail before any dependency', async () => {
	const actor = { id: 'trusted-user', audit: true };
	const calls = [];
	let releaseDelete;
	let notifyDeleteStarted;
	const deleteStarted = new Promise(resolve => { notifyDeleteStarted = resolve; });
	let releaseRead;
	let notifyReadStarted;
	const readStarted = new Promise(resolve => { notifyReadStarted = resolve; });
	const feature = announcementDependenciesFixture({
		findById: async id => { calls.push(['findById', id]); return { id }; },
		update: async () => {},
		delete: (announcement, actorArg) => new Promise(resolve => { calls.push(['delete', announcement, actorArg]); releaseDelete = resolve; notifyDeleteStarted(); }),
		read: (actorArg, id) => new Promise(resolve => { calls.push(['read', actorArg, id]); releaseRead = resolve; notifyReadStarted(); }),
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
	const invalidFeature = announcementDependenciesFixture(deps);
	for (const key of [updateKey, deleteKey, readKey]) {
		for (const invalidActor of [undefined, null]) {
			const input = key === readKey ? { announcementId: 'announcement1' } : { id: 'announcement1' };
			await assert.rejects(invoke(invalidFeature, key, input, invalidActor));
		}
	}
	assert.deepEqual(invalidCalls, []);
});
