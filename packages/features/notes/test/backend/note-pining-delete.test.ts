/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { NotesRepository, UserNotePiningsRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { Config } from '@/config.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { RelayService } from '@features/federation/backend/services/RelayService.js';
import type { ApDeliverManagerService } from '@features/federation/backend/services/ApDeliverManagerService.js';
import type { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import { MiNote } from '../../backend/models/Note.js';
import { NotePiningService } from '../../backend/services/NotePiningService.js';

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(res => { resolve = res; });
	return { promise, resolve };
}

function createService() {
	const notes = mockDeep<NotesRepository>();
	const pinings = mockDeep<UserNotePiningsRepository>();
	const users = mockDeep<UserEntityService>();
	const note = new MiNote({});
	note.id = 'note-id';
	note.localOnly = false;
	note.visibility = 'public';
	notes.findOneBy.mockResolvedValue(note);
	users.isLocalUser.mockReturnValue(true);
	const service = new NotePiningService(
		mockDeep<Config>(), mockDeep<UsersRepository>(), notes, pinings, users,
		mockDeep<IdService>(), mockDeep<RoleService>(), mockDeep<RelayService>(),
		mockDeep<ApDeliverManagerService>(), mockDeep<ApRendererService>(),
	);
	const deliver = vi.spyOn(service, 'deliverPinnedChange').mockResolvedValue(undefined);
	return { service, pinings, deliver };
}

describe('removePinned database completion', () => {
	test('waits for deletion before completing and announcing the change', async () => {
		const { service, pinings, deliver } = createService();
		const deletion = deferred<{ affected: number; raw: unknown[] }>();
		const started = deferred<void>();
		pinings.delete.mockImplementation(() => {
			started.resolve();
			return deletion.promise;
		});
		let completed = false;
		const removal = service.removePinned({ id: 'user-id', host: null }, 'note-id').then(() => {
			completed = true;
		});
		await started.promise;
		await Promise.resolve();
		try {
			expect(completed).toBe(false);
			expect(deliver).not.toHaveBeenCalled();
			expect(pinings.delete).toHaveBeenCalledWith({ userId: 'user-id', noteId: 'note-id' });
		} finally {
			deletion.resolve({ affected: 1, raw: [] });
			await removal;
		}
		expect(completed).toBe(true);
		expect(deliver).toHaveBeenCalledExactlyOnceWith('user-id', 'note-id', false);
	});

	test('propagates a failed deletion without announcing success', async () => {
		const { service, pinings, deliver } = createService();
		const error = new Error('database deletion failed');
		pinings.delete.mockRejectedValue(error);
		await expect(service.removePinned({ id: 'user-id', host: null }, 'note-id')).rejects.toBe(error);
		expect(deliver).not.toHaveBeenCalled();
	});
});
