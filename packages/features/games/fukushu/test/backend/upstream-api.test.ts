/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { call } from '@orpc/server';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { testContext } from '@features/auth/test/backend/native-context.js';
import { createFukushuRouter } from '../../backend/api.implementation.js';
import { MaterialError } from '../../backend/store.js';
import { UpstreamBackupError } from '../../shared/upstream-reader.js';
import { CompatibilitySessionError } from '../../backend/pilot/upstream-session.js';
import type { FukushuStore } from '../../backend/store.js';
import type { FukushuUpstreamStore } from '../../backend/upstream-store.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const input = { fileId: '9x5n8yd9', requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', confirmRestore: true as const };
const review = { requestId: input.requestId, questionId: 'anki:source-card', expectedRevision: 0, rating: 'good' as const, correct: false, answers: ['answer'], durationMs: 100 };

function fixture() {
	const upstream = { store: mockDeep<FukushuUpstreamStore>(), enqueue: vi.fn(async () => {}) };
	const api = createFukushuRouter(mockDeep<FukushuStore>(), undefined, undefined, undefined, upstream);
	const user = mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false, movedToUri: null });
	return { upstream, api, user };
}

test('source import/export require normal login; show/review separate read/write scopes', async () => {
	const { upstream, api, user } = fixture();
	for (const context of [testContext(null), testContext(user, { permission: ['read:account', 'write:account', 'read:drive', 'write:drive'] })]) {
		await expect(call(api.upstreamRestore, input, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
		await expect(call(api.upstreamExport, { acknowledgeDriveVisibility: true }, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	}
	await expect(call(api.upstreamShow, {}, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
	await expect(call(api.upstreamReview, review, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
	await expect(call(api.upstreamShow, {}, { context: testContext(user, { permission: ['write:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	await expect(call(api.upstreamReview, review, { context: testContext(user, { permission: ['read:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	expect(upstream.store.restore).not.toHaveBeenCalled(); expect(upstream.store.review).not.toHaveBeenCalled(); expect(upstream.enqueue).not.toHaveBeenCalled();
});
test('binds identities and server time, preserves non-UUID source IDs, and requires confirmations', async () => {
	const { upstream, api, user } = fixture(); const context = testContext(user);
	await expect(call(api.upstreamRestore, { ...input, confirmRestore: false } as never, { context })).rejects.toThrow();
	await expect(call(api.upstreamExport, {} as never, { context })).rejects.toThrow();
	expect(upstream.store.restore).not.toHaveBeenCalled(); expect(upstream.enqueue).not.toHaveBeenCalled();
	await call(api.upstreamRestore, { ...input, ownerId: 'bob' } as never, { context });
	expect(upstream.store.restore).toHaveBeenCalledWith('alice', input.fileId, input.requestId);
	await call(api.upstreamReview, { ...review, ownerId: 'bob', reviewedAt: '2099-01-01T00:00:00Z', card: {} } as never, { context });
	expect(upstream.store.review).toHaveBeenCalledWith('alice', review);
	await call(api.upstreamExport, { acknowledgeDriveVisibility: true }, { context });
	expect(upstream.store.show).toHaveBeenCalledWith('alice'); expect(upstream.enqueue).toHaveBeenCalledWith('alice');
	expect(upstream.store.show.mock.invocationCallOrder[0]).toBeLessThan(upstream.enqueue.mock.invocationCallOrder[0]);
});
test('maps source format and concurrency errors without creating an export for missing owners', async () => {
	const { upstream, api, user } = fixture(); const context = testContext(user);
	upstream.store.show.mockRejectedValueOnce(new MaterialError('NO_SUCH_MATERIAL'));
	await expect(call(api.upstreamExport, { acknowledgeDriveVisibility: true }, { context })).rejects.toMatchObject({ code: 'NO_SUCH_MATERIAL', status: 404 });
	expect(upstream.enqueue).not.toHaveBeenCalled();
	for (const code of ['INVALID_BACKUP', 'BACKUP_TOO_LARGE', 'UPSTREAM_INSPECTION_LIMIT'] as const) {
		upstream.store.restore.mockRejectedValueOnce(new UpstreamBackupError(code));
		await expect(call(api.upstreamRestore, input, { context })).rejects.toMatchObject({ code, status: 400 });
	}
	for (const code of ['STALE_STATE', 'REQUEST_CONFLICT', 'HISTORY_ID_EXISTS', 'NOT_STUDYABLE'] as const) {
		upstream.store.review.mockRejectedValueOnce(new CompatibilitySessionError(code));
		await expect(call(api.upstreamReview, review, { context })).rejects.toMatchObject({ code: code === 'NOT_STUDYABLE' ? 'STUDY_UNAVAILABLE' : 'STUDY_CONFLICT', status: 409 });
	}
});
