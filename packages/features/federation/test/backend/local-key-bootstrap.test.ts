/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createPrivateKey, createPublicKey, verify } from 'node:crypto';
import { afterEach, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { genEd25519KeyPair, parseRequestSignature } from '@misskey-dev/node-http-message-signatures';
import type * as Bull from 'bullmq';
import type * as Redis from 'ioredis';
import { SignupService } from '@features/auth/backend/services/SignupService.js';
import { SystemAccountService } from '@features/users/backend/services/SystemAccountService.js';
import { MiUser, type MiLocalUser, type MiRemoteUser } from '@features/users/backend/models/User.js';
import { MiUserKeypair } from '../../backend/models/UserKeypair.js';
import { UserKeypairService } from '../../backend/services/UserKeypairService.js';
import { ApRendererService } from '../../backend/services/ApRendererService.js';
import { ApRequestService } from '../../backend/services/ApRequestService.js';
import { ApDbResolverService } from '../../backend/services/ApDbResolverService.js';
import { InboxProcessorService } from '../../backend/jobs/InboxProcessorService.js';
import { extractActorPublicKeys } from '../../backend/protocol/misc/actor-public-keys.js';
import type { IActor } from '../../backend/protocol/type.js';
import type { InboxJobData } from '@features/runtime/backend/queue/types.js';
import type { UserKeypairsRepository } from '@features/persistence/backend/repositories/models.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';

vi.mock('@misskey-dev/node-http-message-signatures', async importOriginal => {
	const actual = await importOriginal<typeof import('@misskey-dev/node-http-message-signatures')>();
	return { ...actual, genEd25519KeyPair: vi.fn(actual.genEd25519KeyPair) };
});

afterEach(() => { vi.mocked(genEd25519KeyPair).mockClear(); });

function transactionFixture() {
	const saved: object[] = [];
	let account = new MiUser({ id: 'alice' });
	const manager = {
		findOneBy: vi.fn(async (): Promise<MiUser | null> => null),
		save: vi.fn(async (entity: object) => { saved.push(entity); return entity; }),
		insert: vi.fn(async (target: unknown, data: Record<string, unknown>) => {
			if (target === MiUser) account = Object.assign(new MiUser({}), data);
			saved.push(target === MiUserKeypair ? Object.assign(new MiUserKeypair({}), data) : data);
			return { identifiers: [{ id: account.id }] };
		}),
		findOneByOrFail: vi.fn(async () => account),
	};
	const transaction = vi.fn(async (callback: (value: typeof manager) => Promise<void>) => { await callback(manager); });
	return { saved, manager, transaction };
}

function signupFixture() {
	const tx = transactionFixture();
	const service: SignupService = Object.assign(Object.create(SignupService.prototype), {
		db: { transaction: tx.transaction }, meta: { rootUserId: null },
		usersRepository: { exists: async () => false }, usedUsernamesRepository: { exists: async () => false },
		userEntityService: { validateLocalUsername: () => true }, utilityService: { toPunyNullable: () => null },
		idService: { gen: () => 'alice' }, usersChart: { update: vi.fn() }, userService: { notifySystemWebhook: vi.fn() }, metaService: { update: vi.fn() },
	});
	return { ...tx, service };
}

function systemFixture(existing: MiLocalUser | null = null) {
	const tx = transactionFixture();
	const service: SystemAccountService = Object.assign(Object.create(SystemAccountService.prototype), {
		db: { transaction: tx.transaction }, meta: { name: 'test instance' },
		cache: { get: () => null, set: vi.fn() },
		systemAccountsRepository: { findOne: async () => existing ? { user: existing } : null },
		idService: { gen: () => 'alice' },
	});
	return { ...tx, service };
}

async function assertFirstActorAndEdDelivery(keypair: MiUserKeypair) {
	const uri = 'https://sender.example/users/alice';
	const publicKey = createPublicKey(keypair.publicKey);
	expect(publicKey.asymmetricKeyType).toBe('rsa');
	expect(createPrivateKey(keypair.privateKey).asymmetricKeyType).toBe('rsa');
	expect(createPublicKey(keypair.ed25519PublicKey!).asymmetricKeyType).toBe('ed25519');
	expect(createPrivateKey(keypair.ed25519PrivateKey!).asymmetricKeyType).toBe('ed25519');
	const user = mock<MiLocalUser>({ id: 'alice', username: 'alice', host: null, emojis: [], tags: [], avatarId: null, bannerId: null, movedToUri: null, alsoKnownAs: [] });
	const renderer: ApRendererService = Object.assign(Object.create(ApRendererService.prototype), {
		config: { url: 'https://sender.example' }, userEntityService: { genLocalUserUri: () => uri, getIdenticonUrl: () => `${uri}/icon` },
		userProfilesRepository: { findOneByOrFail: async () => ({ fields: [], description: null }) },
		userKeypairService: { getUserKeypair: async () => keypair },
	});
	const actor = JSON.parse(JSON.stringify(await renderer.renderPerson(user))) as IActor;
	const published = extractActorPublicKeys(actor, value => new URL(value).hostname)!;
	expect(published.keys.map(key => key.keyId).sort()).toEqual([`${uri}#ed25519-key`, `${uri}#main-key`]);
	const repository = mock<UserKeypairsRepository>();
	repository.findOneByOrFail.mockResolvedValue(keypair);
	const users = mock<UserEntityService>();
	users.genLocalUserUri.mockReturnValue(uri);
	const keys = new UserKeypairService(mock<Redis.Redis>(), mock<Redis.Redis>(), repository, mock<GlobalEventService>(), users);
	const remote = mock<MiRemoteUser>({ id: 'remote-alice', uri, host: 'sender.example', isDeleted: false, lastFetchedAt: new Date() });
	const renew = vi.fn();
	const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
	const resolver: ApDbResolverService = Object.assign(Object.create(ApDbResolverService.prototype), {
		logger, utilityService: { punyHost: (value: string) => new URL(value).hostname },
		apPersonService: { resolvePerson: async () => remote, fetchPersonWithRenewal: renew },
		publicKeyByUserIdCache: { fetch: async () => published.keys, getRaw: () => ({ date: Date.now() }), delete: vi.fn() },
	});
	const perform = vi.fn(async () => 'ok');
	const processor: InboxProcessorService = Object.assign(Object.create(InboxProcessorService.prototype), {
		logger, apDbResolverService: resolver,
		utilityService: { toPuny: (value: string) => value, isFederationAllowedHost: () => true, extractDbHost: (value: string) => new URL(value).hostname },
		apRequestChart: { inbox: vi.fn() }, federationChart: { inbox: vi.fn() },
		meta: {}, federatedInstanceService: { fetch: async () => null }, apInboxService: { performActivity: perform },
	});
	const queued = mock<Bull.Job<InboxJobData>>();
	const sender: ApRequestService = Object.assign(Object.create(ApRequestService.prototype), {
		userKeypairService: keys,
		httpRequestService: { send: async (url: string, request: { method: string; headers: Record<string, string>; body: string }) => {
			const signature = parseRequestSignature({ url, ...request, headers: { ...request.headers, host: new URL(url).host } });
			if (signature.version !== 'draft') throw new Error('Expected draft signature');
			expect(signature.value.keyId).toBe(`${uri}#ed25519-key`);
			expect(verify(null, Buffer.from(signature.value.signingString), createPublicKey(keypair.ed25519PublicKey!), Buffer.from(signature.value.params.signature, 'base64'))).toBe(true);
			Object.defineProperty(queued, 'data', { value: { activity: JSON.parse(request.body), signature: signature.value } });
		} },
	});
	try {
		const activity = { id: 'https://sender.example/activity/1', type: 'Create', actor: uri, object: { id: 'https://sender.example/notes/1', type: 'Note', attributedTo: uri } };
		await sender.signedPost({ id: 'alice' }, 'https://receiver.example/inbox', activity, undefined, { level: '02' });
		await expect(processor.process(queued)).resolves.toBe('ok');
		expect(perform).toHaveBeenCalledOnce();
		expect(perform).toHaveBeenCalledWith(remote, activity);
		expect(renew).not.toHaveBeenCalled();
	} finally { keys.dispose(); }
}

test('signup commits RSA and Ed together before the first Actor output and cached-key Ed delivery', async () => {
	const fixture = signupFixture();
	await fixture.service.signup({ username: 'alice', passwordHash: null });
	expect(fixture.transaction).toHaveBeenCalledOnce();
	const keypair = fixture.saved.find(value => value instanceof MiUserKeypair) as MiUserKeypair;
	expect(keypair.userId).toBe('alice');
	expect(vi.mocked(genEd25519KeyPair)).toHaveBeenCalledOnce();
	await assertFirstActorAndEdDelivery(keypair);
});

test('system account creation commits RSA and Ed together before first publication and cached-key verification', async () => {
	const fixture = systemFixture();
	const account = await fixture.service.fetch('actor');
	expect(account.id).toBe('alice');
	expect(fixture.transaction).toHaveBeenCalledOnce();
	const keypair = fixture.saved.find(value => value instanceof MiUserKeypair) as MiUserKeypair;
	expect(keypair.userId).toBe(account.id);
	expect(vi.mocked(genEd25519KeyPair)).toHaveBeenCalledOnce();
	await assertFirstActorAndEdDelivery(keypair);
});

test('signup Ed generation failure occurs before transaction or account commit', async () => {
	const fixture = signupFixture();
	const failure = new Error('Ed generation failed');
	vi.mocked(genEd25519KeyPair).mockRejectedValueOnce(failure);
	await expect(fixture.service.signup({ username: 'alice', passwordHash: null })).rejects.toBe(failure);
	expect(fixture.transaction).not.toHaveBeenCalled();
	expect(fixture.saved).toEqual([]);
});

test('system account Ed generation failure occurs before transaction or account commit', async () => {
	const fixture = systemFixture();
	const failure = new Error('Ed generation failed');
	vi.mocked(genEd25519KeyPair).mockRejectedValueOnce(failure);
	await expect(fixture.service.fetch('actor')).rejects.toBe(failure);
	expect(fixture.transaction).not.toHaveBeenCalled();
	expect(fixture.saved).toEqual([]);
});

test('existing system account keeps legacy keys without generating or saving Ed material', async () => {
	const existing = mock<MiLocalUser>({ id: 'legacy', username: 'system.actor', host: null });
	const fixture = systemFixture(existing);
	await expect(fixture.service.fetch('actor')).resolves.toBe(existing);
	expect(genEd25519KeyPair).not.toHaveBeenCalled();
	expect(fixture.transaction).not.toHaveBeenCalled();
	expect(fixture.saved).toEqual([]);
});

test('system account creation race preserves the existing username account without replacing keys', async () => {
	const existing = new MiUser({ id: 'legacy', username: 'system.actor', host: null });
	const fixture = systemFixture();
	fixture.manager.findOneBy.mockResolvedValueOnce(existing);
	await expect(fixture.service.fetch('actor')).resolves.toBe(existing);
	// Key generation precedes the transaction, but the winning existing account is never rewritten.
	expect(genEd25519KeyPair).toHaveBeenCalledOnce();
	expect(fixture.transaction).toHaveBeenCalledOnce();
	expect(fixture.manager.insert).not.toHaveBeenCalled();
	expect(fixture.manager.save).not.toHaveBeenCalled();
	expect(fixture.saved).toEqual([]);
});
