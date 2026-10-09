/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import * as Bull from 'bullmq';
import { parseRequestSignature, signAsDraftToRequest, verifyDraftSignature } from '@misskey-dev/node-http-message-signatures';
import { ApDbResolverService } from '../../backend/services/ApDbResolverService.js';
import { ApPersonService } from '../../backend/services/ApPersonService.js';
import { InboxProcessorService } from '../../backend/jobs/InboxProcessorService.js';
import { InboxKeyDiscoveryDeferredError, InboxKeyDiscoveryRefreshError, inboxKeyDiscoveryBackoff } from '../../backend/utility/inbox-key-discovery.js';
import type { MiUserPublickey } from '../../backend/models/UserPublickey.js';
import type { MiRemoteUser } from '@features/users/backend/models/User.js';

const uri = 'https://sender.example/users/alice';
const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };

function resolverFixture(age: number, keyPresentAfterFetch = true, discoveredKeyPem = 'ed') {
	const user = mock<MiRemoteUser>({ id: 'alice', uri, host: 'sender.example', isDeleted: false, lastFetchedAt: new Date(Date.now() - age) });
	const keys = [{ keyId: `${uri}#main-key`, keyPem: 'rsa' }];
	const renew = vi.fn(async () => {
		if (keyPresentAfterFetch) keys.push({ keyId: `${uri}#ed25519-key`, keyPem: discoveredKeyPem });
		return user;
	});
	const resolve = vi.fn(async () => user);
	const service = Object.assign(Object.create(ApDbResolverService.prototype), {
		logger,
		utilityService: { punyHost: (value: string) => new URL(value).hostname },
		apPersonService: { resolvePerson: resolve, fetchPersonWithRenewal: renew },
		userPublickeysRepository: { find: async () => keys },
		publicKeyByUserIdCache: { fetch: async () => keys, getRaw: () => ({ date: Date.now() }), delete: vi.fn() },
	}) as ApDbResolverService;
	return { service, renew, resolve, user };
}

function processorFixture(auth: Awaited<ReturnType<ApDbResolverService['getAuthUserFromApId']>>) {
	const resolver = { getAuthUserFromApId: vi.fn(async () => auth) };
	const perform = vi.fn(async () => 'ok');
	const jsonLd = { compact: vi.fn(async (value: unknown) => value), checkForForbiddenDirectives: vi.fn(), freeze: vi.fn(), verifyRsaSignature2017: vi.fn(async () => true) };
	const processor = Object.assign(Object.create(InboxProcessorService.prototype), {
		logger, apDbResolverService: resolver,
		utilityService: { toPuny: (value: string) => value, isFederationAllowedHost: () => true, extractDbHost: (value: string) => new URL(value).hostname },
		apRequestChart: { inbox: vi.fn() }, federationChart: { inbox: vi.fn() },
		meta: {}, federatedInstanceService: { fetch: async () => null },
		apInboxService: { performActivity: perform }, jsonLdService: { use: () => jsonLd },
	}) as InboxProcessorService;
	return { processor, resolver, perform, jsonLd };
}

function job(ld = false): Bull.Job<Parameters<InboxProcessorService['process']>[0]['data']> {
	return mock<Bull.Job<Parameters<InboxProcessorService['process']>[0]['data']>>({
		data: { activity: { id: 'https://sender.example/activity/1', type: 'Create', actor: uri,
			...(ld ? { signature: { type: 'RsaSignature2017', creator: `${uri}#main-key`, signatureValue: 'fixture' } } : {}),
		}, signature: { scheme: 'Signature', params: { signature: 'AAAA', keyId: `${uri}#ed25519-key`, algorithm: 'ed25519', headers: ['(request-target)'] }, keyId: `${uri}#ed25519-key`, algorithm: 'ed25519', signingString: 'invalid' } },
	});
}

describe('inbox Actor key discovery', () => {
	test('only a recent Actor suppressing discovery carries cooldown metadata', async () => {
		const recent = resolverFixture(1000);
		const auth = await recent.service.getAuthUserFromApId(uri, `${uri}#ed25519-key`);
		expect(auth?.key).toBeNull();
		expect(auth?.user && 'keyDiscoveryDeferredUntil' in auth ? auth.keyDiscoveryDeferredUntil : undefined).toBe(recent.user.lastFetchedAt!.getTime() + 300001);
		expect(recent.renew).not.toHaveBeenCalled();
		const old = resolverFixture(300001);
		expect((await old.service.getAuthUserFromApId(uri, `${uri}#ed25519-key`))?.key?.keyId).toBe(`${uri}#ed25519-key`);
		expect(old.renew).toHaveBeenCalledWith(uri, 0, true);
		const absent = await resolverFixture(300001, false).service.getAuthUserFromApId(uri, `${uri}#ed25519-key`);
		expect(absent?.key).toBeNull();
		expect(absent).not.toHaveProperty('keyDiscoveryDeferredUntil');
		const fresh = resolverFixture(1000, false);
		fresh.resolve.mockImplementationOnce(async () => { fresh.user.lastFetchedAt = new Date(); return fresh.user; });
		expect(await fresh.service.getAuthUserFromApId(uri, `${uri}#ed25519-key`)).not.toHaveProperty('keyDiscoveryDeferredUntil');
	});

	test('cooldown without LD fallback waits, freshly absent or mismatched actors do not', async () => {
		const { user } = resolverFixture(1000);
		const pending = processorFixture({ user, key: null, keyDiscoveryDeferredUntil: Date.now() + 300000 });
		await expect(pending.processor.process(job())).rejects.toBeInstanceOf(InboxKeyDiscoveryDeferredError);
		expect(pending.perform).not.toHaveBeenCalled();
		await expect(processorFixture({ user, key: null }).processor.process(job())).rejects.toBeInstanceOf(Bull.UnrecoverableError);
		await expect(processorFixture(null).processor.process(job())).rejects.toBeInstanceOf(Bull.UnrecoverableError);
	});

	test('known-key bad signature is terminal and never triggers discovery', async () => {
		const { user } = resolverFixture(1000);
		const keypair = generateKeyPairSync('ed25519');
		const fixture = processorFixture({ user, key: mock<MiUserPublickey>({ keyId: `${uri}#ed25519-key`, keyPem: keypair.publicKey.export({ type: 'spki', format: 'pem' }).toString() }) });
		await expect(fixture.processor.process(job())).rejects.toBeInstanceOf(Bull.UnrecoverableError);
		expect(fixture.resolver.getAuthUserFromApId).toHaveBeenCalledTimes(1);
	});

	test('valid RSA LD fallback is processed before a deferred missing Ed key', async () => {
		const { user } = resolverFixture(1000);
		const fixture = processorFixture({ user, key: null, keyDiscoveryDeferredUntil: Date.now() + 300000 });
		fixture.resolver.getAuthUserFromApId.mockResolvedValueOnce({ user, key: null, keyDiscoveryDeferredUntil: Date.now() + 300000 });
		fixture.resolver.getAuthUserFromApId.mockResolvedValueOnce({ user, key: mock<MiUserPublickey>({ keyId: `${uri}#main-key`, keyPem: 'rsa' }) });
		await expect(fixture.processor.process(job(true))).resolves.toBe('ok');
		expect(fixture.jsonLd.verifyRsaSignature2017).toHaveBeenCalledOnce();
		expect(fixture.perform).toHaveBeenCalledOnce();
	});

	test('temporary strict key refresh failure still permits cached RSA LD fallback', async () => {
		const { user } = resolverFixture(1000);
		const fixture = processorFixture({ user, key: mock<MiUserPublickey>({ keyId: `${uri}#main-key`, keyPem: 'rsa' }) });
		fixture.resolver.getAuthUserFromApId.mockRejectedValueOnce(new InboxKeyDiscoveryRefreshError(new Error('temporary refresh')));
		await expect(fixture.processor.process(job(true))).resolves.toBe('ok');
		expect(fixture.perform).toHaveBeenCalledOnce();
		const noLd = processorFixture(null);
		noLd.resolver.getAuthUserFromApId.mockRejectedValueOnce(new InboxKeyDiscoveryRefreshError(new Error('temporary refresh')));
		await expect(noLd.processor.process(job())).rejects.toThrow('temporary refresh');
	});

	test('temporary resolver errors propagate for ordinary attempts/backoff', async () => {
		const fixture = processorFixture(null);
		fixture.resolver.getAuthUserFromApId.mockRejectedValueOnce(new Error('temporary network error'));
		await expect(fixture.processor.process(job())).rejects.toThrow('temporary network error');
		const user = resolverFixture(300001).user;
		const person = Object.assign(Object.create(ApPersonService.prototype), { logger, userEntityService: { isRemoteUser: () => true } }) as ApPersonService;
		Object.defineProperty(person, 'fetchPerson', { value: async () => user });
		Object.defineProperty(person, 'updatePerson', { value: async () => { throw new Error('temporary refresh error'); } });
		await expect(person.fetchPersonWithRenewal(uri, 0, true)).rejects.toThrow('temporary refresh error');
		await expect(person.fetchPersonWithRenewal(uri, 0)).resolves.toBe(user);
	});

	test('discovery backoff uses the original fixed deadline and refuses an exhausted window', () => {
		vi.spyOn(Date, 'now').mockReturnValue(1000000);
		expect(inboxKeyDiscoveryBackoff(new InboxKeyDiscoveryDeferredError(1300001), { timestamp: 1000000 })).toBe(300001);
		expect(inboxKeyDiscoveryBackoff(new InboxKeyDiscoveryDeferredError(1900000), { timestamp: 1000000 })).toBe(-1);
		expect(inboxKeyDiscoveryBackoff(new InboxKeyDiscoveryDeferredError(1000001), { timestamp: 100000 })).toBe(-1);
		expect(inboxKeyDiscoveryBackoff(new InboxKeyDiscoveryDeferredError(NaN), { timestamp: 1000000 })).toBe(-1);
		expect(inboxKeyDiscoveryBackoff(new InboxKeyDiscoveryDeferredError(1300000))).toBe(-1);
		expect(inboxKeyDiscoveryBackoff(new InboxKeyDiscoveryDeferredError(1300000), { timestamp: 1000001 })).toBe(-1);
	});

	test('ingress freshness remains separate from queued Draft cryptographic verification', async () => {
		const keypair = generateKeyPairSync('ed25519');
		const key = { keyId: `${uri}#ed25519-key`, privateKeyPem: keypair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() };
		const now = new Date();
		const request = { method: 'POST', url: '/inbox', headers: { host: 'recipient.example', date: now.toUTCString() } };
		await signAsDraftToRequest(request, key, ['(request-target)', 'host', 'date']);
		const parsed = parseRequestSignature(request, { clockSkew: { now, forward: 300000, delay: 300000 } });
		if (parsed.version !== 'draft') throw new Error('Expected Draft');
		const persisted = JSON.parse(JSON.stringify(parsed.value));
		for (const delay of [301000, 901000]) {
			const later = new Date(now.getTime() + delay);
			expect(() => parseRequestSignature(request, { clockSkew: { now: later, forward: 300000, delay: 300000 } })).toThrow();
			vi.spyOn(Date, 'now').mockReturnValue(later.getTime());
			expect(await verifyDraftSignature(persisted, keypair.publicKey.export({ type: 'spki', format: 'pem' }).toString())).toBe(true);
		}
		persisted.signingString += 'tampered';
		expect(await verifyDraftSignature(persisted, keypair.publicKey.export({ type: 'spki', format: 'pem' }).toString())).toBe(false);
	});
});

// CI has its own Redis service. Local runs override the port with a task-owned Redis.
describe('actual BullMQ inbox discovery retries', () => {
	test.each([{ attempts: 1, expired: false }, { attempts: 2, expired: false }, { attempts: 8, expired: false }, { attempts: 8, expired: true }])('uses attempts=$attempts with expired=$expired and survives Worker restart', async ({ attempts, expired }) => {
		const keypair = generateKeyPairSync('ed25519');
		const publicKey = keypair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
		const privateKey = keypair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
		const request = { method: 'POST', url: '/inbox', headers: { host: 'recipient.example', date: new Date().toUTCString() } };
		await signAsDraftToRequest(request, { keyId: `${uri}#ed25519-key`, privateKeyPem: privateKey }, ['(request-target)', 'date', 'host']);
		const signature = parseRequestSignature(request);
		if (signature.version !== 'draft') throw new Error('Expected Draft');
		const resolved = resolverFixture(299000, true, publicKey);
		const fixture = processorFixture(null);
		Object.defineProperty(fixture.processor, 'apDbResolverService', { value: resolved.service });
		const data = { activity: { id: 'https://sender.example/activity/1', type: 'Create', actor: uri, object: { id: 'https://sender.example/notes/1', type: 'Note', attributedTo: uri } }, signature: signature.value };
		const connection = { host: '127.0.0.1', port: Number(process.env.INBOX_KEY_DISCOVERY_TEST_REDIS_PORT ?? 56312), maxRetriesPerRequest: null };
		const name = `inbox-key-discovery-${randomUUID()}`;
		const queue = new Bull.Queue<Parameters<InboxProcessorService['process']>[0]['data']>(name, { connection });
		const workers: Bull.Worker[] = [];
		const errors: Error[] = [];
		const createWorker = () => {
			const worker = new Bull.Worker(name, async queued => fixture.processor.process(queued), {
				connection, settings: { backoffStrategy: (_attempt, _type, error, queued) => error instanceof InboxKeyDiscoveryDeferredError ? inboxKeyDiscoveryBackoff(error, queued) : -1 },
			});
			worker.on('error', error => errors.push(error));
			workers.push(worker);
			return worker;
		};
		const waitFor = async (condition: () => Promise<boolean>) => {
			const deadline = Date.now() + 10000;
			while (!await condition()) {
				if (Date.now() >= deadline) throw new Error('Timed out waiting for isolated inbox queue');
				await new Promise(resolve => setTimeout(resolve, 20));
			}
		};
		try {
			await queue.waitUntilReady();
			const queued = await queue.add('activity', data, { attempts, backoff: { type: 'custom' }, ...(expired ? { timestamp: Date.now() - 15 * 60 * 1000 } : {}) });
			const worker = createWorker();
			await waitFor(async () => (await queued.getState()) === (attempts === 1 || expired ? 'failed' : 'delayed'));
			await worker.close();
			const afterFirst = await queue.getJob(queued.id!);
			expect(afterFirst?.attemptsMade).toBe(1);
			expect(afterFirst?.attemptsStarted).toBe(1);
			expect(afterFirst?.data).toEqual(JSON.parse(JSON.stringify(data)));
			expect(fixture.perform).not.toHaveBeenCalled();
			if (attempts === 1 || expired) {
				expect(afterFirst?.failedReason).toContain('discovery deferred');
				expect(resolved.renew).not.toHaveBeenCalled();
			} else {
				createWorker();
				await waitFor(async () => (await queued.getState()) === 'completed');
				const completed = await queue.getJob(queued.id!);
				expect(completed?.attemptsMade).toBe(2);
				expect(completed?.attemptsStarted).toBe(2);
				expect(completed?.timestamp).toBe(queued.timestamp);
				expect(resolved.renew).toHaveBeenCalledOnce();
				expect(fixture.perform).toHaveBeenCalledOnce();
			}
			expect(errors).toEqual([]);
		} finally {
			await Promise.all(workers.map(worker => worker.close()));
			await queue.obliterate({ force: true });
			await queue.close();
		}
	});
});
