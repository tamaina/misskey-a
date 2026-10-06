/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { createOperations } from '@features/operations/backend';
import { createPortability } from '@features/portability/backend';
import type { MiLocalUser } from '../../../../features/users/backend/models/User.js';
import * as pause from './endpoints/admin/queue/pause.js';
import * as clear from './endpoints/admin/queue/clear.js';
import * as following from './endpoints/i/export-following.js';
import * as notes from './endpoints/i/export-notes.js';

const actor = { id: 'trusted-user' } as MiLocalUser;

describe('batch feature endpoint adapters', () => {
	test('queue command transport preserves validation, policy and trusted actor', async () => {
		const queuePause = vi.fn(async () => {});
		const queueClear = vi.fn(async () => {});
		const log = vi.fn();
		const feature = createOperations({
			queuePause, queueClear, log,
			queueResume: async () => {}, queuePromoteJobs: async () => {},
			queueRetryJob: async () => {}, queueRemoveJob: async () => {},
		});
		const endpoint = pause.createEndpoint(feature);
		await endpoint.exec({ queue: 'db', actor: { id: 'forged' } }, actor, null);
		expect(queuePause).toHaveBeenCalledWith('db');
		expect(log).toHaveBeenCalledWith({ id: actor.id }, 'pauseQueue');
		await expect(endpoint.exec({ queue: 'unknown' }, actor, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		await expect(clear.createEndpoint(feature).exec({ queue: 'db', state: 'unknown' }, actor, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		await expect(endpoint.exec({ queue: 'db', actor: { id: 'forged' } }, null as unknown as MiLocalUser, null)).rejects.toThrow();
		expect(queuePause).toHaveBeenCalledTimes(1);
		expect(queueClear).not.toHaveBeenCalled();
		expect(pause.meta).toEqual({ tags: ['admin'], requireCredential: true, requireModerator: true, kind: 'write:admin:queue' });
	});

	test('export transport applies old defaults and retains credential/rate policy', async () => {
		const createExportFollowingJob = vi.fn();
		const createExportNotesJob = vi.fn();
		const feature = createPortability({
			createExportFollowingJob, createExportNotesJob,
			createExportAntennasJob: () => {}, createExportBlockingJob: () => {},
			createExportClipsJob: () => {}, createExportFavoritesJob: () => {},
			createExportMuteJob: () => {}, createExportUserListsJob: () => {},
		});
		const endpoint = following.createEndpoint(feature);
		await expect(endpoint.exec({ actor: { id: 'forged' } }, actor, null)).resolves.toBeUndefined();
		expect(createExportFollowingJob).toHaveBeenCalledWith({ id: actor.id }, false, false);
		await endpoint.exec({ excludeMuting: true, excludeInactive: true }, actor, null);
		expect(createExportFollowingJob).toHaveBeenLastCalledWith({ id: actor.id }, true, true);
		await expect(endpoint.exec({ excludeMuting: 'yes' }, actor, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		await expect(endpoint.exec({ actor: { id: 'forged' } }, null as unknown as MiLocalUser, null)).rejects.toThrow();
		expect(createExportFollowingJob).toHaveBeenCalledTimes(2);
		await expect(notes.createEndpoint(feature).exec({}, actor, null)).resolves.toBeUndefined();
		expect(createExportNotesJob).toHaveBeenCalledWith({ id: actor.id });
		expect(following.meta).toEqual({ secure: true, requireCredential: true, limit: { duration: 3600000, max: 1 } });
		expect(notes.meta).toEqual({ secure: true, requireCredential: true, limit: { duration: 86400000, max: 1 } });
	});
});
