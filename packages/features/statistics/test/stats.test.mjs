/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createStatisticsRouter } from '../../../backend/built/features/statistics/backend.js';

test('construction and invalid input perform no reads', async () => {
	const calls = [];
	const feature = statisticsClient({
		readNotes: async () => { calls.push('notes'); return { local: 1, remote: 2 }; },
		readUsers: async () => { calls.push('users'); return { local: 1, remote: 2 }; },
		countReactions: async () => { calls.push('reactions'); return 3; },
		countInstances: async () => { calls.push('instances'); return 4; },
	});
	assert.deepEqual(calls, []);
	for (const input of [null, [], 'invalid', 1]) await assert.rejects(feature.stats(input));
	assert.deepEqual(calls, []);
});

test('sums local and remote stats, preserving local originals and zero drive usage', async () => {
	const feature = statisticsClient({
		readNotes: async () => ({ local: 13, remote: 7 }),
		readUsers: async () => ({ local: 4, remote: 3 }),
		countReactions: async () => 19,
		countInstances: async () => 23,
	});
	assert.deepEqual(await feature.stats({}), {
		notesCount: 20,
		originalNotesCount: 13,
		usersCount: 7,
		originalUsersCount: 4,
		reactionsCount: 19,
		instances: 23,
		driveUsageLocal: 0,
		driveUsageRemote: 0,
	});
});

test('chart reads stay sequential and both count reads start concurrently afterward', async () => {
	const calls = [];
	let resolveNotes;
	let resolveUsers;
	let resolveReactions;
	let resolveInstances;
	let markNotesStarted;
	let markUsersStarted;
	let markBothStarted;
	const notesStarted = new Promise(resolve => { markNotesStarted = resolve; });
	const usersStarted = new Promise(resolve => { markUsersStarted = resolve; });
	const bothStarted = new Promise(resolve => { markBothStarted = resolve; });
	const notesResult = new Promise(resolve => { resolveNotes = resolve; });
	const usersResult = new Promise(resolve => { resolveUsers = resolve; });
	const feature = statisticsClient({
		readNotes: () => { calls.push('notes'); markNotesStarted(); return notesResult; },
		readUsers: () => { calls.push('users'); markUsersStarted(); return usersResult; },
		countReactions: () => {
			calls.push('reactions');
			if (calls.includes('instances')) markBothStarted();
			return new Promise(resolve => { resolveReactions = resolve; });
		},
		countInstances: () => {
			calls.push('instances');
			if (calls.includes('reactions')) markBothStarted();
			return new Promise(resolve => { resolveInstances = resolve; });
		},
	});

	const resultPromise = feature.stats({});
	await notesStarted;
	assert.deepEqual(calls, ['notes']);
	resolveNotes({ local: 2, remote: 3 });
	await usersStarted;
	assert.deepEqual(calls, ['notes', 'users']);
	resolveUsers({ local: 5, remote: 7 });
	await bothStarted;
	assert.deepEqual(calls, ['notes', 'users', 'reactions', 'instances']);
	resolveReactions(11);
	resolveInstances(13);
	assert.deepEqual(await resultPromise, {
		notesCount: 5,
		originalNotesCount: 2,
		usersCount: 12,
		originalUsersCount: 5,
		reactionsCount: 11,
		instances: 13,
		driveUsageLocal: 0,
		driveUsageRemote: 0,
	});
});

test('a failed chart read propagates and does not start later phases', async () => {
	const calls = [];
	const failure = new Error('Notes chart failed');
	const feature = statisticsClient({
		readNotes: async () => { calls.push('notes'); throw failure; },
		readUsers: async () => { calls.push('users'); return { local: 1, remote: 2 }; },
		countReactions: async () => { calls.push('reactions'); return 3; },
		countInstances: async () => { calls.push('instances'); return 4; },
	});

	await assert.rejects(feature.stats({}), error => error === failure);
	assert.deepEqual(calls, ['notes']);

	const userFailure = new Error('Users chart failed');
	const userFeature = statisticsClient({
		readNotes: async () => { calls.push('notes-2'); return { local: 1, remote: 2 }; },
		readUsers: async () => { calls.push('users-2'); throw userFailure; },
		countReactions: async () => { calls.push('reactions-2'); return 3; },
		countInstances: async () => { calls.push('instances-2'); return 4; },
	});
	await assert.rejects(userFeature.stats({}), error => error === userFailure);
	assert.deepEqual(calls, ['notes', 'notes-2', 'users-2']);
});

test('malformed output is rejected', async () => {
	const feature = statisticsClient({
		readNotes: async () => ({ local: 1, remote: 2 }),
		readUsers: async () => ({ local: 3, remote: 4 }),
		countReactions: async () => 'not a number',
		countInstances: async () => 5,
	});
	await assert.rejects(feature.stats({}));
});

test('a failed count propagates after both concurrent counts have started', async () => {
	const calls = [];
	const failure = new Error('Reaction count failed');
	const feature = statisticsClient({
		readNotes: async () => ({ local: 0, remote: 0 }),
		readUsers: async () => ({ local: 0, remote: 0 }),
		countReactions: async () => { calls.push('reactions'); throw failure; },
		countInstances: async () => { calls.push('instances'); return 0; },
	});
	await assert.rejects(feature.stats({}), error => error === failure);
	assert.deepEqual(calls, ['reactions', 'instances']);
});

function statisticsClient(dependencies) {
	const chartNames = ['activeUsers', 'apRequest', 'drive', 'federation', 'instance', 'notes', 'userDrive', 'userFollowing', 'userNotes', 'userPv', 'userReactions', 'users'];
	const charts = Object.fromEntries(chartNames.map(name => [name, {
		getChart: async () => { throw new Error(`Unexpected ${name} chart route`); },
	}]));
	return createRouterClient(createStatisticsRouter({
		charts,
		readRetention: async () => { throw new Error('Unexpected retention route'); },
		...dependencies,
	}), { context: {
		services: { authenticate: async () => [null, null] },
		credential: null, ip: '127.0.0.1', headers: {},
	} });
}
