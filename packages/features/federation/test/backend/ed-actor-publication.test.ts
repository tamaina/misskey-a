/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createPublicKey, generateKeyPairSync } from 'node:crypto';
import { expect, test, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';
import type { ModuleRef } from '@nestjs/core';
import { EntityManager, FindOperator } from 'typeorm';
import { AccountUpdateService } from '@features/users/backend/services/AccountUpdateService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { FollowingsRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import { ApDeliverManagerService } from '../../backend/services/ApDeliverManagerService.js';
import { UserKeypairService } from '../../backend/services/UserKeypairService.js';
import { RelayService } from '../../backend/services/RelayService.js';
import { ApRendererService } from '../../backend/services/ApRendererService.js';
import { MiUserKeypair } from '../../backend/models/UserKeypair.js';
import { extractActorPublicKeys, storeActorPublicKeys } from '../../backend/protocol/misc/actor-public-keys.js';
import type { IActivity, IActor } from '../../backend/protocol/type.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const uri = 'https://sender.example/users/alice';
const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ed = generateKeyPairSync('ed25519');
const rsaPublic = rsa.publicKey.export({ format: 'pem', type: 'spki' }).toString();
const edPublic = ed.publicKey.export({ format: 'pem', type: 'spki' }).toString();

test.each([false, true])('actual Actor renderer publishes RSA and available Ed assertionMethods: Ed=%s', async withEd => {
	const keypair = new MiUserKeypair({ userId: 'alice', publicKey: rsaPublic, privateKey: rsa.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
		ed25519PublicKey: withEd ? edPublic : null, ed25519PrivateKey: withEd ? ed.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() : null });
	const user = mock<MiLocalUser>({ id: 'alice', username: 'alice', host: null, emojis: [], tags: [], avatarId: null, bannerId: null, movedToUri: null, alsoKnownAs: [] });
	const renderer: ApRendererService = Object.assign(Object.create(ApRendererService.prototype), {
		config: { url: 'https://sender.example' },
		userEntityService: { genLocalUserUri: () => uri, getIdenticonUrl: () => 'https://sender.example/identicon/alice' },
		userProfilesRepository: { findOneByOrFail: async () => ({ fields: [], description: null }) },
		userKeypairService: { getUserKeypair: vi.fn(async () => keypair) },
	});
	// Keep wire material plain, like the Actor HTTP response and Actor Update payload.
	const actor = JSON.parse(JSON.stringify(await renderer.renderPerson(user))) as IActor;
	expect(actor.publicKey).toMatchObject({ id: `${uri}#main-key`, owner: uri, publicKeyPem: rsaPublic });
	expect(actor.assertionMethod).toHaveLength(withEd ? 2 : 1);
	expect(actor.assertionMethod).toEqual(expect.arrayContaining([
		expect.objectContaining({ id: `${uri}#main-key`, type: 'Multikey', controller: uri }),
		...(withEd ? [expect.objectContaining({ id: `${uri}#ed25519-key`, type: 'Multikey', controller: uri })] : []),
	]));
	const decoded = extractActorPublicKeys(actor, value => new URL(value).hostname);
	expect(decoded?.replace).toBe(true);
	expect(decoded?.keys.map(key => key.keyId).sort()).toEqual((withEd ? [`${uri}#main-key`, `${uri}#ed25519-key`] : [`${uri}#main-key`]).sort());
	for (const key of decoded!.keys) {
		const expected = key.keyId.endsWith('#main-key') ? rsa : ed;
		expect(createPublicKey(key.keyPem).export({ type: 'spki', format: 'der' })).toEqual(expected.publicKey.export({ type: 'spki', format: 'der' }));
	}
	expect(JSON.stringify(actor)).not.toContain('PRIVATE KEY');
	expect(actor).not.toHaveProperty('additionalPublicKeys');
});

test('actual Relay delivery awaits forced RSA enqueueing and exposes enqueue rejection', async () => {
	const user = { id: 'alice', host: null } as const;
	const activity: IActivity = { id: `${uri}/updates/1`, type: 'Update', actor: uri, object: { id: uri, type: 'Person' } };
	let release!: () => void;
	let entered!: () => void;
	const enqueued = new Promise<void>(resolve => { release = resolve; });
	const queueEntered = new Promise<void>(resolve => { entered = resolve; });
	const deliver = vi.fn(() => { entered(); return enqueued; });
	const signed = { ...activity, to: ['https://www.w3.org/ns/activitystreams#Public'], signature: { type: 'RsaSignature2017', creator: `${uri}#main-key`, signatureValue: 'renderer-fixture' } };
	const attachLdSignature = vi.fn(async (_activity: IActivity, _user: typeof user) => signed);
	const service: RelayService = Object.assign(Object.create(RelayService.prototype), {
		relaysCache: { fetch: async () => [{ inbox: 'https://relay.example/inbox' }] },
		apRendererService: { attachLdSignature }, queueService: { deliver },
	});
	let settled = false;
	const publication = service.deliverToRelays(user, activity, true);
	const observed = publication.then(() => { settled = true; });
	await queueEntered;
	expect(settled).toBe(false);
	expect(attachLdSignature).toHaveBeenCalledWith({ ...activity, to: ['https://www.w3.org/ns/activitystreams#Public'] }, user);
	expect(deliver).toHaveBeenCalledOnce();
	expect(deliver).toHaveBeenCalledWith(user, signed, 'https://relay.example/inbox', false, true);
	expect(activity).not.toHaveProperty('to');
	release();
	await observed;
	expect(settled).toBe(true);
	const failure = new Error('relay enqueue unavailable');
	deliver.mockRejectedValueOnce(failure);
	await expect(service.deliverToRelays(user, activity, true)).rejects.toBe(failure);
	expect(deliver).toHaveBeenLastCalledWith(user, signed, 'https://relay.example/inbox', false, true);
});

test('first normal profile Update renders after preparation and both Updates retain receiver Ed keys', async () => {
	const keypair = new MiUserKeypair({ userId: 'alice', publicKey: rsaPublic, privateKey: rsa.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), ed25519PublicKey: null, ed25519PrivateKey: null });
	const user = mock<MiLocalUser>({ id: 'alice', username: 'alice', host: null, isDeleted: false, emojis: [], tags: [], avatarId: null, bannerId: null, movedToUri: null, alsoKnownAs: [] });
	const keys = mockDeep<UserKeypairService>();
	keys.getUserKeypair.mockImplementation(async () => keypair);
	keys.refreshAndPrepareEd25519KeyPair.mockImplementation(async () => {
		if (keypair.ed25519PublicKey) return;
		keypair.ed25519PublicKey = edPublic;
		keypair.ed25519PrivateKey = ed.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
		return keypair;
	});
	const entity = mockDeep<UserEntityService>();
	entity.genLocalUserUri.mockReturnValue(uri);
	entity.getIdenticonUrl.mockReturnValue('https://sender.example/identicon/alice');
	entity.isLocalUser.mockReturnValue(true);
	const renderer: ApRendererService = Object.assign(Object.create(ApRendererService.prototype), {
		config: { url: 'https://sender.example' }, userEntityService: entity,
		userProfilesRepository: { findOneByOrFail: async () => ({ fields: [], description: null }) }, userKeypairService: keys,
	});
	const renderPerson = vi.spyOn(renderer, 'renderPerson');
	const queue = mockDeep<QueueService>();
	const payloads: { activity: IActivity; forced: boolean }[] = [];
	queue.deliverMany.mockImplementation(async (_actor, activity, _inboxes, forced = false) => {
		if (!activity) throw new Error('Missing Actor Update');
		payloads.push({ activity: JSON.parse(JSON.stringify(activity)) as IActivity, forced });
		return null;
	});
	const followings = mockDeep<FollowingsRepository>();
	followings.find.mockResolvedValue([]);
	const moduleRef = mock<ModuleRef>();
	const delivery: ApDeliverManagerService = Object.assign(Object.create(ApDeliverManagerService.prototype), {
		keyPreparations: new Map(), failedKeyPublications: new Set(), userKeypairService: keys, moduleRef,
		queueService: queue, followingsRepository: followings, logger: mockDeep<Logger>(),
	});
	const users = mockDeep<UsersRepository>();
	users.findOneBy.mockResolvedValue(user);
	const relay = mockDeep<RelayService>();
	relay.deliverToRelays.mockResolvedValue(undefined);
	const account = new AccountUpdateService(users, entity, renderer, delivery, relay);
	moduleRef.get.mockReturnValue(account);
	await account.publishToFollowers(user.id);
	await vi.waitFor(() => expect(payloads).toHaveLength(2));
	expect(payloads.map(payload => payload.forced)).toEqual([true, false]);
	expect(renderPerson).toHaveBeenCalledTimes(2);
	expect(keys.refreshAndPrepareEd25519KeyPair).toHaveBeenCalledTimes(2);
	// The real receiver extraction/storage path would remove omitted keys from a complete Actor collection.
	const stored = new Map<string, string>();
	const persistence = mock<EntityManager>();
	persistence.query.mockImplementation(async (_sql, parameters?: unknown) => {
		if (!Array.isArray(parameters)) throw new Error('Missing key parameters');
		const [id, owner, pem] = parameters;
		if (typeof id !== 'string' || owner !== user.id || typeof pem !== 'string') throw new Error('Invalid key parameters');
		stored.set(id, pem);
	});
	persistence.delete.mockImplementation(async (_entity, criteria) => {
		const removal = criteria as { userId: string; keyId: FindOperator<string[]> };
		expect(removal.userId).toBe(user.id);
		expect(removal.keyId.type).toBe('not');
		const retained = removal.keyId.value;
		for (const id of stored.keys()) if (!retained.includes(id)) stored.delete(id);
		return { raw: [], affected: 0 };
	});
	for (const payload of payloads) {
		const actor = payload.activity.object as IActor;
		const collection = extractActorPublicKeys(actor, value => new URL(value).hostname);
		expect(collection?.replace).toBe(true);
		expect(collection?.keys.map(key => key.keyId).sort()).toEqual([`${uri}#ed25519-key`, `${uri}#main-key`]);
		await storeActorPublicKeys(persistence, user.id, collection!);
		expect(stored.get(`${uri}#ed25519-key`)).toBe(edPublic);
		expect(stored.size).toBe(2);
	}
	expect(persistence.findOneOrFail).toHaveBeenCalledTimes(2);
	expect(relay.deliverToRelays.mock.calls.map(call => call[2])).toEqual([true, false]);
});
