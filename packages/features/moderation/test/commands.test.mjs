/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import baseline from './command-metadata.fixture.json' with { type: 'json' };
import {
	createModerationCommands,
	legacyModerationCommandSchemas,
	moderationCommandErrors,
	moderationCommandMeta,
} from '../../../backend/built/features/moderation/backend.js';

const routeKeys = Object.keys(baseline);
const actor = { id: 'moderator1', trustedMarker: { source: 'session' } };
const user = {
	id: 'target1',
	username: 'target',
	host: null,
	avatarId: 'avatar1',
	bannerId: 'banner1',
};
const profile = { moderationNote: 'before note' };
const report = { id: 'report1' };

function createError(definition) {
	const error = new Error(definition.code);
	error.definition = definition;
	return error;
}

function createDeps(overrides = {}) {
	const calls = [];
	const deps = {
		findUserById: async id => { calls.push(['findUserById', id]); return user; },
		isModerator: async found => { calls.push(['isModerator', found]); return false; },
		suspend: async (found, moderator) => { calls.push(['suspend', found, moderator]); },
		unsuspend: async (found, moderator) => { calls.push(['unsuspend', found, moderator]); },
		updateUser: async (id, values) => { calls.push(['updateUser', id, values]); },
		findUserProfileByUserIdOrFail: async userId => { calls.push(['findUserProfileByUserIdOrFail', userId]); return profile; },
		updateUserProfile: async (userId, values) => { calls.push(['updateUserProfile', userId, values]); },
		logUserAvatarUnset: (moderator, values) => { calls.push(['logUserAvatarUnset', moderator, values]); },
		logUserBannerUnset: (moderator, values) => { calls.push(['logUserBannerUnset', moderator, values]); },
		logUserNoteUpdate: (moderator, values) => { calls.push(['logUserNoteUpdate', moderator, values]); },
		findAbuseReportById: async id => { calls.push(['findAbuseReportById', id]); return report; },
		forwardAbuseReport: async (id, moderator) => { calls.push(['forwardAbuseReport', id, moderator]); },
		resolveAbuseReports: async (reports, moderator) => { calls.push(['resolveAbuseReports', reports, moderator]); },
		updateAbuseReport: async (id, values, moderator) => { calls.push(['updateAbuseReport', id, values, moderator]); },
		deleteAbuseReportNotificationRecipient: async (id, moderator) => { calls.push(['deleteAbuseReportNotificationRecipient', id, moderator]); },
		createError: definition => createError(definition),
		...overrides,
	};
	return { deps, calls };
}

function invoke(feature, route, input, moderator) {
	if (arguments.length < 4) moderator = actor;
	return feature[route](input, { context: { actor: moderator } });
}

test('moderation route schemas and HTTP metadata match the original endpoint fixture', () => {
	assert.deepEqual(Object.keys(moderationCommandMeta), routeKeys);
	for (const route of routeKeys) {
		assert.deepEqual(moderationCommandMeta[route], baseline[route].meta, `${route} meta`);
		assert.deepEqual(legacyModerationCommandSchemas[route].input, baseline[route].paramDef, `${route} paramDef`);
		assert.equal(legacyModerationCommandSchemas[route].input.additionalProperties, undefined, `${route} permits extra fields by AJV default`);
	}

	assert.deepEqual(moderationCommandErrors['admin/forward-abuse-user-report'].noSuchAbuseReport.id, '8763e21b-d9bc-40be-acf6-54c1a6986493');
	assert.deepEqual(moderationCommandErrors['admin/resolve-abuse-user-report'].noSuchAbuseReport.id, 'ac3794dd-2ce4-d878-e546-73c60c06b398');
	assert.deepEqual(moderationCommandErrors['admin/update-abuse-user-report'].noSuchAbuseReport.id, '15f51cf5-46d1-4b1d-a618-b35bcbed0662');
});

test('all nine moderation commands preserve handler order, awaited service calls and actor identity', async () => {
	const { deps, calls } = createDeps();
	const feature = createModerationCommands(deps);

	for (const [route, input] of [
		['admin/suspend-user', { userId: 'target1' }],
		['admin/unsuspend-user', { userId: 'target1' }],
		['admin/unset-user-avatar', { userId: 'target1' }],
		['admin/unset-user-banner', { userId: 'target1' }],
		['admin/update-user-note', { userId: 'target1', text: '' }],
		['admin/forward-abuse-user-report', { reportId: 'report1' }],
		['admin/resolve-abuse-user-report', { reportId: 'report1', resolvedAs: 'accept' }],
		['admin/update-abuse-user-report', { reportId: 'report1', moderationNote: '' }],
		['admin/abuse-report/notification-recipient/delete', { id: 'recipient1' }],
	]) {
		assert.equal(await invoke(feature, route, input), undefined, route);
	}

	assert.deepEqual(calls, [
		['findUserById', 'target1'], ['isModerator', user], ['suspend', user, actor],
		['findUserById', 'target1'], ['unsuspend', user, actor],
		['findUserById', 'target1'], ['updateUser', 'target1', { avatar: null, avatarId: null, avatarUrl: null, avatarBlurhash: null }],
		['logUserAvatarUnset', actor, { userId: 'target1', userUsername: 'target', userHost: null, fileId: 'avatar1' }],
		['findUserById', 'target1'], ['updateUser', 'target1', { banner: null, bannerId: null, bannerUrl: null, bannerBlurhash: null }],
		['logUserBannerUnset', actor, { userId: 'target1', userUsername: 'target', userHost: null, fileId: 'banner1' }],
		['findUserById', 'target1'], ['findUserProfileByUserIdOrFail', 'target1'],
		['updateUserProfile', 'target1', { moderationNote: '' }],
		['logUserNoteUpdate', actor, { userId: 'target1', userUsername: 'target', userHost: null, before: 'before note', after: '' }],
		['findAbuseReportById', 'report1'], ['forwardAbuseReport', 'report1', actor],
		['findAbuseReportById', 'report1'], ['resolveAbuseReports', [{ reportId: 'report1', resolvedAs: 'accept' }], actor],
		['findAbuseReportById', 'report1'], ['updateAbuseReport', 'report1', { moderationNote: '' }, actor],
		['deleteAbuseReportNotificationRecipient', 'recipient1', actor],
	]);
	assert.strictEqual(calls[1][1], user);
	assert.strictEqual(calls[2][1], user);
	assert.strictEqual(calls[2][2], actor);
	assert.strictEqual(calls[4][1], user);
	assert.strictEqual(calls[4][2], actor);
	assert.strictEqual(calls[7][1], actor);
	assert.strictEqual(calls[10][1], actor);
	assert.strictEqual(calls[14][1], actor);
	assert.strictEqual(calls[16][2], actor);
	assert.strictEqual(calls[18][2], actor);
	assert.strictEqual(calls[20][3], actor);
	assert.strictEqual(calls[21][2], actor);
});

test('each command awaits its domain port before resolving', async () => {
	for (const [route, input, port] of [
		['admin/suspend-user', { userId: 'target1' }, 'suspend'],
		['admin/unsuspend-user', { userId: 'target1' }, 'unsuspend'],
		['admin/unset-user-avatar', { userId: 'target1' }, 'updateUser'],
		['admin/unset-user-banner', { userId: 'target1' }, 'updateUser'],
		['admin/update-user-note', { userId: 'target1', text: 'note' }, 'updateUserProfile'],
		['admin/forward-abuse-user-report', { reportId: 'report1' }, 'forwardAbuseReport'],
		['admin/resolve-abuse-user-report', { reportId: 'report1' }, 'resolveAbuseReports'],
		['admin/update-abuse-user-report', { reportId: 'report1' }, 'updateAbuseReport'],
		['admin/abuse-report/notification-recipient/delete', { id: 'recipient1' }, 'deleteAbuseReportNotificationRecipient'],
	]) {
		let release;
		let notifyStarted;
		const started = new Promise(resolve => { notifyStarted = resolve; });
		const pendingPort = new Promise(resolve => { release = resolve; });
		const { deps } = createDeps({ [port]: () => { notifyStarted(); return pendingPort; } });
		let settled = false;
		const pendingRoute = invoke(createModerationCommands(deps), route, input)
			.then(() => { settled = true; });
		await started;
		assert.equal(settled, false, `${route} must wait for ${port}`);
		release();
		await pendingRoute;
		assert.equal(settled, true, `${route} resolves after ${port}`);
	}
});

test('missing users, protected targets, missing profiles and missing reports fail before later effects', async () => {
	for (const route of [
		'admin/suspend-user', 'admin/unsuspend-user', 'admin/unset-user-avatar', 'admin/unset-user-banner', 'admin/update-user-note',
	]) {
		const { deps, calls } = createDeps({ findUserById: async id => { calls.push(['findUserById', id]); return null; } });
		const feature = createModerationCommands(deps);
		const input = route === 'admin/update-user-note' ? { userId: 'missing1', text: 'note' } : { userId: 'missing1' };
		await assert.rejects(invoke(feature, route, input), /user not found/);
		assert.deepEqual(calls, [['findUserById', 'missing1']], route);
	}

	const protectedTarget = createDeps({ isModerator: async found => { protectedTarget.calls.push(['isModerator', found]); return true; } });
	await assert.rejects(invoke(createModerationCommands(protectedTarget.deps), 'admin/suspend-user', { userId: 'target1' }), /cannot suspend moderator account/);
	assert.deepEqual(protectedTarget.calls, [['findUserById', 'target1'], ['isModerator', user]]);

	const profileFailure = createDeps({ findUserProfileByUserIdOrFail: async userId => { profileFailure.calls.push(['findUserProfileByUserIdOrFail', userId]); throw new Error('profile missing'); } });
	await assert.rejects(invoke(createModerationCommands(profileFailure.deps), 'admin/update-user-note', { userId: 'target1', text: 'after' }), /profile missing/);
	assert.deepEqual(profileFailure.calls, [['findUserById', 'target1'], ['findUserProfileByUserIdOrFail', 'target1']]);

	for (const [route, errorId] of [
		['admin/forward-abuse-user-report', '8763e21b-d9bc-40be-acf6-54c1a6986493'],
		['admin/resolve-abuse-user-report', 'ac3794dd-2ce4-d878-e546-73c60c06b398'],
		['admin/update-abuse-user-report', '15f51cf5-46d1-4b1d-a618-b35bcbed0662'],
	]) {
		const { deps, calls } = createDeps({ findAbuseReportById: async id => { calls.push(['findAbuseReportById', id]); return null; } });
		const feature = createModerationCommands(deps);
		const input = route === 'admin/forward-abuse-user-report'
			? { reportId: 'missing1' }
			: route === 'admin/resolve-abuse-user-report'
				? { reportId: 'missing1' }
				: { reportId: 'missing1' };
		await assert.rejects(invoke(feature, route, input), error => {
			assert.equal(error.definition.id, errorId);
			assert.equal(error.definition.code, 'NO_SUCH_ABUSE_REPORT');
			assert.equal(error.definition.httpStatusCode, 404);
			return true;
		});
		assert.deepEqual(calls, [['findAbuseReportById', 'missing1']], route);
	}
});

test('unset avatar/banner retain their no-op path; all three moderation logs are fire-and-forget', async () => {
	for (const [route, field] of [['admin/unset-user-avatar', 'avatarId'], ['admin/unset-user-banner', 'bannerId']]) {
		const noImageUser = { ...user, [field]: null };
		const { deps, calls } = createDeps({ findUserById: async id => { calls.push(['findUserById', id]); return noImageUser; } });
		await invoke(createModerationCommands(deps), route, { userId: 'target1' });
		assert.deepEqual(calls, [['findUserById', 'target1']], route);
	}

	for (const [route, logPort, input] of [
		['admin/unset-user-avatar', 'logUserAvatarUnset', { userId: 'target1' }],
		['admin/unset-user-banner', 'logUserBannerUnset', { userId: 'target1' }],
		['admin/update-user-note', 'logUserNoteUpdate', { userId: 'target1', text: 'after' }],
	]) {
		let releaseLog;
		const pendingLog = new Promise(resolve => { releaseLog = resolve; });
		const { deps, calls } = createDeps({ [logPort]: (moderator, values) => { calls.push([logPort, moderator, values]); return pendingLog; } });
		let settled = false;
		const request = invoke(createModerationCommands(deps), route, input).then(value => { settled = true; return value; });
		await new Promise(resolve => setImmediate(resolve));
		assert.equal(settled, true, `${logPort} must not delay ${route}`);
		assert.equal(await request, undefined);
		assert.equal(calls.at(-1)[0], logPort);
		releaseLog();
	}
});

test('report optional/null/omitted fields and all routes keep legacy permissive input semantics', async () => {
	const inputFeature = createModerationCommands(createDeps().deps);
	for (const [route, input] of [
		['admin/suspend-user', { userId: 'target1', extra: true }],
		['admin/update-user-note', { userId: 'target1', text: '' }],
		['admin/resolve-abuse-user-report', { reportId: 'report1' }],
		['admin/resolve-abuse-user-report', { reportId: 'report1', resolvedAs: null }],
		['admin/resolve-abuse-user-report', { reportId: 'report1', resolvedAs: 'accept' }],
		['admin/update-abuse-user-report', { reportId: 'report1' }],
		['admin/update-abuse-user-report', { reportId: 'report1', moderationNote: '🙂'.repeat(8_000) }],
		['admin/abuse-report/notification-recipient/delete', { id: 'recipient1', ignored: 3 }],
	]) {
		await invoke(inputFeature, route, input);
	}

	for (const [route, input] of [
		['admin/suspend-user', {}],
		['admin/suspend-user', { userId: 'bad-id' }],
		['admin/update-user-note', { userId: 'target1' }],
		['admin/update-user-note', { userId: 'target1', text: null }],
		['admin/resolve-abuse-user-report', { reportId: 'report1', resolvedAs: 'other' }],
		['admin/update-abuse-user-report', { reportId: 'report1', moderationNote: null }],
		['admin/abuse-report/notification-recipient/delete', { id: '' }],
	]) {
		await assert.rejects(invoke(inputFeature, route, input), `${route} rejects its invalid input`);
	}

	const { deps, calls } = createDeps();
	const feature = createModerationCommands(deps);
	await invoke(feature, 'admin/resolve-abuse-user-report', { reportId: 'report1' });
	await invoke(feature, 'admin/resolve-abuse-user-report', { reportId: 'report1', resolvedAs: null });
	await invoke(feature, 'admin/update-abuse-user-report', { reportId: 'report1' });
	assert.deepEqual(calls, [
		['findAbuseReportById', 'report1'], ['resolveAbuseReports', [{ reportId: 'report1', resolvedAs: null }], actor],
		['findAbuseReportById', 'report1'], ['resolveAbuseReports', [{ reportId: 'report1', resolvedAs: null }], actor],
		['findAbuseReportById', 'report1'], ['updateAbuseReport', 'report1', { moderationNote: undefined }, actor],
	]);
});

test('invalid/missing actors and invalid required inputs produce no dependency side effects', async () => {
	for (const route of routeKeys) {
		const { deps, calls } = createDeps();
		const feature = createModerationCommands(deps);
		const input = route === 'admin/abuse-report/notification-recipient/delete'
			? { id: 'recipient1' }
			: route.includes('abuse-user-report') ? { reportId: 'report1' }
			: route === 'admin/update-user-note' ? { userId: 'target1', text: 'note' } : { userId: 'target1' };
		for (const invalidActor of [undefined, null, {}, { id: '' }]) {
			await assert.rejects(invoke(feature, route, input, invalidActor));
		}
		const invalidInput = route === 'admin/abuse-report/notification-recipient/delete'
			? {}
			: route.includes('abuse-user-report') ? { reportId: 'invalid-id' }
			: route === 'admin/update-user-note' ? { userId: 'target1' } : {};
		await assert.rejects(invoke(feature, route, invalidInput));
		assert.deepEqual(calls, [], route);
	}
});
