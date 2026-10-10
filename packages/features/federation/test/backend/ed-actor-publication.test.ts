/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createPublicKey, generateKeyPairSync } from 'node:crypto';
import { expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { RelayService } from '../../backend/services/RelayService.js';
import { ApRendererService } from '../../backend/services/ApRendererService.js';
import { MiUserKeypair } from '../../backend/models/UserKeypair.js';
import { extractActorPublicKeys } from '../../backend/protocol/misc/actor-public-keys.js';
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
