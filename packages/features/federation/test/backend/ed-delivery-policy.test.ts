/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';
import type { ModuleRef } from '@nestjs/core';
import type { Job } from 'bullmq';
import type { FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import { ApDeliverManagerService } from '../../backend/services/ApDeliverManagerService.js';
import { UserKeypairService } from '../../backend/services/UserKeypairService.js';
import { MiUserKeypair } from '../../backend/models/UserKeypair.js';
import { DeliverProcessorService } from '../../backend/jobs/DeliverProcessorService.js';
import { AccountUpdateService } from '@features/users/backend/services/AccountUpdateService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type { DeliverJobData } from '@features/runtime/backend/queue/types.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';

const actor = { id: 'actor', host: null };
const activity = { id: 'https://local.example/activities/1', type: 'Create', actor: 'https://local.example/users/actor', object: { type: 'Note', content: '日本語 😀' } };
const destination = 'https://peer.example/inbox';

function managerFixture() {
	const keys = mockDeep<UserKeypairService>();
	const account = mockDeep<AccountUpdateService>();
	const queue = mockDeep<QueueService>();
	const followings = mockDeep<FollowingsRepository>();
	followings.find.mockResolvedValue([]);
	const moduleRef = mock<ModuleRef>();
	moduleRef.get.mockReturnValue(account);
	const service = Object.assign(Object.create(ApDeliverManagerService.prototype), {
		keyPreparations: new Map(), failedKeyPublications: new Set(), userKeypairService: keys, moduleRef, queueService: queue, followingsRepository: followings, logger: mockDeep<Logger>(),
	}) as ApDeliverManagerService;
	return { keys, account, queue, moduleRef, service };
}

describe('Ed key preparation and durable RSA delivery policy', () => {
	test('new key prepares a forced RSA Update enqueue before enqueueing the original activity', async () => {
		const f = managerFixture();
		f.keys.refreshAndPrepareEd25519KeyPair.mockResolvedValue(new MiUserKeypair({ userId: actor.id }));
		let finish!: () => void;
		f.account.publishToFollowers.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
		const manager = f.service.createDeliverManager(actor, activity);
		manager.addFollowersRecipe();
		const execution = manager.execute();
		await vi.waitFor(() => expect(f.account.publishToFollowers).toHaveBeenCalledWith(actor.id, true));
		expect(f.queue.deliverMany).not.toHaveBeenCalled();
		finish();
		await execution;
		expect(f.moduleRef.get).toHaveBeenCalledWith('AccountUpdateService', { strict: false });
		expect(f.queue.deliverMany).toHaveBeenCalledWith({ id: actor.id }, activity, new Map(), false);
	});

	test('forced RSA Update skips key preparation and recursion', async () => {
		const f = managerFixture();
		await f.service.deliverToFollowers(actor, { type: 'Update', actor: activity.actor, object: activity.actor }, true);
		expect(f.keys.refreshAndPrepareEd25519KeyPair).not.toHaveBeenCalled();
		expect(f.moduleRef.get).not.toHaveBeenCalled();
		expect(f.queue.deliverMany).toHaveBeenCalledWith({ id: actor.id }, expect.objectContaining({ type: 'Update' }), new Map(), true);
	});

	test('an existing or concurrently prepared key does not require another announcement', async () => {
		const f = managerFixture();
		await f.service.deliverToFollowers(actor, activity);
		expect(f.keys.refreshAndPrepareEd25519KeyPair).toHaveBeenCalledWith(actor.id);
		expect(f.account.publishToFollowers).not.toHaveBeenCalled();
		expect(f.queue.deliverMany).toHaveBeenCalledOnce();
	});

	test('publication enqueue failure remains visible and does not enqueue the original activity', async () => {
		const f = managerFixture();
		f.keys.refreshAndPrepareEd25519KeyPair.mockResolvedValue(new MiUserKeypair({ userId: actor.id }));
		f.account.publishToFollowers.mockRejectedValue(new Error('queue unavailable'));
		await expect(f.service.deliverToFollowers(actor, activity)).rejects.toThrow('queue unavailable');
		expect(f.queue.deliverMany).not.toHaveBeenCalled();
	});

	test('a failed RSA Update enqueue is retried when the key already exists', async () => {
		const f = managerFixture();
		f.keys.refreshAndPrepareEd25519KeyPair.mockResolvedValueOnce(new MiUserKeypair({ userId: actor.id })).mockResolvedValue(undefined);
		f.account.publishToFollowers.mockRejectedValueOnce(new Error('queue unavailable')).mockResolvedValue(undefined);
		await expect(f.service.deliverToFollowers(actor, activity)).rejects.toThrow('queue unavailable');
		await f.service.deliverToFollowers(actor, activity);
		expect(f.account.publishToFollowers).toHaveBeenCalledTimes(2);
		expect(f.queue.deliverMany).toHaveBeenCalledOnce();
	});

	test('concurrent managers wait for the same key creation and RSA Update enqueue', async () => {
		const f = managerFixture();
		f.keys.refreshAndPrepareEd25519KeyPair.mockResolvedValue(new MiUserKeypair({ userId: actor.id }));
		let finish!: () => void;
		f.account.publishToFollowers.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
		const first = f.service.deliverToFollowers(actor, activity);
		await vi.waitFor(() => expect(f.account.publishToFollowers).toHaveBeenCalledOnce());
		const second = f.service.deliverToFollowers(actor, activity);
		expect(f.queue.deliverMany).not.toHaveBeenCalled();
		finish();
		await Promise.all([first, second]);
		expect(f.keys.refreshAndPrepareEd25519KeyPair).toHaveBeenCalledOnce();
		expect(f.account.publishToFollowers).toHaveBeenCalledOnce();
		expect(f.queue.deliverMany).toHaveBeenCalledTimes(2);
	});

	test.each([false, true])('single/bulk queue JSON persists forceMainKey=%s without changing content or digest', async forceMainKey => {
		const add = vi.fn(async (_name: string, data: DeliverJobData) => data);
		const addBulk = vi.fn(async (jobs: { data: DeliverJobData }[]) => jobs);
		const queue = Object.assign(Object.create(QueueService.prototype), { config: {}, deliverQueue: { add, addBulk } }) as QueueService;
		await queue.deliver(actor, activity, destination, false, forceMainKey);
		await queue.deliverMany({ id: actor.id }, activity, new Map([[destination, true]]), forceMainKey);
		const body = JSON.stringify(activity);
		const digest = `SHA-256=${createHash('sha256').update(body).digest('base64')}`;
		for (const data of [add.mock.calls[0][1], addBulk.mock.calls[0][0][0].data]) {
			expect(JSON.parse(JSON.stringify(data))).toMatchObject({ user: { id: actor.id }, content: body, digest, to: destination, forceMainKey });
		}
	});

	test.each([false, true])('unknown peer discovery succeeds or logs failure after transport success (failure=%s)', async failure => {
		const signedPost = vi.fn(async () => undefined);
		const peer = { id: 'peer', host: 'peer.example', isNotResponding: false };
		const registration = vi.fn(async () => {
			if (failure) throw new Error('registration unavailable');
			return peer;
		});
		const metadata = vi.fn(async () => undefined);
		const logger = mockDeep<Logger>();
		const worker = Object.assign(Object.create(DeliverProcessorService.prototype), {
			logger, meta: { enableStatsForFederatedInstances: false }, utilityService: { isFederationAllowedUri: () => true, toPuny: (host: string) => host, isDeliverSuspendedSoftware: () => false },
			suspendedHostsCache: { get: () => [] }, federatedInstanceService: { fetch: async () => null, fetchOrRegister: registration },
			fetchInstanceMetadataService: { fetchInstanceMetadata: metadata }, apRequestService: { signedPost },
			apRequestChart: { deliverSucc: vi.fn() }, federationChart: { deliverd: vi.fn() },
		}) as DeliverProcessorService;
		const job = mock<Job<DeliverJobData>>();
		Object.defineProperty(job, 'data', { value: { user: { id: actor.id }, content: JSON.stringify(activity), digest: 'SHA-256=stored', to: destination } });
		expect(await worker.process(job)).toBe('Success');
		await vi.waitFor(() => expect(registration).toHaveBeenCalledOnce());
		if (failure) {
			await vi.waitFor(() => expect(logger.warn).toHaveBeenCalledWith('Post-delivery instance refresh failed', expect.any(Error)));
			expect(metadata).not.toHaveBeenCalled();
		} else {
			await vi.waitFor(() => expect(metadata).toHaveBeenCalledWith(peer));
			expect(logger.warn).not.toHaveBeenCalled();
		}
		expect(signedPost).toHaveBeenCalledOnce();
	});

	test.each([undefined, false, true])('Worker reads legacy/persisted RSA policy=%s and refreshes metadata with statistics disabled', async forceMainKey => {
		const serialized = JSON.stringify({ user: { id: actor.id }, content: JSON.stringify(activity), digest: 'SHA-256=stored', to: destination, isSharedInbox: false, ...(forceMainKey === undefined ? {} : { forceMainKey }) });
		for (let restart = 0; restart < 2; restart++) {
			const signedPost = vi.fn(async () => undefined);
			const metadata = vi.fn(async () => undefined);
			const peer = { id: 'peer', host: 'peer.example', httpMessageSignaturesImplementationLevel: '02', isNotResponding: false };
			const worker = Object.assign(Object.create(DeliverProcessorService.prototype), {
				meta: { enableStatsForFederatedInstances: false }, utilityService: { isFederationAllowedUri: () => true, toPuny: (host: string) => host, isDeliverSuspendedSoftware: () => false },
				suspendedHostsCache: { get: () => [] }, federatedInstanceService: { fetch: async () => peer },
				fetchInstanceMetadataService: { fetchInstanceMetadata: metadata }, apRequestService: { signedPost },
				apRequestChart: { deliverSucc: vi.fn() }, federationChart: { deliverd: vi.fn() },
			}) as DeliverProcessorService;
			const job = mock<Job<DeliverJobData>>();
			Object.defineProperty(job, 'data', { value: JSON.parse(serialized) });
			expect(await worker.process(job)).toBe('Success');
			expect(signedPost).toHaveBeenCalledWith({ id: actor.id }, destination, JSON.stringify(activity), 'SHA-256=stored', { level: '02', forceMainKey });
			await vi.waitFor(() => expect(metadata).toHaveBeenCalledWith(peer));
			expect(JSON.stringify(job.data)).toBe(serialized);
		}
	});
});
