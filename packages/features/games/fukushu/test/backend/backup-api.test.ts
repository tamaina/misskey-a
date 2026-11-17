/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { call } from '@orpc/server';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { testContext } from '@features/auth/test/backend/native-context.js';
import { createFukushuRouter } from '../../backend/api.implementation.js';
import { backupContract } from '../../backend/backup.contract.js';
import { BackupError } from '../../backend/backup-codec.js';
import { MaterialError } from '../../backend/store.js';
import type { FukushuStore } from '../../backend/store.js';
import type { FukushuBackupStore } from '../../backend/backup-store.js';
import type { FukushuBackupInspector } from '../../backend/backup-drive.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

function fixture() {
	const backup = { store: mockDeep<FukushuBackupStore>(), inspector: mockDeep<FukushuBackupInspector>(), enqueue: vi.fn(async () => {}) };
	const api = createFukushuRouter(mockDeep<FukushuStore>(), undefined, undefined, backup);
	const user = mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false, movedToUri: null });
	return { backup, api, user };
}

const input = { id: 'deck', acknowledgeDriveVisibility: true as const };

test('requires a normal login and forbids third-party tokens even with all account and Drive scopes', async () => {
	const { api, backup, user } = fixture();
	await expect(call(api.backupExport, input, { context: testContext(null) })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	await expect(call(api.backupInspect, { fileId: '9x5n8yd9' }, { context: testContext(null) })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	const context = testContext(user, { permission: ['read:account', 'write:account', 'read:drive', 'write:drive'] });
	await expect(call(api.backupExport, input, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	await expect(call(api.backupInspect, { fileId: '9x5n8yd9' }, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	expect(backup.enqueue).not.toHaveBeenCalled(); expect(backup.inspector.inspect).not.toHaveBeenCalled();
});

test('checks ownership and acknowledgement before queueing and ignores client owner identities', async () => {
	const { api, backup, user } = fixture();
	for (const value of [{ id: 'deck' }, { id: 'deck', acknowledgeDriveVisibility: false }]) {
		await expect(call(api.backupExport, value as never, { context: testContext(user) })).rejects.toThrow();
	}
	expect(backup.enqueue).not.toHaveBeenCalled();
	await call(api.backupExport, { ...input, ownerId: 'bob' } as never, { context: testContext(user) });
	expect(backup.store.assertOwned).toHaveBeenCalledWith('alice', 'deck');
	expect(backup.enqueue).toHaveBeenCalledWith('alice', 'deck');
	expect(backup.enqueue.mock.invocationCallOrder[0]).toBeGreaterThan(backup.store.assertOwned.mock.invocationCallOrder[0]);
	await call(api.backupInspect, { fileId: '9x5n8yd9', ownerId: 'bob' } as never, { context: testContext(user) });
	expect(backup.inspector.inspect).toHaveBeenCalledWith('alice', '9x5n8yd9');
});

test('does not enqueue foreign decks and maps bounded validation failures', async () => {
	const { api, backup, user } = fixture();
	backup.store.assertOwned.mockRejectedValue(new MaterialError('NO_SUCH_MATERIAL'));
	await expect(call(api.backupExport, input, { context: testContext(user) })).rejects.toMatchObject({ code: 'NO_SUCH_MATERIAL', status: 404 });
	expect(backup.enqueue).not.toHaveBeenCalled();
	for (const code of ['INVALID_BACKUP', 'BACKUP_TOO_LARGE', 'UPSTREAM_BACKUP_UNSUPPORTED', 'BACKUP_FAILED'] as const) {
		backup.inspector.inspect.mockRejectedValueOnce(new BackupError(code));
		await expect(call(api.backupInspect, { fileId: '9x5n8yd9' }, { context: testContext(user) })).rejects.toMatchObject({ code, status: 400 });
	}
	expect(backupContract.backupExport['~orpc'].meta.limit).toEqual({ duration: 86400000, max: 5 });
});
