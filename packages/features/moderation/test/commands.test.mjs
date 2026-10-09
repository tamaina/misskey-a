/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModerationOperations } from '../../../backend/built/features/moderation/backend.js';

const actor = { id: 'moderator1', isSuspended: false, movedToUri: null, trustedMarker: { source: 'session' } };
const target = { id: 'target1', username: 'target', host: null, avatarId: 'avatar1', bannerId: 'banner1' };

function fixture(overrides = {}) {
	const calls = [];
	const deps = {
		usersRepository: { findOneBy: async () => target, update: async (...args) => { calls.push(['updateUser', ...args]); } },
		userProfilesRepository: { findOneByOrFail: async () => ({ moderationNote: 'before' }), update: async (...args) => { calls.push(['updateProfile', ...args]); } },
		roleService: { isModerator: async () => false },
		userSuspendService: { suspend: async (...args) => { calls.push(['suspend', ...args]); }, unsuspend: async (...args) => { calls.push(['unsuspend', ...args]); } },
		moderationLogService: { log: (...args) => { calls.push(['log', ...args]); } },
		abuseUserReportsRepository: { findOneBy: async () => ({ id: 'report1' }) },
		abuseReportService: { forward: async (...args) => { calls.push(['forward', ...args]); }, resolve: async (...args) => { calls.push(['resolve', ...args]); }, update: async (...args) => { calls.push(['updateReport', ...args]); } },
		abuseReportNotificationService: { deleteRecipient: async (...args) => { calls.push(['deleteRecipient', ...args]); } },
		...overrides,
	};
	return { operations: createModerationOperations(deps), calls };
}

test('native suspend and unsuspend preserve the trusted actor identity and missing-user behavior', async () => {
	const { operations, calls } = fixture();
	assert.equal(await operations.adminSuspendUser({ userId: target.id }, actor), undefined);
	assert.equal(await operations.adminUnsuspendUser({ userId: target.id }, actor), undefined);
	assert.deepEqual(calls, [['suspend', target, actor], ['unsuspend', target, actor]]);
	assert.equal(calls[0][2], actor);
	const missing = fixture({ usersRepository: { findOneBy: async () => null } });
	await assert.rejects(missing.operations.adminSuspendUser({ userId: target.id }, actor), /user not found/);
	const moderator = fixture({ roleService: { isModerator: async () => true } });
	await assert.rejects(moderator.operations.adminSuspendUser({ userId: target.id }, actor), /cannot suspend moderator/);
	assert.deepEqual(moderator.calls, []);
});

for (const [method, id] of [
	['adminForwardAbuseUserReport', '8763e21b-d9bc-40be-acf6-54c1a6986493'],
	['adminResolveAbuseUserReport', 'ac3794dd-2ce4-d878-e546-73c60c06b398'],
	['adminUpdateAbuseUserReport', '15f51cf5-46d1-4b1d-a618-b35bcbed0662'],
]) {
	test(`native ${method} preserves missing report UUID and status before business calls`, async () => {
		const { operations, calls } = fixture({ abuseUserReportsRepository: { findOneBy: async () => null } });
		await assert.rejects(operations[method]({ reportId: 'report1' }, actor), error =>
			error.code === 'NO_SUCH_ABUSE_REPORT' && error.status === 404 && error.data.id === id);
		assert.deepEqual(calls, []);
	});
}

test('native resolution and note update retain null/default semantics and audit values', async () => {
	const { operations, calls } = fixture();
	await operations.adminResolveAbuseUserReport({ reportId: 'report1' }, actor);
	await operations.adminUpdateAbuseUserReport({ reportId: 'report1' }, actor);
	await operations.adminUpdateUserNote({ userId: target.id, text: 'after' }, actor);
	assert.deepEqual(calls, [
		['resolve', [{ reportId: 'report1', resolvedAs: null }], actor],
		['updateReport', 'report1', { moderationNote: undefined }, actor],
		['updateProfile', { userId: target.id }, { moderationNote: 'after' }],
		['log', actor, 'updateUserNote', { userId: target.id, userUsername: target.username, userHost: null, before: 'before', after: 'after' }],
	]);
});

test('native avatar/banner unsets retain the original file ID in audit records; absent media stays a no-op', async () => {
	const { operations, calls } = fixture();
	await operations.adminUnsetUserAvatar({ userId: target.id }, actor);
	await operations.adminUnsetUserBanner({ userId: target.id }, actor);
	assert.deepEqual(calls, [
		['updateUser', target.id, { avatar: null, avatarId: null, avatarUrl: null, avatarBlurhash: null }],
		['log', actor, 'unsetUserAvatar', { userId: target.id, userUsername: target.username, userHost: null, fileId: target.avatarId }],
		['updateUser', target.id, { banner: null, bannerId: null, bannerUrl: null, bannerBlurhash: null }],
		['log', actor, 'unsetUserBanner', { userId: target.id, userUsername: target.username, userHost: null, fileId: target.bannerId }],
	]);
	const empty = fixture({ usersRepository: { findOneBy: async () => ({ ...target, avatarId: null, bannerId: null }) } });
	await empty.operations.adminUnsetUserAvatar({ userId: target.id }, actor);
	await empty.operations.adminUnsetUserBanner({ userId: target.id }, actor);
	assert.deepEqual(empty.calls, []);
});
