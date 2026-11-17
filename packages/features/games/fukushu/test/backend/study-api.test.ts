/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { call } from '@orpc/server';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { testContext } from '@features/auth/test/backend/native-context.js';
import { createFukushuRouter } from '../../backend/api.implementation.js';
import { studyContract } from '../../backend/study.contract.js';
import { FukushuStudyStore, StudyError } from '../../backend/study-store.js';
import { MaterialError } from '../../backend/store.js';
import type { FukushuStore } from '../../backend/store.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const request = { id: 'deck', questionId: 'card', questionVersion: 1, expectedStateRevision: 0, requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', rating: 'good' as const, durationMs: 0 };

function fixture() {
	const study = mockDeep<FukushuStudyStore>();
	const api = createFukushuRouter(mockDeep<FukushuStore>(), undefined, study);
	const user = mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false, movedToUri: null });
	return { study, api, user };
}

describe('private flashcard study contract', () => {
	test('requires a principal and separates account read/write scopes', async () => {
		const { study, api, user } = fixture();
		await expect(call(api.studyQueue, { id: 'deck' }, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(api.studyReview, request, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(api.studyHistory, { id: 'deck' }, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(api.studyQueue, { id: 'deck' }, { context: testContext(user, { permission: ['write:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		await expect(call(api.studyHistory, { id: 'deck' }, { context: testContext(user, { permission: ['write:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		await expect(call(api.studyReview, request, { context: testContext(user, { permission: ['read:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(study.queue).not.toHaveBeenCalled(); expect(study.review).not.toHaveBeenCalled(); expect(study.history).not.toHaveBeenCalled();
	});
	test('uses the principal and finite server-owned input shape, normalizing UUID cursors and retries', async () => {
		const { study, api, user } = fixture();
		const context = testContext(user);
		await call(api.studyReview, { ...request, requestId: request.requestId.toUpperCase(), ownerId: 'bob', correct: true, reviewedAt: '2099-01-01', card: {}, state: {} } as never, { context });
		expect(study.review).toHaveBeenCalledWith('alice', request);
		await call(api.studyQueue, { id: 'deck', ownerId: 'bob' } as never, { context });
		expect(study.queue).toHaveBeenCalledWith('alice', 'deck');
		await call(api.studyHistory, { id: 'deck', beforeId: request.requestId.toUpperCase(), ownerId: 'bob' } as never, { context });
		expect(study.history).toHaveBeenCalledWith('alice', 'deck', { beforeId: request.requestId, limit: 20 });
	});
	test.each([
		{ rating: 'invalid' }, { requestId: 'not-uuid' }, { expectedStateRevision: -1 }, { expectedStateRevision: 1.5 },
		{ questionVersion: 0 }, { questionVersion: 2_147_483_648 }, { durationMs: -1 }, { durationMs: 0.5 }, { durationMs: 86_400_001 },
	])('rejects invalid review fields before storage (%j)', async invalid => {
		const { study, api, user } = fixture();
		await expect(call(api.studyReview, { ...request, ...invalid } as never, { context: testContext(user) })).rejects.toThrow();
		expect(study.review).not.toHaveBeenCalled();
	});
	test.each([{ beforeId: 'invalid' }, { limit: 0 }, { limit: 21 }, { limit: 1.5 }])('bounds history input (%j)', async invalid => {
		const { study, api, user } = fixture();
		await expect(call(api.studyHistory, { id: 'deck', ...invalid }, { context: testContext(user) })).rejects.toThrow();
		expect(study.history).not.toHaveBeenCalled();
	});
	test('maps availability, capacity, ownership and optimistic concurrency failures', async () => {
		const { study, api, user } = fixture();
		for (const [code, status] of [['STUDY_CONFLICT', 409], ['STUDY_UNAVAILABLE', 409], ['STUDY_LIMIT', 400]] as const) {
			study.review.mockRejectedValueOnce(new StudyError(code));
			await expect(call(api.studyReview, request, { context: testContext(user) })).rejects.toMatchObject({ code, status });
		}
		for (const [code, status] of [['NO_SUCH_MATERIAL', 404], ['CARD_HISTORY_LIMIT', 400]] as const) {
			study.review.mockRejectedValueOnce(new MaterialError(code));
			await expect(call(api.studyReview, request, { context: testContext(user) })).rejects.toMatchObject({ code, status });
		}
	});
	test('preserves literal SDK names and a sixty-per-minute budget', () => {
		expectTypeOf(studyContract.studyQueue['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/study/queue'>();
		expectTypeOf(studyContract.studyReview['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/study/review'>();
		expectTypeOf(studyContract.studyHistory['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/study/history'>();
		for (const contract of Object.values(studyContract)) expect(contract['~orpc'].meta.limit).toEqual({ duration: 60_000, max: 60 });
	});
});
