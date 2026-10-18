/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { EntityManager, Repository } from 'typeorm';
import type { Job } from 'bullmq';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { DeleteAccountProcessorService } from '@features/users/backend/jobs/DeleteAccountProcessorService.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import type { DbUserDeleteJobData } from '@features/runtime/backend/queue/types.js';

type Dependencies = ConstructorParameters<typeof DeleteAccountProcessorService>;
const intent = 'x'.repeat(43);

function fixture() {
	const deps = {
		users: mockDeep<Dependencies[0]>(), profiles: mockDeep<Dependencies[1]>(), notes: mockDeep<Dependencies[2]>(),
		files: mockDeep<Dependencies[3]>(), pages: mockDeep<Dependencies[4]>(), drive: mockDeep<Dependencies[5]>(),
		page: mockDeep<Dependencies[6]>(), email: mockDeep<Dependencies[7]>(), logger: mockDeep<Dependencies[8]>(),
		search: mockDeep<Dependencies[9]>(), deletion: mockDeep<Dependencies[10]>(),
	};
	deps.logger.logger.createSubLogger.mockReturnValue(mockDeep<Logger>());
	const service = new DeleteAccountProcessorService(deps.users, deps.profiles, deps.notes, deps.files, deps.pages, deps.drive, deps.page, deps.email, deps.logger, deps.search, deps.deletion);
	const manager = mockDeep<EntityManager>();
	const users = mockDeep<Repository<MiUser>>(); const profiles = mockDeep<Repository<MiUserProfile>>();
	const user = mockDeep<MiUser>({ id: 'synthetic-user', isDeleted: false, host: null });
	users.findOne.mockResolvedValue(user); profiles.findOne.mockResolvedValue(mockDeep<MiUserProfile>({ userId: user.id, deletionIntentId: intent }));
	manager.getRepository.mockImplementation(entity => {
		if (entity === MiUser) return users as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiUserProfile) return profiles as unknown as ReturnType<EntityManager['getRepository']>;
		throw new Error('Unexpected entity');
	});
	deps.users.manager.transaction.mockImplementation(async (...args) => { const run = args.at(-1); if (typeof run !== 'function') throw new Error('Missing transaction'); return run(manager); });
	deps.notes.find.mockResolvedValue([]); deps.files.find.mockResolvedValue([]); deps.pages.find.mockResolvedValue([]);
	deps.profiles.findOneByOrFail.mockResolvedValue(mockDeep<MiUserProfile>({ email: null }));
	const job = mockDeep<Job<DbUserDeleteJobData>>({ data: { user: { id: user.id }, soft: false, requiresCommittedDeletion: true, deletionIntentId: intent } });
	return { deps, service, users, profiles, user, manager, job };
}

test('an intent that did not commit cannot enqueue federation or delete account contents', async () => {
	const f = fixture(); await f.service.process(f.job);
	expect(f.users.findOne).toHaveBeenCalledWith({ where: { id: f.user.id }, lock: { mode: 'pessimistic_write' } });
	expect(f.profiles.findOne).not.toHaveBeenCalled(); expect(f.deps.deletion.deliverDeletion).not.toHaveBeenCalled();
	expect(f.deps.notes.find).not.toHaveBeenCalled(); expect(f.deps.users.delete).not.toHaveBeenCalled();
});

test('a different later deletion intent cannot revive a rolled-back queued request', async () => {
	const f = fixture(); f.user.isDeleted = true; f.profiles.findOne.mockResolvedValue(null);
	await f.service.process(f.job);
	expect(f.profiles.findOne).toHaveBeenCalledWith({ where: { userId: f.user.id, deletionIntentId: intent }, lock: { mode: 'pessimistic_write' } });
	expect(f.deps.deletion.deliverDeletion).not.toHaveBeenCalled(); expect(f.deps.users.delete).not.toHaveBeenCalled();
});

test('the exact committed intent enqueues Delete before physical removal', async () => {
	const f = fixture(); f.user.isDeleted = true;
	expect(await f.service.process(f.job)).toBe('Account deleted');
	expect(f.deps.deletion.deliverDeletion).toHaveBeenCalledExactlyOnceWith(f.user);
	expect(f.deps.deletion.deliverDeletion.mock.invocationCallOrder[0]).toBeLessThan(f.deps.notes.find.mock.invocationCallOrder[0]);
	expect(f.deps.users.delete).toHaveBeenCalledExactlyOnceWith(f.user.id);
});

test('a delivery queue failure leaves physical contents untouched for retry', async () => {
	const f = fixture(); f.user.isDeleted = true; f.deps.deletion.deliverDeletion.mockRejectedValue(new Error('Synthetic unavailable queue'));
	await expect(f.service.process(f.job)).rejects.toThrow('Synthetic unavailable queue');
	expect(f.deps.notes.find).not.toHaveBeenCalled(); expect(f.deps.users.delete).not.toHaveBeenCalled();
});
