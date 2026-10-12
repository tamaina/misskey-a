/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, generateKeyPairSync, randomUUID } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import * as Bull from 'bullmq';
import { signAsDraftToRequest, parseRequestSignature } from '@misskey-dev/node-http-message-signatures';
import { Resolver } from '@features/federation/backend/services/ApResolverService.js';
import { ApPersonService } from '@features/federation/backend/services/ApPersonService.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { ApNoteService } from '@features/federation/backend/services/ApNoteService.js';
import { ApInboxService } from '@features/federation/backend/services/ApInboxService.js';
import { InboxProcessorService } from '@features/federation/backend/jobs/InboxProcessorService.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import type { MiRemoteUser } from '@features/users/backend/models/User.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';
import type { IPost, IActor } from '@features/federation/backend/protocol/type.js';

vi.mock('@features/runtime/backend/cache/distributed-lock.js', async importOriginal => ({
	...await importOriginal<object>(), acquireApObjectLock: vi.fn(async () => vi.fn()),
}));
const actorUri = 'https://sender.example/users/fixture';
const noteUri = (index: number) => `https://sender.example/notes/${index}`;
const keyId = actorUri + '#main-key';
const keys = generateKeyPairSync('ed25519');
const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const privateKey = keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

type ResolverDeps = ConstructorParameters<typeof Resolver>;

function fixture(length: number) {
	const logger = mock<Logger>();
	const utility = mock<ResolverDeps[7]>();
	utility.extractDbHost.mockImplementation(value => new URL(value).hostname);
	utility.isSelfHost.mockReturnValue(false);
	utility.isUriLocal.mockReturnValue(false);
	utility.isFederationAllowedHost.mockReturnValue(true);
	utility.isFederationAllowedUri.mockReturnValue(true);
	utility.toPuny.mockImplementation(value => value);
	const objects = new Map<string, IPost>();
	for (let i = 0; i < length; i++) {
		objects.set(noteUri(i), {
			'@context': 'https://www.w3.org/ns/activitystreams',
			id: noteUri(i),
			type: 'Note',
			attributedTo: actorUri,
			content: 'synthetic note',
			...(i + 1 < length ? { inReplyTo: noteUri(i + 1) } : {}),
		});
	}
	const cache = new Map<string, MiNote>();
	const user = mock<MiRemoteUser>({
		id: 'fixture-actor', uri: actorUri, host: 'sender.example', username: 'fixture',
		isSuspended: false, isRemoteSuspended: false, lastFetchedAt: new Date(),
	});
	const http = mock<ResolverDeps[10]>();
	http.getActivityJson.mockImplementation(async value => {
		const object = objects.get(value);
		if (!object) throw new Error('Unexpected synthetic fetch ' + value);
		return object;
	});
	const loggerService = mock<ResolverDeps[14]>();
	loggerService.getLogger.mockReturnValue(logger);
	const resolvers: Resolver[] = [];
	const factory = {
		createResolver: vi.fn(async () => {
			const resolver = new Resolver(
				mock<ResolverDeps[0]>(), mock<ResolverDeps[1]>({ signToActivityPubGet: false }),
				mock<ResolverDeps[2]>(), mock<ResolverDeps[3]>(), mock<ResolverDeps[4]>(),
				mock<ResolverDeps[5]>(), mock<ResolverDeps[6]>(), utility,
				mock<ResolverDeps[8]>(), mock<ResolverDeps[9]>(), http,
				mock<ResolverDeps[11]>(), mock<ResolverDeps[12]>(), mock<ResolverDeps[13]>(), loggerService,
			);
			resolvers.push(resolver);
			return resolver;
		}),
	};
	const created = vi.fn(async (_actor: unknown, data: { uri?: string | null }) => {
		if (!data.uri) throw new Error('Missing synthetic note URI');
		const note = mock<MiNote>({ id: data.uri, uri: data.uri, hasPoll: false });
		cache.set(data.uri, note);
		return note;
	});
	// Exercise the real service chain; repositories, remote HTTP and locks stay synthetic.
	// The cycle test checks the resolver guard, not distributed-lock scheduling.
	const note = Object.assign(Object.create(ApNoteService.prototype), {
		logger, utilityService: utility, apResolverService: factory,
		apDbResolverService: {
			getNoteFromApId: async (value: string | IPost) => cache.get(typeof value === 'string' ? value : value.id ?? '') ?? null,
		},
		apPersonService: { fetchPerson: async () => user, resolvePerson: async () => user },
		apMentionService: { extractApMentionObjects: () => [], extractApMentions: async () => [] },
		apMfmService: { htmlToMfm: (value: string) => value },
		apQuestionService: { extractPollFromQuestion: async () => undefined },
		apAudienceService: { parseAudience: async () => ({ visibility: 'public', visibleUsers: [] }) },
		emojisRepository: { findBy: async () => [] },
		noteCreateService: { checkProhibitedWordsContain: () => false, create: created },
	}) as ApNoteService;
	const inbox = Object.assign(Object.create(ApInboxService.prototype), {
		logger, utilityService: utility, apResolverService: factory, apNoteService: note,
		userEntityService: { isSuspendedEither: () => false },
	}) as ApInboxService;
	const processor = Object.assign(Object.create(InboxProcessorService.prototype), {
		logger, utilityService: utility,
		apDbResolverService: { getAuthUserFromApId: async () => ({ user, key: { keyId, keyPem: publicKey } }) },
		apRequestChart: { inbox: vi.fn() }, federationChart: { inbox: vi.fn() }, meta: {},
		federatedInstanceService: { fetch: async () => null }, apInboxService: inbox,
	}) as InboxProcessorService;

	async function job(root = noteUri(0)) {
		const activity = { id: 'https://sender.example/activities/fixture', type: 'Create' as const, actor: actorUri, object: root };
		const body = JSON.stringify(activity);
		const request = { method: 'POST', url: '/inbox', headers: { host: 'recipient.example', date: new Date().toUTCString(), digest: 'SHA-256=' + createHash('sha256').update(body).digest('base64') } };
		await signAsDraftToRequest(request, { keyId, privateKeyPem: privateKey }, ['(request-target)', 'host', 'date', 'digest']);
		const parsed = parseRequestSignature(request);
		if (parsed.version !== 'draft') throw new Error('Expected draft signature');
		return { data: JSON.parse(JSON.stringify({ activity, signature: parsed.value })), opts: { attempts: 8 } } as Bull.Job<Parameters<InboxProcessorService['process']>[0]['data']>;
	}

	return { logger, utility, objects, cache, user, http, factory, resolvers, note, inbox, processor, created, job };
}

function distinctAuthorFixture(length: number) {
	const f = fixture(length);
	f.utility.punyHost.mockImplementation(value => new URL(value).hostname);
	const storedUsers = new Map<string, MiRemoteUser>([[actorUri, f.user]]);
	const personCache = new Map<string, MiRemoteUser>([[actorUri, f.user]]);
	const actors = new Map<string, IActor>();
	for (let i = 1; i < length; i++) {
		const uri = `https://sender.example/users/author-${i}`;
		const note = f.objects.get(noteUri(i));
		if (!note) throw new Error('Missing synthetic note');
		note.attributedTo = uri;
		actors.set(uri, {
			'@context': 'https://www.w3.org/ns/activitystreams', id: uri, type: 'Person',
			preferredUsername: `author-${i}`, inbox: `${uri}/inbox`, outbox: `${uri}/outbox`,
		});
	}
	f.http.getActivityJson.mockImplementation(async uri => {
		const object = f.objects.get(uri) ?? actors.get(uri);
		if (!object) throw new Error('Unexpected synthetic fetch');
		return object;
	});
	// Preserve the real createPerson transaction and cache-publication ordering.
	// Only the transaction manager and repositories are synthetic; saved actors
	// survive subsequent attempts without external cache warming or manual retry.
	const save = vi.fn(async (entity: unknown) => {
		if (entity instanceof MiUser) {
			const remote = entity as MiRemoteUser;
			storedUsers.set(remote.uri, remote);
		}
		return entity;
	});
	const person = Object.assign(Object.create(ApPersonService.prototype), {
		logger: f.logger, utilityService: f.utility,
		config: { host: 'recipient.example', url: 'https://recipient.example' },
		apResolverService: f.factory, cacheService: { uriPersonCache: personCache },
		usersRepository: {
			findOneBy: async ({ uri }: { uri: string }) => storedUsers.get(uri) ?? null,
			findOneByOrFail: async ({ id }: { id: string }) => {
				const user = [...storedUsers.values()].find(user => user.id === id);
				if (!user) throw new Error('Missing synthetic actor');
				return user;
			},
			update: async () => ({ affected: 1 }),
		},
		db: { transaction: async (run: (manager: { save: typeof save }) => Promise<unknown>) => run({ save }) },
		idService: { gen: () => `actor-${storedUsers.size}` },
		apNoteService: { extractEmojis: async () => [] }, meta: {},
		usersChart: { update: vi.fn() }, hashtagService: { updateUsertags: vi.fn() },
		userEntityService: { isRemoteUser: () => true },
	}) as ApPersonService;
	Object.assign(f.note, { apPersonService: person });
	return { ...f, storedUsers, save };
}

const limitErrorId = 'd592da9f-822f-4d91-83d7-4ceefabcf3d2';

describe('inbox resolver exhaustion', () => {
	test('preserves bounded automatic recovery when failed attempts register uncached authors', async () => {
		const f = distinctAuthorFixture(200);
		const connection = { host: '127.0.0.1', port: Number(process.env.INBOX_RECURSION_TEST_REDIS_PORT ?? 56312), maxRetriesPerRequest: null };
		const name = `inbox-author-progress-${randomUUID()}`;
		const queue = new Bull.Queue<Parameters<InboxProcessorService['process']>[0]['data']>(name, { connection });
		const attempts: { fetches: number; registeredActors: number; createdNotes: number }[] = [];
		const errors: Error[] = [];
		const worker = new Bull.Worker(name, async job => {
			const start = f.http.getActivityJson.mock.calls.length;
			try {
				return await f.processor.process(job);
			} finally {
				attempts.push({
					fetches: f.http.getActivityJson.mock.calls.length - start,
					registeredActors: f.storedUsers.size - 1,
					createdNotes: f.created.mock.calls.length,
				});
			}
		}, { connection });
		worker.on('error', error => errors.push(error));
		try {
			await queue.waitUntilReady();
			const job = await queue.add('activity', (await f.job()).data, {
				attempts: 8, backoff: { type: 'fixed', delay: 10 }, removeOnFail: false,
			});
			const deadline = Date.now() + 10000;
			while (!['completed', 'failed'].includes(await job.getState())) {
				if (Date.now() >= deadline) throw new Error('Timed out waiting for isolated author-progress queue');
				await new Promise(resolve => setTimeout(resolve, 20));
			}
			expect(await job.getState()).toBe('completed');
			const completed = await queue.getJob(job.id!);
			expect(completed?.attemptsMade).toBe(3);
			expect(attempts).toEqual([
				{ fetches: 257, registeredActors: 128, createdNotes: 0 },
				{ fetches: 257, registeredActors: 192, createdNotes: 0 },
				{ fetches: 207, registeredActors: 199, createdNotes: 200 },
			]);
			expect(f.created).toHaveBeenCalledTimes(200);
			expect(f.save.mock.calls.filter(([row]) => row instanceof MiUser)).toHaveLength(199);
			expect(errors).toEqual([]);
		} finally {
			await worker.close();
			await queue.obliterate({ force: true });
			await queue.close();
		}
	}, 20000);

	test('a cold long chain fails visibly without automatic retries', async () => {
		const f = fixture(500);
		await expect(f.processor.process(await f.job())).rejects.toBeInstanceOf(Bull.UnrecoverableError);
		expect(f.http.getActivityJson).toHaveBeenCalledTimes(257);
		expect(f.resolvers[0].getHistory()).toHaveLength(257);
		expect(f.created).not.toHaveBeenCalled();
		expect(f.logger.warn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ errorId: limitErrorId, activityId: 'https://sender.example/activities/fixture', actorUri }));
	});
	test.each([256, 257])('preserves the existing successful boundary of %i remote resolutions', async length => {
		const f = fixture(length);
		await expect(f.processor.process(await f.job())).resolves.toBe('ok');
		expect(f.http.getActivityJson).toHaveBeenCalledTimes(length);
		expect(f.created).toHaveBeenCalledTimes(length);
	});
	test('an already cached ancestor lets the remaining valid chain complete', async () => {
		const f = fixture(500);
		f.cache.set(noteUri(257), mock<MiNote>({ id: 'cached-ancestor', uri: noteUri(257), hasPoll: false }));
		await expect(f.processor.process(await f.job())).resolves.toBe('ok');
		expect(f.http.getActivityJson).toHaveBeenCalledTimes(257);
		expect(f.created).toHaveBeenCalledTimes(257);
		expect(f.cache.has(noteUri(0))).toBe(true);
	});
	test('the resolver still rejects a repeated URI before refetching it', async () => {
		const f = fixture(2);
		f.objects.get(noteUri(1))!.inReplyTo = noteUri(0);
		await expect(f.processor.process(await f.job())).rejects.toMatchObject({ id: '0dc86cf6-7cd6-4e56-b1e6-5903d62d7ea5' });
		expect(f.http.getActivityJson).toHaveBeenCalledTimes(2);
		expect(f.created).not.toHaveBeenCalled();
	});
	test.each([Object.assign(new Error('Service Unavailable'), { statusCode: 503 }), new Error('request timed out')])('a transient fetch failure remains retryable: %s', async error => {
		const f = fixture(8);
		let failed = false;
		f.http.getActivityJson.mockImplementation(async value => {
			if (value === noteUri(4) && !failed) {
				failed = true;
				throw error;
			}
			const object = f.objects.get(value);
			if (!object) throw new Error('Unexpected synthetic fetch');
			return object;
		});
		await expect(f.processor.process(await f.job())).rejects.toBe(error);
		expect(f.http.getActivityJson).toHaveBeenCalledTimes(5);
		expect(f.created).not.toHaveBeenCalled();
		await expect(f.processor.process(await f.job())).resolves.toBe('ok');
		expect(f.created).toHaveBeenCalledTimes(8);
	});
	test.each([new Error('recursion limit exceeded'), new IdentifiableError('another-error-id', 'recursion limit exceeded')])('only the exact identifiable limit error is reclassified: %s', async error => {
		const f = fixture(1);
		vi.spyOn(f.inbox, 'performActivity').mockRejectedValue(error);
		await expect(f.processor.process(await f.job())).rejects.toBe(error);
	});
	test('an invalid signature still stops processing before remote resolution', async () => {
		const f = fixture(1);
		const job = await f.job();
		const signature = job.data.signature;
		if (!signature || !('signingString' in signature)) throw new Error('Expected stored draft signature');
		signature.signingString += 'tampered';
		await expect(f.processor.process(job)).rejects.toBeInstanceOf(Bull.UnrecoverableError);
		expect(f.http.getActivityJson).not.toHaveBeenCalled();
	});
	test('BullMQ retains the failed activity, continues other jobs, allows manual recovery, and retries HTTP failures', async () => {
		const f = fixture(500);
		const connection = { host: '127.0.0.1', port: Number(process.env.INBOX_RECURSION_TEST_REDIS_PORT ?? 56312), maxRetriesPerRequest: null };
		const name = `inbox-recursion-${randomUUID()}`;
		const queue = new Bull.Queue<Parameters<InboxProcessorService['process']>[0]['data']>(name, { connection });
		const worker = new Bull.Worker(name, async job => f.processor.process(job), { connection });
		const errors: Error[] = [];
		worker.on('error', error => errors.push(error));
		const waitFor = async (job: Bull.Job, state: string) => {
			const deadline = Date.now() + 10000;
			while (await job.getState() !== state) {
				if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${state}`);
				await new Promise(resolve => setTimeout(resolve, 20));
			}
		};
		const options = { attempts: 8, backoff: { type: 'fixed', delay: 10 }, removeOnFail: false };
		try {
			await queue.waitUntilReady();
			const data = (await f.job()).data;
			const queued = await queue.add('activity', data, options);
			await waitFor(queued, 'failed');
			const failed = await queue.getJob(queued.id!);
			expect(failed?.attemptsMade).toBe(1);
			expect(failed?.attemptsStarted).toBe(1);
			expect(failed?.data).toEqual(data);
			expect(failed?.failedReason).toContain('recursion limit');
			expect(f.http.getActivityJson).toHaveBeenCalledTimes(257);
			expect(f.created).not.toHaveBeenCalled();
			const short = await queue.add('activity', (await f.job(noteUri(499))).data, options);
			await waitFor(short, 'completed');
			f.cache.set(noteUri(257), mock<MiNote>({ id: 'cached-ancestor', uri: noteUri(257), hasPoll: false }));
			await failed!.retry();
			await waitFor(queued, 'completed');
			expect(f.cache.has(noteUri(0))).toBe(true);
			f.cache.delete(noteUri(499));
			f.http.getActivityJson.mockRejectedValueOnce(Object.assign(new Error('Service Unavailable'), { statusCode: 503 }));
			const transient = await queue.add('activity', (await f.job(noteUri(499))).data, options);
			await waitFor(transient, 'completed');
			const recovered = await queue.getJob(transient.id!);
			expect(recovered?.attemptsMade).toBe(2);
			expect(recovered?.attemptsStarted).toBe(2);
			expect(errors).toEqual([]);
		} finally {
			await worker.close();
			await queue.obliterate({ force: true });
			await queue.close();
		}
	}, 20000);
});
