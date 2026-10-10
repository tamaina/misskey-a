/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync, randomUUID } from 'node:crypto';
import * as Bull from 'bullmq';
import Fastify from 'fastify';
import fastifyRawBody from 'fastify-raw-body';
import { Response } from 'node-fetch';
import { expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type * as Redis from 'ioredis';
import { UserKeypairService } from '../../backend/services/UserKeypairService.js';
import { ApRequestService } from '../../backend/services/ApRequestService.js';
import { ApDbResolverService } from '../../backend/services/ApDbResolverService.js';
import { ActivityPubServerService } from '../../backend/http/ActivityPubServerService.js';
import { InboxProcessorService } from '../../backend/jobs/InboxProcessorService.js';
import { normalizeInboxJobSignature } from '../../backend/utility/inbox-job-signature.js';
import { InboxKeyDiscoveryDeferredError, inboxKeyDiscoveryBackoff } from '../../backend/utility/inbox-key-discovery.js';
import { MiUserKeypair } from '../../backend/models/UserKeypair.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type { InboxJobData } from '@features/runtime/backend/queue/types.js';
import type { MiRemoteUser } from '@features/users/backend/models/User.js';
import type { UserKeypairsRepository } from '@features/persistence/backend/repositories/models.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';

// Real ingress, native sender crypto and receiver verification; persistence and business services are local fixtures.
test('Ed sender receives 202 before a recent RSA-only receiver cache delays and discovers its key', async () => {
	const uri = 'https://sender.example/users/alice';
	const target = 'https://recipient.example/inbox';
	const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
	const ed = generateKeyPairSync('ed25519');
	const rsaPublic = rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString();
	const edPublic = ed.publicKey.export({ type: 'spki', format: 'pem' }).toString();
	const repository = mock<UserKeypairsRepository>();
	repository.findOneByOrFail.mockResolvedValue(new MiUserKeypair({
		userId: 'alice', privateKey: rsa.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), publicKey: rsaPublic,
		ed25519PrivateKey: ed.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), ed25519PublicKey: edPublic,
	}));
	const users = mock<UserEntityService>();
	users.genLocalUserUri.mockReturnValue(uri);
	const senderKeys = new UserKeypairService(mock<Redis.Redis>(), mock<Redis.Redis>(), repository, mock<GlobalEventService>(), users);
	const connection = { host: '127.0.0.1', port: Number(process.env.INBOX_KEY_DISCOVERY_TEST_REDIS_PORT ?? 56312), maxRetriesPerRequest: null };
	const name = `ed-sending-receiver-cache-${randomUUID()}`;
	const queue = new Bull.Queue<InboxJobData>(name, { connection });
	const queueService: QueueService = Object.assign(Object.create(QueueService.prototype), { inboxQueue: queue, config: { inboxJobMaxAttempts: 8 } });
	const inbox = vi.spyOn(queueService, 'inbox');
	const ingress: ActivityPubServerService = Object.assign(Object.create(ActivityPubServerService.prototype), {
		config: { host: 'recipient.example', url: 'https://recipient.example' }, meta: { federation: 'all' }, queueService,
	});
	const fastify = Fastify();
	const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
	const user = mock<MiRemoteUser>({ id: 'alice', uri, host: 'sender.example', isDeleted: false, lastFetchedAt: new Date() });
	const publicKeys = [{ keyId: `${uri}#main-key`, keyPem: rsaPublic }];
	const renew = vi.fn(async () => {
		publicKeys.push({ keyId: `${uri}#ed25519-key`, keyPem: edPublic });
		user.lastFetchedAt = new Date();
		return user;
	});
	const resolver: ApDbResolverService = Object.assign(Object.create(ApDbResolverService.prototype), {
		logger, utilityService: { punyHost: (value: string) => new URL(value).hostname },
		apPersonService: { resolvePerson: vi.fn(async () => user), fetchPersonWithRenewal: renew },
		userPublickeysRepository: { find: async () => publicKeys },
		publicKeyByUserIdCache: { fetch: async () => publicKeys, getRaw: () => ({ date: Date.now() }), delete: vi.fn() },
	});
	const perform = vi.fn(async () => 'ok');
	const processor: InboxProcessorService = Object.assign(Object.create(InboxProcessorService.prototype), {
		logger, apDbResolverService: resolver,
		utilityService: { toPuny: (value: string) => value, isFederationAllowedHost: () => true, extractDbHost: (value: string) => new URL(value).hostname },
		apRequestChart: { inbox: vi.fn() }, federationChart: { inbox: vi.fn() },
		meta: {}, federatedInstanceService: { fetch: async () => null }, apInboxService: { performActivity: perform },
	});
	const statuses: number[] = [];
	const sender: ApRequestService = Object.assign(Object.create(ApRequestService.prototype), {
		userKeypairService: senderKeys,
		httpRequestService: { send: async (url: string, options: { method: 'POST'; headers: Record<string, string>; body: string }) => {
			const response = await fastify.inject({ method: options.method, url: new URL(url).pathname, headers: { ...options.headers, host: new URL(url).host }, payload: options.body });
			statuses.push(response.statusCode);
			if (response.statusCode !== 202) throw new Error(`Inbox rejected signed request: ${response.statusCode}`);
			return new Response(response.body, { status: response.statusCode });
		} },
	});
	let worker: Bull.Worker | undefined;
	const errors: Error[] = [];
	const waitFor = async (condition: () => Promise<boolean>) => {
		const deadline = Date.now() + 10000;
		while (!await condition()) {
			if (Date.now() >= deadline) throw new Error('Timed out waiting for isolated sender/receiver queue');
			await new Promise(resolve => setTimeout(resolve, 20));
		}
	};
	try {
		await queue.waitUntilReady();
		await fastify.register(fastifyRawBody, { global: false, encoding: null, runFirst: true });
		ingress.createServer(fastify, {}, () => {});
		await fastify.ready();
		user.lastFetchedAt = new Date(Date.now() - 299000);
		const activity = { id: 'https://sender.example/activity/1', type: 'Create', actor: uri, object: { id: 'https://sender.example/notes/1', type: 'Note', attributedTo: uri, content: 'signed あ' } };
		await sender.signedPost({ id: 'alice' }, target, activity, undefined, { level: '02' });
		expect(statuses).toEqual([202]);
		expect(inbox).toHaveBeenCalledOnce();
		// Ingress does not await the async enqueue; await its real QueueService result before inspecting Redis.
		const queued = await inbox.mock.results[0].value as Bull.Job<InboxJobData>;
		expect(await queued.getState()).toBe('waiting');
		expect(queued.data.activity).toEqual(activity);
		expect(normalizeInboxJobSignature(queued.data.signature)?.keyId).toBe(`${uri}#ed25519-key`);
		expect(perform).not.toHaveBeenCalled();
		worker = new Bull.Worker(name, async job => processor.process(job), {
			connection, settings: { backoffStrategy: (_attempt, _type, error, job) => error instanceof InboxKeyDiscoveryDeferredError ? inboxKeyDiscoveryBackoff(error, job) : -1 },
		});
		worker.on('error', error => errors.push(error));
		await waitFor(async () => (await queued.getState()) === 'delayed');
		expect(renew).not.toHaveBeenCalled();
		expect(perform).not.toHaveBeenCalled();
		const delayed = await queue.getJob(queued.id!);
		expect(delayed?.attemptsMade).toBe(1);
		expect(delayed?.data).toEqual(queued.data);
		await waitFor(async () => (await queued.getState()) === 'completed');
		const completed = await queue.getJob(queued.id!);
		expect(completed?.attemptsMade).toBe(2);
		expect(completed?.attemptsStarted).toBe(2);
		expect(completed?.timestamp).toBe(queued.timestamp);
		expect(completed?.data).toEqual(queued.data);
		expect(renew).toHaveBeenCalledOnce();
		expect(renew).toHaveBeenCalledWith(uri, 0, true);
		expect(perform).toHaveBeenCalledOnce();
		expect(perform).toHaveBeenCalledWith(user, activity);
		expect(errors).toEqual([]);
	} finally {
		await worker?.close();
		await fastify.close();
		senderKeys.dispose();
		await queue.obliterate({ force: true });
		await queue.close();
	}
}, 15000);
